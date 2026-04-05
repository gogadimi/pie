import { NextRequest, NextResponse } from 'next/server';
import { db, products, competitors, priceRecords, alerts, priceRecommendations, scrapingJobs } from '@/db';
import { eq, and, count, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || 'demo-org';
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const totalProducts = await db.select({ count: count() }).from(products).where(eq(products.organizationId, orgId));
    const totalCompetitors = await db.select({ count: count() }).from(competitors).where(eq(competitors.organizationId, orgId));
    const unreadAlerts = await db.select({ count: count() }).from(alerts).where(and(eq(alerts.organizationId, orgId), eq(alerts.isRead, false)));
    const activeJobs = await db.select({ count: count() }).from(scrapingJobs).where(eq(scrapingJobs.organizationId, orgId));
    const pendingRecs = await db.select({ count: count() }).from(priceRecommendations).where(eq(priceRecommendations.status, 'pending'));

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts: totalProducts[0]?.count || 0,
        totalCompetitors: totalCompetitors[0]?.count || 0,
        unreadAlerts: unreadAlerts[0]?.count || 0,
        activeJobs: activeJobs[0]?.count || 0,
        pendingRecommendations: pendingRecs[0]?.count || 0,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
