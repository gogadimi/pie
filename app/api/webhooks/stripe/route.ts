import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature') || '';

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      // TODO: Update user's plan in DB
      console.log('✅ Payment completed:', session.customer_email, session.metadata?.plan);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as any;
      // TODO: Update plan/usage in DB
      console.log('📋 Subscription updated:', sub.id, sub.status);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as any;
      // TODO: Downgrade to free plan
      console.log('❌ Subscription cancelled:', sub.id);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as any;
      // TODO: Notify user, retry payment
      console.log('💳 Payment failed:', invoice.customer_email);
      break;
    }

    default:
      console.log('📬 Unhandled event:', event.type);
  }

  return NextResponse.json({ received: true });
}
