import { Queue } from 'bullmq';
import { redis } from './redis';

export const scrapeQueue = new Queue('scrape-queue', {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

export async function addScrapeJob(data: {
  url: string;
  competitorId: string;
  productId: string;
  organizationId: string;
  retryCount?: number;
}) {
  await scrapeQueue.add('scrape-url', data);
}
