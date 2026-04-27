import Stripe from "stripe";
import { getStripeEnv } from "@/lib/env";

export function createStripeServerClient() {
  const env = getStripeEnv();

  return new Stripe(env.STRIPE_SECRET_KEY);
}
