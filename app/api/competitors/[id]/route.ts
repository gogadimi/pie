import { NextRequest, NextResponse } from 'next/server';
import { db, competitors, priceRecords, scrapingJobs } from '@/db';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const [competitor] = await db.select().from(competitors).where(eq(competitors.id, id));
    if (!competitor) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, competitor });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const [updated] = await db
      .update(competitors)
      .set({
        ...(body.name && { name: body.name }),
        ...(body.url !== undefined && { url: body.url }),
        ...(body.industry !== undefined && { industry: body.industry }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      })
      .where(eq(competitors.id, id))
      .returning();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, competitor: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await db.delete(priceRecords).where(eq(priceRecords.competitorId, id));
    await db.delete(scrapingJobs).where(eq(scrapingJobs.competitorId, id));
    const [deleted] = await db.delete(competitors).where(eq(competitors.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Competitor deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
