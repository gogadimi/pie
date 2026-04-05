import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { validateProduct } from '@/lib/validators';
import { generateSKU, logger } from '@/lib/utils';

// GET /api/products — List all products for current org
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || 'demo-org';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        sku: schema.products.sku,
        currentPrice: schema.products.currentPrice,
        costPrice: schema.products.costPrice,
        currency: schema.products.currency,
        category: schema.products.category,
        source: schema.products.source,
        createdAt: schema.products.createdAt,
      })
      .from(schema.products)
      .where(eq(schema.products.organizationId, orgId))
      .orderBy(desc(schema.products.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const total = await db
      .select({ count: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.organizationId, orgId));

    return NextResponse.json({
      success: true,
      products: result,
      pagination: {
        page,
        limit,
        total: total.length,
        hasNext: result.length >= limit,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch products', 'api/products', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products — Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateProduct(body);

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, errors: validation.errors },
        { status: 400 }
      );
    }

    const v = validation.data!;
    const orgId = body.organizationId || 'demo-org';
    const sku = v.sku || generateSKU(v.name);

    const [newProduct] = await db
      .insert(schema.products)
      .values({
        organizationId: orgId,
        name: v.name,
        sku,
        currentPrice: v.currentPrice,
        costPrice: v.costPrice,
        currency: v.currency,
        category: v.category,
        source: v.source,
      })
      .returning();

    logger.info(`Product created: ${v.name}`, 'api/products', { id: newProduct.id });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    logger.error('Failed to create product', 'api/products', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
