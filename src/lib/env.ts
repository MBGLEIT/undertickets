import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const appUrlEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

const supabaseServerEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const stripeEnvSchema = appUrlEnvSchema.extend({
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
});

const emailEnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  TICKET_EMAIL_FROM: z.string().email(),
});

export function getPublicEnv() {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function getSupabaseServerEnv() {
  return supabaseServerEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}

export function getStripeEnv() {
  return stripeEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  });
}

export function getEmailEnv() {
  return emailEnvSchema.parse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    TICKET_EMAIL_FROM: process.env.TICKET_EMAIL_FROM,
  });
}

export function hasPublicEnvConfig() {
  try {
    getPublicEnv();
    return true;
  } catch {
    return false;
  }
}

export function hasSupabaseServerEnvConfig() {
  try {
    getSupabaseServerEnv();
    return true;
  } catch {
    return false;
  }
}

export function hasStripeEnvConfig() {
  try {
    getStripeEnv();
    return true;
  } catch {
    return false;
  }
}

export function hasEmailEnvConfig() {
  try {
    getEmailEnv();
    return true;
  } catch {
    return false;
  }
}
