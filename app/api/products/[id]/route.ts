import { NextRequest, NextResponse } from 'next/server';
import { db, products, priceRecords, competitors, priceRecommendations } from '@/db';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/products/[id] - Single product with competitors & price history
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get product
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get competitor prices for this product
    const competitorPrices = await db
      .select({
        price: priceRecords.price,
        originalPrice: priceRecords.originalPrice,
        discountPct: priceRecords.discountPct,
        inStock: priceRecords.inStock,
        scrapedAt: priceRecords.scrapedAt,
        competitorName: competitors.name,
        competitorUrl: competitors.url,
      })
      .from(priceRecords)
      .innerJoin(competitors, eq(competitors.id, priceRecords.competitorId))
      .where(eq(priceRecords.productId, id))
      .orderBy(desc(priceRecords.scrapedAt))
      .limit(20);

    // Get recommendations
    const recommendations = await db
      .select()
      .from(priceRecommendations)
      .where(eq(priceRecommendations.productId, id))
      .orderBy(desc(priceRecommendations.createdAt))
      .limit(10);

    return NextResponse.json({
      success: true,
      product,
      competitorPrices,
      recommendations,
    });
  } catch (error: any) {
    logger.error('Get product detail failed', 'api/products/[id]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, sku, currentPrice, costPrice, currency, category } = body;

    const [updated] = await db
      .update(products)
      .set({
        ...(name !== undefined && { name }),
        ...(sku !== undefined && { sku }),
        ...(currentPrice !== undefined && { currentPrice: String(currentPrice) }),
        ...(costPrice !== undefined && { costPrice: String(costPrice) }),
        ...(currency !== undefined && { currency }),
        ...(category !== undefined && { category }),
      })
      .where(eq(products.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Delete related records first
    await db.delete(priceRecommendations).where(eq(priceRecommendations.productId, id));
    await db.delete(priceRecords).where(eq(priceRecords.productId, id));

    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
