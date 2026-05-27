import { sendTicketEmail } from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTicketWithEventById } from "@/lib/ticket-documents";
import type { Database } from "@/types/database";

type TicketEmailJobStatus = Database["public"]["Tables"]["ticket_email_jobs"]["Row"]["status"];

function getTicketEmailJobsTableClient() {
  const supabase = createSupabaseAdminClient();

  return supabase.from("ticket_email_jobs") as unknown as {
    select: (columns: "*") => {
      eq: (column: "ticket_id", value: string) => {
        maybeSingle: () => Promise<{
          data: Database["public"]["Tables"]["ticket_email_jobs"]["Row"] | null;
          error: { message: string } | null;
        }>;
      };
    };
    insert: (
      values: Database["public"]["Tables"]["ticket_email_jobs"]["Insert"],
    ) => Promise<{ error: { message: string } | null }>;
    update: (
      values: Database["public"]["Tables"]["ticket_email_jobs"]["Update"],
    ) => {
      eq: (column: "ticket_id", value: string) => Promise<{
        error: { message: string } | null;
      }>;
    };
  };
}

async function getExistingTicketEmailJob(ticketId: string) {
  const jobsTable = getTicketEmailJobsTableClient();
  const { data, error } = await jobsTable.select("*").eq("ticket_id", ticketId).maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer el estado del email: ${error.message}`);
  }

  return data;
}

async function upsertTicketEmailJob(
  ticketId: string,
  status: TicketEmailJobStatus,
  options?: {
    errorMessage?: string | null;
    deliveredAt?: string | null;
    incrementAttempt?: boolean;
  },
) {
  const jobsTable = getTicketEmailJobsTableClient();
  const existing = await getExistingTicketEmailJob(ticketId);
  const nextAttemptCount = existing
    ? existing.attempt_count + (options?.incrementAttempt ? 1 : 0)
    : options?.incrementAttempt
      ? 1
      : 0;

  const values: Database["public"]["Tables"]["ticket_email_jobs"]["Insert"] = {
    ticket_id: ticketId,
    status,
    error_message: options?.errorMessage ?? null,
    attempt_count: nextAttemptCount,
    last_attempt_at: options?.incrementAttempt ? new Date().toISOString() : existing?.last_attempt_at ?? null,
    delivered_at: options?.deliveredAt ?? null,
  };

  if (!existing) {
    const { error } = await jobsTable.insert(values);

    if (error) {
      throw new Error(`No se pudo guardar el estado del email: ${error.message}`);
    }

    return;
  }

  const { error } = await jobsTable
    .update({
      status,
      error_message: values.error_message,
      attempt_count: values.attempt_count,
      last_attempt_at: values.last_attempt_at,
      delivered_at: values.delivered_at,
    })
    .eq("ticket_id", ticketId);

  if (error) {
    throw new Error(`No se pudo actualizar el estado del email: ${error.message}`);
  }
}

export async function processTicketEmail(ticketId: string) {
  try {
    await upsertTicketEmailJob(ticketId, "pending", {
      incrementAttempt: true,
      errorMessage: null,
      deliveredAt: null,
    });

    const ticket = await getTicketWithEventById(ticketId);
    await sendTicketEmail(ticket);
    await upsertTicketEmailJob(ticketId, "sent", {
      errorMessage: null,
      deliveredAt: new Date().toISOString(),
    });

    return {
      delivered: true,
      errorMessage: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo enviar el email del ticket.";

    try {
      await upsertTicketEmailJob(ticketId, "failed", {
        errorMessage: message,
        deliveredAt: null,
      });
    } catch (jobError) {
      console.error("No se pudo registrar la incidencia de email del ticket.", {
        ticketId,
        error: jobError,
      });
    }

    return {
      delivered: false,
      errorMessage: message,
    };
  }
}
