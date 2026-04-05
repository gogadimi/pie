import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-06-20' as any,
});

export const PRICING_PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER || 'price_starter_placeholder',
    amount: 4900, // $49.00
    currency: 'eur',
    interval: 'month' as const,
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder',
    amount: 14900, // $149.00
    currency: 'eur',
    interval: 'month' as const,
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_placeholder',
    amount: 79900, // $799.00
    currency: 'eur',
    interval: 'month' as const,
  },
};

export async function createCheckoutSession({
  customerId,
  planKey,
  successUrl,
  cancelUrl,
}: {
  customerId: string;
  planKey: keyof typeof PRICING_PLANS;
  successUrl: string;
  cancelUrl: string;
}) {
  const plan = PRICING_PLANS[planKey];

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      plan: planKey,
    },
  });

  return session;
}

export async function createCustomer({
  email,
  name,
}: {
  email: string;
  name: string;
}) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      source: 'pie-signup',
    },
  });

  return customer;
}

export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId);
}

export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

export { stripe };
