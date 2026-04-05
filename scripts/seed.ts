#!/usr/bin/env tsx
/**
 * Seed Database with Demo Data
 * Run: npx tsx scripts/seed.ts
 */
import { db } from '../db';
import { organizations, products, competitors, alerts } from '../db/schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // Check if already seeded
  const existingOrgs = await db.select().from(organizations).limit(1);
  if (existingOrgs.length > 0) {
    console.log('⚠️  Database already has data. Skipping seed.');
    return;
  }

  console.log('📦 Creating organization...');
  const [org] = await db.insert(organizations).values({
    name: 'Demo Store',
    plan: 'pro',
  }).returning();

  console.log(`✅ Organization: ${org.name} (${org.id})`);

  console.log('📦 Creating products...');
  const demoProducts = [
    { name: 'MacBook Air M3 15"', sku: 'MBA-M3-15-256', currentPrice: '1299', costPrice: '950', currency: 'USD', category: 'Laptops' },
    { name: 'iPhone 16 Pro 256GB', sku: 'IP16P-256-BLK', currentPrice: '1099', costPrice: '720', currency: 'USD', category: 'Smartphones' },
    { name: 'Sony WH-1000XM5', sku: 'SNY-WH1000XM5-B', currentPrice: '279', costPrice: '155', currency: 'USD', category: 'Headphones' },
    { name: 'AirPods Pro (2nd Gen)', sku: 'APP-AIRPODS-PRO2', currentPrice: '199', costPrice: '120', currency: 'USD', category: 'Earbuds' },
    { name: 'iPad Pro 12.9" M2', sku: 'IPP-M2-129-256', currentPrice: '1099', costPrice: '780', currency: 'USD', category: 'Tablets' },
    { name: 'Apple Watch Ultra 2', sku: 'AWU-2-49-BLK', currentPrice: '799', costPrice: '480', currency: 'USD', category: 'Wearables' },
  ];

  const insertedProducts = await db.insert(products).values(
    demoProducts.map(p => ({ ...p, organizationId: org.id }))
  ).returning();

  console.log(`✅ ${insertedProducts.length} products created`);

  console.log('📦 Creating competitors...');
  const demoCompetitors = [
    { name: 'Amazon', url: 'https://amazon.com', industry: 'Marketplace' },
    { name: 'Best Buy', url: 'https://bestbuy.com', industry: 'Retail' },
    { name: 'Walmart', url: 'https://walmart.com', industry: 'Retail' },
    { name: 'Target', url: 'https://target.com', industry: 'Retail' },
    { name: 'Costco', url: 'https://costco.com', industry: 'Wholesale' },
    { name: 'Newegg', url: 'https://newegg.com', industry: 'Marketplace' },
  ];

  const insertedCompetitors = await db.insert(competitors).values(
    demoCompetitors.map(c => ({ ...c, organizationId: org.id }))
  ).returning();

  console.log(`✅ ${insertedCompetitors.length} competitors created`);

  console.log('📦 Creating sample alerts...');
  await db.insert(alerts).values([
    { organizationId: org.id, type: 'price_drop', message: 'Amazon dropped MacBook Air price by 7.7%', severity: 'high' },
    { organizationId: org.id, type: 'promo_detected', message: 'Best Buy started 30% flash sale on Sony headphones', severity: 'medium' },
    { organizationId: org.id, type: 'price_increase', message: 'Target increased iPhone price by 15%', severity: 'low' },
    { organizationId: org.id, type: 'price_drop', message: 'Amazon dropped AirPods Pro to historical low ($169)', severity: 'critical' },
    { organizationId: org.id, type: 'out_of_stock', message: 'Walmart is out of stock on MacBook Air', severity: 'medium' },
  ]);

  console.log('✅ 5 sample alerts created');
  console.log('\n🌱 ✅ Seed complete!');
  console.log(`📊 Org: ${org.name} (${org.id})`);
  console.log(`📦 ${insertedProducts.length} products, ${insertedCompetitors.length} competitors`);
}

seed().catch(console.error);
