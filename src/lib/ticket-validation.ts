import { hasSupabaseServerEnvConfig } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTicketWithEventById } from "@/lib/ticket-documents";
import type { TicketRecord } from "@/types/domain";

export type TicketValidationStatus =
  | "validated"
  | "already_used"
  | "not_found"
  | "not_configured";

export type TicketValidationResult = {
  status: TicketValidationStatus;
  message: string;
  ticket: null | {
    id: string;
    fullName: string;
    dni: string;
    phone: string;
    email: string;
    eventName: string;
    eventDate: string;
    eventLocation: string;
    alphanumericCode: string;
    qrCodeValue: string;
    used: boolean;
    usedAt: string | null;
  };
};

type LookupCandidate =
  | { kind: "id"; value: string }
  | { kind: "qr"; value: string }
  | { kind: "code"; value: string };

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function normalizeLookupCandidates(rawValue: string): LookupCandidate[] {
  const value = rawValue.trim();

  if (!value) {
    return [];
  }

  if (value.startsWith("ticket:")) {
    const idValue = value.replace(/^ticket:/, "");

    return isUuid(idValue)
      ? [
          { kind: "qr", value },
          { kind: "id", value: idValue },
        ]
      : [{ kind: "qr", value }];
  }

  if (isUuid(value)) {
    return [
      { kind: "id", value },
      { kind: "qr", value: `ticket:${value}` },
    ];
  }

  return [{ kind: "code", value: value.toUpperCase() }];
}

async function findTicketRecord(candidate: LookupCandidate) {
  const supabase = createSupabaseAdminClient();
  let query = supabase.from("tickets").select("*");

  if (candidate.kind === "id") {
    query = query.eq("id", candidate.value);
  } else if (candidate.kind === "qr") {
    query = query.eq("qr_code_value", candidate.value);
  } else {
    query = query.eq("alphanumeric_code", candidate.value);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`No se pudo buscar el ticket: ${error.message}`);
  }

  return (data as TicketRecord | null) ?? null;
}

function serializeTicket(ticket: Awaited<ReturnType<typeof getTicketWithEventById>>) {
  return {
    id: ticket.id,
    fullName: ticket.full_name,
    dni: ticket.dni,
    phone: ticket.phone,
    email: ticket.email,
    eventName: ticket.event.name,
    eventDate: ticket.event.date,
    eventLocation: ticket.event.location,
    alphanumericCode: ticket.alphanumeric_code,
    qrCodeValue: ticket.qr_code_value,
    used: ticket.used,
    usedAt: ticket.used_at,
  };
}

export async function validateTicketByLookup(
  rawValue: string,
): Promise<TicketValidationResult> {
  if (!hasSupabaseServerEnvConfig()) {
    return {
      status: "not_configured",
      message:
        "La validacion real requiere conectar las variables de entorno de Supabase.",
      ticket: null,
    };
  }

  const candidates = normalizeLookupCandidates(rawValue);

  if (candidates.length === 0) {
    return {
      status: "not_found",
      message: "No has enviado ningun codigo valido para validar.",
      ticket: null,
    };
  }

  let matchedTicket: TicketRecord | null = null;

  for (const candidate of candidates) {
    matchedTicket = await findTicketRecord(candidate);

    if (matchedTicket) {
      break;
    }
  }

  if (!matchedTicket) {
    return {
      status: "not_found",
      message: "No existe ningun ticket con ese QR o codigo.",
      ticket: null,
    };
  }

  if (matchedTicket.used) {
    const hydratedTicket = await getTicketWithEventById(matchedTicket.id);

    return {
      status: "already_used",
      message: "Este ticket ya habia sido validado anteriormente.",
      ticket: serializeTicket(hydratedTicket),
    };
  }

  const supabase = createSupabaseAdminClient();
  const ticketTable = supabase.from("tickets") as unknown as {
    update: (values: { used: boolean; used_at: string }) => {
      eq: (column: "id", value: string) => {
        eq: (column: "used", value: boolean) => {
          select: (columns: "*") => {
            maybeSingle: () => Promise<{
              data: TicketRecord | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    };
  };
  const { data: updatedTicket, error: updateError } = await ticketTable
    .update({
      used: true,
      used_at: new Date().toISOString(),
    })
    .eq("id", matchedTicket.id)
    .eq("used", false)
    .select("*")
    .maybeSingle();

  if (updateError) {
    throw new Error(`No se pudo validar el ticket: ${updateError.message}`);
  }

  if (!updatedTicket) {
    const hydratedTicket = await getTicketWithEventById(matchedTicket.id);

    return {
      status: "already_used",
      message:
        "El ticket ha sido validado justo antes de este intento, por lo que no puede reutilizarse.",
      ticket: serializeTicket(hydratedTicket),
    };
  }

  const hydratedTicket = await getTicketWithEventById(matchedTicket.id);

  return {
    status: "validated",
    message: "Acceso valido. El ticket ha quedado marcado como usado.",
    ticket: serializeTicket(hydratedTicket),
  };
}
