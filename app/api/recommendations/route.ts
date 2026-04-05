import { NextRequest, NextResponse } from 'next/server';
import { analyzePricing } from '@/lib/ai/client';
import { generateRecommendation } from '@/lib/ml/recommender';
import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { priceRecords, products, competitors } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productName, currentPrice, costPrice, currency, competitors: competitorList, marginTarget, ml } = body;

    // Use ML-based hybrid approach
    if (ml === true && productName && currentPrice) {
      // Build price history from competitor data
      const priceHistory = Array.from(competitorList ?? []).map((c: any, i: number) => ({
        productId: 'temp',
        competitorId: `comp-${i}`,
        competitorUrl: '',
        price: String(c.price ?? c),
        originalPrice: null,
        discountPct: null,
        inStock: true,
        currency: c.currency ?? currency ?? 'EUR',
        scrapedAt: new Date(Date.now() - i * 86400000),
        id: `temp-${i}`,
        createdAt: new Date(),
      }));

      const competitorPriceHistory = new Map<string, { price: number; scrapedAt: Date }[]>();
      for (const record of priceHistory) {
        const key = record.competitorId ?? 'self';
        if (!competitorPriceHistory.has(key)) {
          competitorPriceHistory.set(key, []);
        }
        competitorPriceHistory.get(key)!.push({
          price: parseFloat(record.price),
          scrapedAt: record.scrapedAt,
        });
      }

      try {
        const { generateMLRecommendation } = await import('@/lib/ml/recommender');
        const mlResult = generateMLRecommendation({
          currentPrice: parseFloat(currentPrice),
          costPrice: costPrice ? parseFloat(costPrice) : null,
          priceHistory,
          competitorPriceHistory,
          productName,
        });

        return NextResponse.json({
          success: true,
          recommendation: {
            suggestedPrice: mlResult.suggestedPrice,
            strategyUsed: 'ml-hybrid',
            changePct: currentPrice > 0 ? ((mlResult.suggestedPrice - currentPrice) / currentPrice) * 100 : 0,
            reason: mlResult.reasoning,
            expectedProfitChange: mlResult.expectedProfitChange,
            expectedVolumeChange: mlResult.expectedProfitChange * -0.3,
            confidence: mlResult.confidenceScore,
            risks: [],
            competitorAnalysis: JSON.stringify(mlResult.mlSignals),
            mlAnalysis: mlResult,
          },
        });
      } catch (mlError: any) {
        console.error('ML recommendation error:', mlError.message);
        // Falls through to normal AI/heuristic path
      }
    }

    // Original AI/heuristic path
    if (!productName || !currentPrice || !competitorList) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await analyzePricing({
      productName,
      currentPrice,
      costPrice: costPrice || null,
      currency: currency || 'USD',
      competitorPrices: competitorList,
      marginTarget: marginTarget || 20,
    });

    return NextResponse.json({ success: true, recommendation: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const organizationId = searchParams.get('organizationId');
    const mlParam = searchParams.get('ml');

    // If productId provided, attempt ML recommendation from database
    if (productId && (mlParam === 'true' || !mlParam)) {
      try {
        const mlRec = await generateRecommendation(productId, organizationId ?? undefined);
        if (mlRec) {
          return NextResponse.json({
            success: true,
            source: 'ml-hybrid',
            recommendation: mlRec,
          });
        }
      } catch (dbError) {
        console.log('ML recommendation from DB not available, using basic response');
      }
    }

    return NextResponse.json({
      message: 'AI Recommendations API',
      usage: {
        ml: 'Add ?productId=X or POST with ml=true for ML-based recommendations',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
