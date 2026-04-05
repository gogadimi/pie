import { scrapeQueue, addScrapeJob } from '../queue';

export interface ScrapeSchedule {
  competitorId: string;
  productId: string;
  organizationId: string;
  url: string;
  intervalMinutes: number;
}

/**
 * Schedule recurring scraping jobs
 */
export class ScrapeScheduler {
  private schedules: Map<string, ScrapeSchedule> = new Map();

  add(schedule: ScrapeSchedule) {
    const key = `${schedule.competitorId}-${schedule.productId}`;
    this.schedules.set(key, schedule);
    this.queueNextScrape(schedule);
  }

  remove(competitorId: string, productId: string) {
    const key = `${competitorId}-${productId}`;
    this.schedules.delete(key);
  }

  private async queueNextScrape(schedule: ScrapeSchedule) {
    await addScrapeJob({
      url: schedule.url,
      competitorId: schedule.competitorId,
      productId: schedule.productId,
      organizationId: schedule.organizationId,
      retryCount: 0,
    });

    // Re-queue after interval
    setTimeout(() => {
      if (this.schedules.has(`${schedule.competitorId}-${schedule.productId}`)) {
        this.queueNextScrape(schedule);
      }
    }, schedule.intervalMinutes * 60 * 1000);
  }

  getStatus() {
    return {
      scheduled: this.schedules.size,
      schedules: Array.from(this.schedules.values()),
    };
  }
}

export const scrapeScheduler = new ScrapeScheduler();
