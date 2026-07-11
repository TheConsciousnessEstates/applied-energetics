import Stripe from "stripe";
import { STRIPE_PRODUCTS, type StripeTier } from "./products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-06-24.dahlia",
});

export async function createSubscriptionCheckout({
  tier,
  userId,
  userEmail,
  userName,
  origin,
}: {
  tier: StripeTier;
  userId: number;
  userEmail?: string | null;
  userName?: string | null;
  origin: string;
}): Promise<string> {
  const product = STRIPE_PRODUCTS[tier];

  // Build line items — if we have a priceId use it, otherwise create inline price
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = product.priceId
    ? [{ price: product.priceId, quantity: 1 }]
    : [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ];

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: lineItems,
    client_reference_id: userId.toString(),
    customer_email: userEmail ?? undefined,
    allow_promotion_codes: true,
    metadata: {
      user_id: userId.toString(),
      tier,
      customer_email: userEmail ?? "",
      customer_name: userName ?? "",
    },
    subscription_data: {
      metadata: {
        user_id: userId.toString(),
        tier,
      },
    },
    success_url: `${origin}/dashboard?upgraded=1`,
    cancel_url: `${origin}/pricing?canceled=1`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

export async function cancelSubscription(stripeSubscriptionId: string): Promise<void> {
  await stripe.subscriptions.cancel(stripeSubscriptionId);
}
