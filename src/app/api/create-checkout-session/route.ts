import { NextResponse } from "next/server";
import { z } from "zod";
import { isAgeAllowedForRestriction } from "@/lib/age-restrictions";
import { getPublishedEventBySlug } from "@/lib/events";
import { getStripeEnv } from "@/lib/env";
import { createStripeServerClient } from "@/lib/stripe";

const createCheckoutSessionSchema = z.object({
  eventSlug: z.string().min(1),
  fullName: z.string().trim().min(5).max(120),
  age: z.number().int().min(0).max(120),
  dni: z.string().trim().min(8).max(16),
  phone: z.string().trim().min(7).max(20),
  email: z.string().email(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = createCheckoutSessionSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Los datos del checkout no son validos." },
      { status: 400 },
    );
  }

  const event = await getPublishedEventBySlug(parsedBody.data.eventSlug);

  if (!event) {
    return NextResponse.json(
      { error: "El evento no existe o no esta publicado." },
      { status: 404 },
    );
  }

  if (event.status === "cancelled") {
    return NextResponse.json(
      { error: "Este evento ha sido cancelado y no admite compras." },
      { status: 409 },
    );
  }

  if (event.status === "sold_out" || event.remainingTickets <= 0) {
    return NextResponse.json(
      { error: "Este evento ya no tiene entradas disponibles." },
      { status: 409 },
    );
  }

  if (!isAgeAllowedForRestriction(parsedBody.data.age, event.ageRestriction)) {
    return NextResponse.json(
      {
        error: `No puedes comprar esta entrada porque el evento requiere edad minima ${event.ageRestriction}.`,
      },
      { status: 403 },
    );
  }

  let env;

  try {
    env = getStripeEnv();
  } catch {
    return NextResponse.json(
      {
        error:
          "Stripe aun no esta configurado. Cuando pongamos las claves, este flujo quedara operativo.",
      },
      { status: 503 },
    );
  }

  const stripe = createStripeServerClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: parsedBody.data.email,
    phone_number_collection: {
      enabled: true,
    },
    success_url: `${env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/checkout/cancel?event=${event.slug}`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: event.price,
          product_data: {
            name: event.name,
            description: `${event.location} - ${event.date}`,
          },
        },
      },
    ],
    metadata: {
      eventId: event.id,
      eventSlug: event.slug,
      buyerFullName: parsedBody.data.fullName,
      buyerAge: String(parsedBody.data.age),
      buyerDni: parsedBody.data.dni.toUpperCase(),
      buyerPhone: parsedBody.data.phone,
      buyerEmail: parsedBody.data.email,
    },
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Stripe no devolvio una URL de checkout." },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url });
}
