import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sendTicketEmail } from "@/lib/email";
import { getStripeEnv } from "@/lib/env";
import { createStripeServerClient } from "@/lib/stripe";
import { getTicketWithEventById } from "@/lib/ticket-documents";
import { issueTicketForCheckoutSession } from "@/lib/tickets";

export const runtime = "nodejs";

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const ticket = await issueTicketForCheckoutSession(session);
  const hydratedTicket = await getTicketWithEventById(ticket.id);
  await sendTicketEmail(hydratedTicket);
}

export async function POST(request: Request) {
  let env;

  try {
    env = getStripeEnv();
  } catch {
    return NextResponse.json(
      { error: "Faltan variables de entorno del servidor para Stripe." },
      { status: 503 },
    );
  }

  const stripeSignature = (await headers()).get("stripe-signature");

  if (!stripeSignature) {
    return NextResponse.json(
      { error: "Falta la firma del webhook de Stripe." },
      { status: 400 },
    );
  }

  const payload = await request.text();
  const stripe = createStripeServerClient();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      stripeSignature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Firma de webhook invalida.";

    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session,
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error procesando el webhook.";

    console.error("Stripe webhook processing failed", error);

    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
