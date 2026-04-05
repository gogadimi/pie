import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { competitors } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { validateCompetitor } from '@/lib/validators';
import { logger } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || 'demo-org';
    
    const db = getDb();
    const result = await db
      .select()
      .from(competitors)
      .where(eq(competitors.organizationId, orgId))
      .orderBy(desc(competitors.createdAt));

    return NextResponse.json({ success: true, competitors: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateCompetitor(body);
    
    if (!validation.valid) {
      return NextResponse.json({ errors: validation.errors }, { status: 400 });
    }

    const v = validation.data!;
    const orgId = body.organizationId || 'demo-org';
    
    const db = getDb();
    const [newComp] = await db
      .insert(competitors)
      .values({
        organizationId: orgId,
        name: v.name,
        url: v.url,
        industry: v.industry,
      })
      .returning();

    return NextResponse.json({ success: true, competitor: newComp }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
