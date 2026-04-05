import { NextRequest, NextResponse } from 'next/server';
import { db, priceRecords, competitors, products } from '@/db';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const competitorId = searchParams.get('competitorId');
    const orgId = searchParams.get('orgId');

    if (!productId && !competitorId) {
      return NextResponse.json({ error: 'productId or competitorId required' }, { status: 400 });
    }

    // Get date range
    const days = parseInt(searchParams.get('days') || '30');
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let conditions = [];
    if (productId) conditions.push(eq(priceRecords.productId, productId));
    if (competitorId) conditions.push(eq(priceRecords.competitorId, competitorId));
    conditions.push(gte(priceRecords.scrapedAt, from));

    const records = await db
      .select({
        id: priceRecords.id,
        price: priceRecords.price,
        originalPrice: priceRecords.originalPrice,
        discountPct: priceRecords.discountPct,
        inStock: priceRecords.inStock,
        currency: priceRecords.currency,
        scrapedAt: priceRecords.scrapedAt,
        competitorName: competitors.name,
        productName: products.name,
        competitorUrl: competitors.url,
      })
      .from(priceRecords)
      .leftJoin(competitors, eq(competitors.id, priceRecords.competitorId))
      .leftJoin(products, eq(products.id, priceRecords.productId))
      .where(and(...conditions))
      .orderBy(desc(priceRecords.scrapedAt))
      .limit(500);

    return NextResponse.json({ success: true, records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, competitorId, price, originalPrice, discountPct, inStock, currency, competitorUrl } = body;

    if (!productId || !price) {
      return NextResponse.json({ error: 'productId and price required' }, { status: 400 });
    }

    const [record] = await db
      .insert(priceRecords)
      .values({
        productId,
        competitorId,
        price: String(price),
        originalPrice: originalPrice ? String(originalPrice) : null,
        discountPct: discountPct ? String(discountPct) : null,
        inStock: inStock ?? true,
        currency: currency || 'EUR',
        competitorUrl,
      })
      .returning();

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
