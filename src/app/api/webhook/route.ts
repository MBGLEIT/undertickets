import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeEnv } from "@/lib/env";
import { publishRealtimeUpdate } from "@/lib/realtime-updates";
import { createStripeServerClient } from "@/lib/stripe";
import { processTicketEmail } from "@/lib/ticket-email";
import { issueTicketForCheckoutSession } from "@/lib/tickets";

export const runtime = "nodejs";

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const ticket = await issueTicketForCheckoutSession(session);
  let emailResult;

  try {
    emailResult = await processTicketEmail(ticket.id);
  } catch (error) {
    console.error("Ticket creado, pero no se pudo procesar el email.", {
      ticketId: ticket.id,
      error,
    });
    return;
  }

  if (!emailResult.delivered) {
    console.error("Ticket creado, pero el email fallo y quedo en incidencias.", {
      ticketId: ticket.id,
      error: emailResult.errorMessage,
    });
  }

  await publishRealtimeUpdate("tickets", ticket.id);
  await publishRealtimeUpdate("events", session.metadata?.eventId ?? ticket.event_id);
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
