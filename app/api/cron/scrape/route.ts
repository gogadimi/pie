import { NextRequest, NextResponse } from 'next/server';
import { db, scrapingJobs } from '@/db';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    logger.info('Cron scrape triggered', 'cron/scrape');
    const pending = await db.select().from(scrapingJobs).where(eq(scrapingJobs.status, 'pending'));

    await Promise.all(pending.map(job =>
      db.update(scrapingJobs).set({ status: 'running' }).where(eq(scrapingJobs.id, job.id))
    ));

    return NextResponse.json({ success: true, pending: pending.length });
  } catch (error: any) {
    logger.error('Cron scrape failed', 'cron/scrape', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
