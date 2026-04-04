import { pgTable, uuid, text, timestamp, decimal, boolean, integer } from 'drizzle-orm/pg-core';

// ============================================================
// Organizations (multi-tenant)
// ============================================================
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  plan: text('plan').default('starter'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================
// Products
// ============================================================
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  name: text('name').notNull(),
  sku: text('sku'),
  currentPrice: decimal('current_price', { precision: 10, scale: 2 }),
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  currency: text('currency').default('EUR'),
  category: text('category'),
  source: text('source').default('manual'), // 'manual', 'shopify', 'stripe'
  externalId: text('external_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================
// Competitors
// ============================================================
export const competitors = pgTable('competitors', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  name: text('name').notNull(),
  url: text('url'),
  industry: text('industry'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================
// Price Records (time series)
// ============================================================
export const priceRecords = pgTable('price_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id),
  competitorId: uuid('competitor_id').references(() => competitors.id),
  competitorUrl: text('competitor_url').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }),
  originalPrice: decimal('original_price', { precision: 10, scale: 2 }),
  discountPct: decimal('discount_pct', { precision: 5, scale: 2 }),
  inStock: boolean('in_stock').default(true),
  currency: text('currency').default('EUR'),
  scrapedAt: timestamp('scraped_at').defaultNow(),
});

// ============================================================
// AI Price Recommendations
// ============================================================
export const priceRecommendations = pgTable('price_recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id),
  currentPrice: decimal('current_price', { precision: 10, scale: 2 }),
  suggestedPrice: decimal('suggested_price', { precision: 10, scale: 2 }),
  reason: text('reason'),
  expectedProfitChange: decimal('expected_profit_change', { precision: 5, scale: 2 }),
  expectedVolumeChange: decimal('expected_volume_change', { precision: 5, scale: 2 }),
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
  status: text('status').default('pending'), // pending, approved, rejected, executed
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================
// Alerts
// ============================================================
export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  type: text('type').notNull(), // price_drop, price_increase, out_of_stock, promo_detected
  message: text('message').notNull(),
  severity: text('severity').default('medium'), // low, medium, high, critical
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================
// Scraping Jobs
// ============================================================
export const scrapingJobs = pgTable('scraping_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  competitorId: uuid('competitor_id').references(() => competitors.id),
  competitorUrl: text('competitor_url').notNull(),
  status: text('status').default('pending'), // pending, running, completed, failed
  lastRun: timestamp('last_run'),
  nextRun: timestamp('next_run'),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});
