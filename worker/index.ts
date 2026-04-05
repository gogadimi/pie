/**
 * Scraping Worker Process
 * Processes BullMQ scrape jobs using the ScrapingEngine
 * Saves results to the database and publishes real-time events via Redis.
 */
import { Worker, Job } from 'bullmq';
import { sql } from 'drizzle-orm';
import { redis } from '../lib/redis';
import { scrapingEngine } from '../lib/scraper/engine';
import { ScrapeJobData } from '../lib/scraper/types';
import { db } from '../db';
import { priceRecords } from '../db/schema';
import {
  publishPriceUpdate,
  publishScrapeJob,
  publishAlert,
} from '../lib/realtime/pubsub';

async function processScrapeJob(job: Job) {
  const data = job.data as ScrapeJobData;
  console.log(`🕷️  Processing scrape job #${job.id}: ${data.url}`);
  
  // Update job status to 'running' in DB if scraping_jobs row exists
  try {
    await db.execute(sql`
      UPDATE scraping_jobs
      SET status = 'running', last_run = NOW()
      WHERE id = ${data.competitorId}::uuid
    `);
  } catch {
    // Non-critical — the job row may not exist yet
  }
  
  // Publish running status event
  try {
    await publishScrapeJob(data.organizationId, {
      jobId: job.id?.toString() || 'unknown',
      competitorId: data.competitorId,
      competitorUrl: data.url,
      status: 'running',
    });
  } catch (err) {
    console.warn('⚠️  Failed to publish running job event:', err);
  }

  try {
    const result = await scrapingEngine.scrape(
      data.url,
      data.productId,
      data.competitorId,
      data.organizationId
    );

    if (result.success && result.data) {
      console.log(`✅ Scrape successful: ${result.data.productName} - ${result.data.currency}${result.data.price}`);
      
      // Save to DB
      try {
        await db.insert(priceRecords).values({
          productId: data.productId,
          competitorId: data.competitorId,
          competitorUrl: data.url,
          price: String(result.data.price),
          originalPrice: result.data.originalPrice ? String(result.data.originalPrice) : null,
          discountPct: result.data.discountPct ? String(result.data.discountPct) : null,
          inStock: result.data.inStock,
          currency: result.data.currency,
          scrapedAt: new Date(),
        });
        console.log('💾 Price record saved to database');
      } catch (dbError) {
        console.error('❌ Failed to save price record:', dbError);
        // Continue — don't fail the job just because the DB write failed
      }
      
      // Publish price update event
      try {
        await publishPriceUpdate(data.organizationId, {
          productId: data.productId,
          competitorId: data.competitorId,
          competitorUrl: data.url,
          price: result.data.price,
          originalPrice: result.data.originalPrice,
          discountPct: result.data.discountPct,
          inStock: result.data.inStock,
          currency: result.data.currency,
          productName: result.data.productName,
          strategy: result.strategy,
          duration: result.duration,
        });
      } catch (pubError) {
        console.warn('⚠️  Failed to publish price event:', pubError);
      }

      // Publish completed job event
      try {
        await publishScrapeJob(data.organizationId, {
          jobId: job.id?.toString() || 'unknown',
          competitorId: data.competitorId,
          competitorUrl: data.url,
          status: 'completed',
          price: result.data.price ?? undefined,
          productName: result.data.productName,
          strategy: result.strategy,
          duration: result.duration,
        });
      } catch (pubError) {
        console.warn('⚠️  Failed to publish job completed event:', pubError);
      }

      // Update scraping_jobs table
      try {
        await db.execute(sql`
          UPDATE scraping_jobs
          SET status = 'completed',
              last_run = NOW(),
              error_message = NULL
          WHERE competitor_id = ${data.competitorId}::uuid
        `);
      } catch {
        // non-critical
      }
      
      return {
        success: true,
        price: result.data.price,
        productName: result.data.productName,
        strategy: result.strategy,
        duration: result.duration,
      };
    } else {
      console.warn(`⚠️  Scrape incomplete: ${result.error}`);
      
      // Fail if max retries exceeded
      if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
        throw new Error(result.error || 'All strategies failed');
      }
      
      // Publish failed job event
      try {
        await publishScrapeJob(data.organizationId, {
          jobId: job.id?.toString() || 'unknown',
          competitorId: data.competitorId,
          competitorUrl: data.url,
          status: 'failed',
          errorMessage: result.error,
          strategy: result.strategy,
        });
      } catch {
        // non-critical
      }
      
      // Update scraping_jobs
      try {
        await db.execute(sql`
          UPDATE scraping_jobs
          SET status = 'failed',
              last_run = NOW(),
              error_message = ${result.error || 'Incomplete scrape'}::text,
              retry_count = COALESCE(retry_count, 0) + 1
          WHERE competitor_id = ${data.competitorId}::uuid
        `);
      } catch {
        // non-critical
      }
      
      return { success: false, error: result.error, strategy: result.strategy };
    }
  } catch (error: any) {
    console.error(`❌ Scrape job failed: ${error.message}`);

    // Publish error event
    try {
      await publishScrapeJob(data.organizationId, {
        jobId: job.id?.toString() || 'unknown',
        competitorId: data.competitorId,
        competitorUrl: data.url,
        status: 'failed',
        errorMessage: error.message,
      });
    } catch {
      // non-critical
    }

    // Publish an alert for the failure
    try {
      await publishAlert(data.organizationId, {
        alertId: `job-error-${job.id}-${Date.now()}`,
        alertType: 'scrape_error',
        message: `Scrape job failed: ${error.message}`,
        severity: 'high',
      });
    } catch {
      // non-critical
    }

    // Update scraping_jobs
    try {
      await db.execute(sql`
        UPDATE scraping_jobs
        SET status = 'failed',
            last_run = NOW(),
            error_message = ${error.message}::text,
            retry_count = COALESCE(retry_count, 0) + 1
        WHERE competitor_id = ${data.competitorId}::uuid
      `);
    } catch {
      // non-critical
    }

    throw error;
  }
}

async function startWorker() {
  console.log('🚀 Starting scraping worker...');
  
  const worker = new Worker(
    'scrape-queue',
    processScrapeJob,
    {
      connection: redis as any,
      concurrency: 3, // 3 concurrent scrape jobs
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job #${job.id} completed in ${job.processedOn ? job.finishedOn! - job.processedOn : 0}ms`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job #${job?.id} failed: ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error('🔥 Worker error:', err);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('🛑 Shutting down worker...');
    await worker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('🛑 Shutting down worker...');
    await worker.close();
    process.exit(0);
  });

  console.log('✅ Scraping worker is running!');
  
  // Prevent the process from exiting
  return new Promise<void>((resolve) => {
    // This keeps the worker running indefinitely
  });
}

startWorker().catch(console.error);
