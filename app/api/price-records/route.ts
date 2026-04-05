import { NextRequest, NextResponse } from 'next/server';
import { db, priceRecords, competitors } from '@/db';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

    const records = await db.select().from(priceRecords)
      .innerJoin(competitors, eq(competitors.id, priceRecords.competitorId))
      .where(eq(priceRecords.productId, productId))
      .orderBy(desc(priceRecords.scrapedAt))
      .limit(100);

    return NextResponse.json({ success: true, records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
