import { NextRequest, NextResponse } from 'next/server';
import { db, products } from '@/db';
import { generateSKU, logger } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products: importData, organizationId: orgId } = body;

    if (!Array.isArray(importData) || importData.length === 0) {
      return NextResponse.json({ error: 'No products provided', success: false }, { status: 400 });
    }

    if (importData.length > 1000) {
      return NextResponse.json({ error: 'Max 1000 products per import', success: false }, { status: 400 });
    }

    const org = orgId || 'demo-org';
    const insertData = importData.map((p: any) => ({
      organizationId: org,
      name: p.name?.trim() || 'Unnamed Product',
      sku: p.sku || generateSKU(p.name || 'product'),
      currentPrice: p.currentPrice ? String(p.currentPrice) : null,
      costPrice: p.costPrice ? String(p.costPrice) : null,
      currency: p.currency || 'EUR',
      category: p.category || null,
      source: 'csv',
      externalId: p.externalId || null,
    }));

    const inserted = await db.insert(products).values(insertData).returning();

    logger.info(`Imported ${inserted.length} products via CSV`, 'api/import', { count: inserted.length });

    return NextResponse.json({
      success: true,
      imported: inserted.length,
      products: inserted,
    }, { status: 201 });
  } catch (error: any) {
    logger.error('CSV import failed', 'api/import', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}
