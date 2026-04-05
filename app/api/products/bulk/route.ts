import { NextRequest, NextResponse } from 'next/server';
import { db, products, priceRecords, priceRecommendations } from '@/db';
import { inArray } from 'drizzle-orm';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No product IDs provided' }, { status: 400 });
    }
    await db.delete(priceRecommendations).where(inArray(priceRecommendations.productId, ids));
    await db.delete(priceRecords).where(inArray(priceRecords.productId, ids));
    await db.delete(products).where(inArray(products.id, ids));
    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, updates } = body;
    if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: 'No product IDs' }, { status: 400 });
    const updateData: Record<string, string> = {};
    if (updates.category) updateData.category = updates.category;
    if (updates.currency) updateData.currency = updates.currency;
    if (Object.keys(updateData).length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
    const updated = await db.update(products).set(updateData).where(inArray(products.id, ids)).returning({ id: products.id, name: products.name });
    return NextResponse.json({ success: true, updated: updated.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
