import Stripe from "stripe";
import type { Request, Response } from "express";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-06-24.dahlia",
});

export async function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // ⚠️ REQUIRED: Test event handling for Stripe webhook verification
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id ? Number(session.metadata.user_id) : null;
        const tier = session.metadata?.tier as "pro" | "elite" | undefined;

        if (!userId || !tier) {
          console.warn("[Stripe Webhook] Missing user_id or tier in session metadata");
          break;
        }

        const db = await getDb();
        if (!db) break;

        await db
          .update(users)
          .set({
            subscriptionTier: tier,
            subscriptionStatus: "active",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            subscriptionCurrentPeriodEnd: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        console.log(`[Stripe Webhook] User ${userId} upgraded to ${tier}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id ? Number(sub.metadata.user_id) : null;

        if (!userId) {
          // Try to find user by stripe customer ID
          const db = await getDb();
          if (!db) break;
          const customerId = sub.customer as string;
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.stripeCustomerId, customerId))
            .limit(1);
          if (!user) break;

          const status = sub.status === "active" ? "active" : sub.status === "canceled" ? "canceled" : "past_due";
          await db
            .update(users)
            .set({
              subscriptionStatus: status,
              subscriptionCurrentPeriodEnd: new Date((sub as any).current_period_end * 1000),
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));
          break;
        }

        const db = await getDb();
        if (!db) break;
        const status = sub.status === "active" ? "active" : sub.status === "canceled" ? "canceled" : "past_due";
        await db
          .update(users)
          .set({
            subscriptionStatus: status,
            subscriptionCurrentPeriodEnd: new Date((sub as any).current_period_end * 1000),
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const db = await getDb();
        if (!db) break;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, customerId))
          .limit(1);

        if (!user) break;

        await db
          .update(users)
          .set({
            subscriptionTier: "free",
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        console.log(`[Stripe Webhook] User ${user.id} downgraded to free (subscription canceled)`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const db = await getDb();
        if (!db) break;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, customerId))
          .limit(1);

        if (!user) break;

        await db
          .update(users)
          .set({ subscriptionStatus: "past_due", updatedAt: new Date() })
          .where(eq(users.id, user.id));

        console.log(`[Stripe Webhook] Payment failed for user ${user.id}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[Stripe Webhook] Handler error:", err);
    return res.status(500).json({ error: "Webhook handler failed" });
  }

  res.json({ received: true });
}
