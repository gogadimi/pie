import { Queue } from 'bullmq';
import { redis } from './redis';

export const scrapeQueue = new Queue('scrape-queue', {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400, // keep for 24 hours
    },
    removeOnFail: {
      age: 604800, // keep for 7 days
    },
  },
});

export async function addScrapeJob(data: {
  url: string;
  competitorId: string;
  productId: string;
  organizationId: string;
}) {
  await scrapeQueue.add('scrape-url', data);
}
