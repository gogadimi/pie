import { NextRequest, NextResponse } from 'next/server';
import { analyzePricing } from '@/lib/ai/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productName, currentPrice, costPrice, currency, competitors, marginTarget } = body;

    if (!productName || !currentPrice || !competitors) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await analyzePricing({
      productName,
      currentPrice,
      costPrice: costPrice || null,
      currency: currency || 'USD',
      competitorPrices: competitors,
      marginTarget: marginTarget || 20,
    });

    return NextResponse.json({ success: true, recommendation: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'AI Recommendations API' });
}
