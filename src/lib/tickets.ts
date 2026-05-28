import type Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TicketRecord } from "@/types/domain";

function createTicketCode(length = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
}

export async function issueTicketForCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<TicketRecord> {
  const eventId = session.metadata?.eventId;
  const buyerFullName = session.metadata?.buyerFullName;
  const buyerAge = Number(session.metadata?.buyerAge ?? NaN);
  const buyerDni = session.metadata?.buyerDni;
  const buyerPhone =
    session.customer_details?.phone ??
    session.metadata?.buyerPhone;
  const buyerEmail =
    session.customer_details?.email ??
    session.customer_email ??
    session.metadata?.buyerEmail;

  if (
    !eventId ||
    !buyerFullName ||
    !Number.isFinite(buyerAge) ||
    !buyerDni ||
    !buyerPhone ||
    !buyerEmail ||
    !session.id
  ) {
    throw new Error("Faltan datos obligatorios para emitir el ticket.");
  }

  const ticketId = crypto.randomUUID();
  const qrCodeValue = `ticket:${ticketId}`;
  const alphanumericCode = createTicketCode();
  const supabase = createSupabaseAdminClient();
  const rpcClient = supabase as unknown as {
    rpc: (
      fn: "issue_ticket",
      args: {
        p_event_id: string;
        p_ticket_id: string;
        p_full_name: string;
        p_age: number;
        p_dni: string;
        p_phone: string;
        p_email: string;
        p_stripe_session_id: string;
        p_qr_code_value: string;
        p_alphanumeric_code: string;
      },
    ) => Promise<{
      data: TicketRecord | null;
      error: { message: string } | null;
    }>;
  };

  const { data, error } = await rpcClient.rpc("issue_ticket", {
    p_event_id: eventId,
    p_ticket_id: ticketId,
    p_full_name: buyerFullName,
    p_age: buyerAge,
    p_dni: buyerDni,
    p_phone: buyerPhone,
    p_email: buyerEmail,
    p_stripe_session_id: session.id,
    p_qr_code_value: qrCodeValue,
    p_alphanumeric_code: alphanumericCode,
  });

  if (error) {
    throw new Error(`No se pudo emitir el ticket: ${error.message}`);
  }

  return data as TicketRecord;
}
