/**
 * Scraping Worker Process
 * Processes BullMQ scrape jobs using the ScrapingEngine
 */
import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { scrapingEngine } from '../lib/scraper/engine';
import { ScrapeJobData } from '../lib/scraper/types';

async function processScrapeJob(job: Job) {
  const data = job.data as ScrapeJobData;
  console.log(`🕷️  Processing scrape job #${job.id}: ${data.url}`);
  
  try {
    const result = await scrapingEngine.scrape(
      data.url,
      data.productId,
      data.competitorId,
      data.organizationId
    );

    if (result.success && result.data) {
      console.log(`✅ Scrape successful: ${result.data.productName} - ${result.data.currency}${result.data.price}`);
      
      // TODO: Save to DB
      // await db.insert(priceRecords).values({
      //   productId: data.productId,
      //   competitorId: data.competitorId,
      //   competitorUrl: data.url,
      //   price: String(result.data.price),
      //   originalPrice: result.data.originalPrice ? String(result.data.originalPrice) : null,
      //   discountPct: result.data.discountPct ? String(result.data.discountPct) : null,
      //   inStock: result.data.inStock,
      //   currency: result.data.currency,
      // });
      
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
      
      // Retry with backoff
      return { success: false, error: result.error, strategy: result.strategy };
    }
  } catch (error: any) {
    console.error(`❌ Scrape job failed: ${error.message}`);
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
