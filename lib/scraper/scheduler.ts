import { addScrapeJob } from '../queue';

export interface ScrapeSchedule {
  competitorId: string;
  productId: string;
  organizationId: string;
  url: string;
  intervalMinutes: number;
}

export class ScrapeScheduler {
  private schedules: Map<string, ScrapeSchedule> = new Map();
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  add(schedule: ScrapeSchedule) {
    const key = `${schedule.competitorId}-${schedule.productId}`;
    this.schedules.set(key, schedule);
    this.queueImmediate(schedule);
    this.startRecurring(schedule);
  }

  remove(competitorId: string, productId: string) {
    const key = `${competitorId}-${productId}`;
    this.schedules.delete(key);
    const interval = this.intervals.get(key);
    if (interval) { clearInterval(interval); this.intervals.delete(key); }
  }

  private async queueImmediate(schedule: ScrapeSchedule) {
    await addScrapeJob({
      url: schedule.url,
      competitorId: schedule.competitorId,
      productId: schedule.productId,
      organizationId: schedule.organizationId,
    });
  }

  private startRecurring(schedule: ScrapeSchedule) {
    const key = `${schedule.competitorId}-${schedule.productId}`;
    const interval = setInterval(() => {
      if (this.schedules.has(key)) this.queueImmediate(schedule);
      else clearInterval(interval);
    }, schedule.intervalMinutes * 60 * 1000);
    this.intervals.set(key, interval);
  }

  getStatus() {
    return { scheduled: this.schedules.size, schedules: Array.from(this.schedules.values()) };
  }
}

export const scrapeScheduler = new ScrapeScheduler();
