import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-06-20' as any,
});

const PLANS = {
  starter: { priceId: process.env.STRIPE_PRICE_STARTER || 'price_starter', amount: 4900 },
  pro: { priceId: process.env.STRIPE_PRICE_PRO || 'price_pro', amount: 14900 },
  enterprise: { priceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise', amount: 79900 },
} as const;

/** POST /api/checkout - Create Stripe checkout session */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan = 'starter', email, name } = body;

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
    if (!PLANS[plan as keyof typeof PLANS]) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create or find customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId = customers.data[0]?.id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email, name: name || undefined });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PLANS[plan as keyof typeof PLANS].priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      metadata: { plan, email },
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** GET /api/checkout - List available plans (with Stripe product data) */
export async function GET() {
  try {
    const prices = await stripe.prices.list({
      active: true,
      type: 'recurring',
      expand: ['data.product'],
    });

    const plans = prices.data.map(p => ({
      id: p.id,
      unit_amount: p.unit_amount,
      currency: p.currency,
      interval: p.recurring?.interval,
    }));

    return NextResponse.json({ plans });
  } catch {
    // Fallback: return static plans
    return NextResponse.json({
      plans: [
        { id: 'starter', amount: 4900, currency: 'eur', interval: 'month' },
        { id: 'pro', amount: 14900, currency: 'eur', interval: 'month' },
        { id: 'enterprise', amount: 79900, currency: 'eur', interval: 'month' },
      ],
    });
  }
}
