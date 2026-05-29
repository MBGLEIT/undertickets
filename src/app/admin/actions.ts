"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ADMIN_PASSWORD, clearAdminSession, createAdminSession } from "@/lib/admin-auth";
import { isBirthDateAllowedForRestriction } from "@/lib/age-restrictions";
import { deleteEventPosterByUrl, uploadEventPoster } from "@/lib/event-posters";
import { publishRealtimeUpdate } from "@/lib/realtime-updates";
import { processTicketEmail } from "@/lib/ticket-email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import type { EventTicketStatsRecord } from "@/types/domain";

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toIsoDateTimeLocal(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("La fecha del evento no es valida.");
  }

  return date.toISOString();
}

function parseEuroToCents(value: string) {
  const normalized = value.replace(",", ".").trim();
  const numericValue = Number(normalized);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    throw new Error("El precio del evento no es valido.");
  }

  return Math.round(numericValue * 100);
}

function createManualCode(length = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
}

function getEventsTableClient() {
  const supabase = createSupabaseAdminClient();

  return supabase.from("events") as unknown as {
    select: (columns: "id") => {
      eq: (column: "slug", value: string) => {
        maybeSingle: () => Promise<{
          data: { id: string } | null;
          error: { message: string } | null;
        }>;
      };
    };
    insert: (
      values: Database["public"]["Tables"]["events"]["Insert"],
    ) => Promise<{ error: { message: string } | null }>;
    update: (
      values: Database["public"]["Tables"]["events"]["Update"],
    ) => {
      eq: (column: "id", value: string) => Promise<{
        error: { message: string } | null;
      }>;
    };
    delete: () => {
      eq: (column: "id", value: string) => Promise<{
        error: { message: string } | null;
      }>;
    };
  };
}

function getTicketsTableClient() {
  const supabase = createSupabaseAdminClient();

  return supabase.from("tickets") as unknown as {
    insert: (
      values: Database["public"]["Tables"]["tickets"]["Insert"],
    ) => Promise<{ error: { message: string } | null }>;
    delete: () => {
      eq: (column: "id", value: string) => Promise<{
        error: { message: string } | null;
      }>;
    };
    update: (
      values: Database["public"]["Tables"]["tickets"]["Update"],
    ) => {
      eq: (column: "id", value: string) => Promise<{
        error: { message: string } | null;
      }>;
    };
  };
}

export async function adminLoginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/admin");

  if (password !== ADMIN_PASSWORD) {
    redirect(`/admin?error=1&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  await createAdminSession();
  redirect(redirectTo || "/admin");
}

export async function adminLogoutAction() {
  await clearAdminSession();
  redirect("/admin");
}

export async function adminLogoutToHomeAction() {
  await clearAdminSession();
  redirect("/");
}

export async function createEventAction(formData: FormData) {
  try {
    const eventsTable = getEventsTableClient();
    const name = String(formData.get("name") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const imageUrlInput = String(formData.get("imageUrl") ?? "").trim() || null;
    const posterFile = formData.get("poster") as File | null;
    const ageRestriction =
      (String(formData.get("ageRestriction") ?? "").trim() as "+16" | "+18" | "+21") ||
      null;
    const status = String(formData.get("status") ?? "draft") as
      | "draft"
      | "published"
      | "sold_out"
      | "cancelled";
    const capacity = Number(formData.get("capacity") ?? 0);
    const date = String(formData.get("date") ?? "");
    const price = parseEuroToCents(String(formData.get("price") ?? ""));

    if (!name || !location || !description || !date || capacity <= 0) {
      throw new Error("Faltan datos obligatorios para crear el evento.");
    }

    let slug = normalizeSlug(String(formData.get("slug") ?? "")) || normalizeSlug(name);

    const { data: existingSlug } = await eventsTable
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-5)}`;
    }

    const uploadedPoster =
      posterFile && posterFile.size > 0
        ? await uploadEventPoster({
            eventSlug: slug,
            file: posterFile,
          })
        : null;
    const imageUrl = uploadedPoster?.publicUrl ?? imageUrlInput;

    const { error } = await eventsTable.insert({
      slug,
      name,
      location,
      description,
      image_url: imageUrl,
      age_restriction: ageRestriction,
      status,
      capacity,
      date: toIsoDateTimeLocal(date),
      price,
    });

    if (error) {
      throw new Error(`No se pudo crear el evento: ${error.message}`);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/events");
    revalidatePath("/admin/dashboard");
    revalidatePath("/events");
    await publishRealtimeUpdate("events", slug);
    redirect("/admin/events?created=1");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo crear el evento.";
    redirect(`/admin/events?error=${encodeURIComponent(message)}`);
  }
}

export async function updateEventAction(formData: FormData) {
  try {
    const eventsTable = getEventsTableClient();
    const id = String(formData.get("id") ?? "");
    const slug = normalizeSlug(String(formData.get("slug") ?? ""));
    const name = String(formData.get("name") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const imageUrlInput = String(formData.get("imageUrl") ?? "").trim() || null;
    const currentImageUrl = String(formData.get("currentImageUrl") ?? "").trim() || null;
    const removePoster = String(formData.get("removePoster") ?? "") === "on";
    const posterFile = formData.get("poster") as File | null;
    const ageRestriction =
      (String(formData.get("ageRestriction") ?? "").trim() as "+16" | "+18" | "+21") ||
      null;
    const status = String(formData.get("status") ?? "draft") as
      | "draft"
      | "published"
      | "sold_out"
      | "cancelled";
    const capacity = Number(formData.get("capacity") ?? 0);
    const date = String(formData.get("date") ?? "");
    const price = parseEuroToCents(String(formData.get("price") ?? ""));

    let imageUrl = removePoster ? null : imageUrlInput;

    if (posterFile && posterFile.size > 0) {
      const uploadedPoster = await uploadEventPoster({
        eventSlug: slug || normalizeSlug(name) || id,
        file: posterFile,
      });

      imageUrl = uploadedPoster?.publicUrl ?? imageUrl;
    } else if (!imageUrlInput && !removePoster) {
      imageUrl = currentImageUrl;
    }

    const { error } = await eventsTable
      .update({
        slug,
        name,
        location,
        description,
        image_url: imageUrl,
        age_restriction: ageRestriction,
        status,
        capacity,
        date: toIsoDateTimeLocal(date),
        price,
      })
      .eq("id", id);

    if (error) {
      throw new Error(`No se pudo actualizar el evento: ${error.message}`);
    }

    if ((posterFile && posterFile.size > 0) || removePoster) {
      await deleteEventPosterByUrl(currentImageUrl);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/events");
    revalidatePath("/admin/dashboard");
    revalidatePath("/events");
    await publishRealtimeUpdate("events", slug || id);
    redirect("/admin/events?updated=1");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo actualizar el evento.";
    redirect(`/admin/events?error=${encodeURIComponent(message)}`);
  }
}

export async function deleteEventAction(formData: FormData) {
  const eventsTable = getEventsTableClient();
  const supabase = createSupabaseAdminClient();
  const id = String(formData.get("id") ?? "");
  const { data: existingEvent } = await supabase
    .from("events")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  const { error } = await eventsTable.delete().eq("id", id);

  if (error) {
    throw new Error(`No se pudo eliminar el evento: ${error.message}`);
  }

  const typedExistingEvent = existingEvent as { image_url: string | null } | null;
  await deleteEventPosterByUrl(typedExistingEvent?.image_url);

  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath("/admin/dashboard");
  revalidatePath("/events");
  await publishRealtimeUpdate("events", id);
  redirect("/admin/events?deleted=1");
}

export async function createManualTicketAction(formData: FormData) {
  const supabase = createSupabaseAdminClient();
  const ticketsTable = getTicketsTableClient();
  const eventId = String(formData.get("eventId") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const birthDate = String(formData.get("birthDate") ?? "").trim();
  const dni = String(formData.get("dni") ?? "").trim().toUpperCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!eventId || !fullName || !birthDate || !dni || !phone || !email) {
    throw new Error("Faltan datos obligatorios para generar la entrada.");
  }

  const { data: eventStats, error: statsError } = await supabase
    .from("event_ticket_stats")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  const { data: eventDetails, error: eventDetailsError } = await supabase
    .from("events")
    .select("age_restriction")
    .eq("id", eventId)
    .maybeSingle();

  if (statsError) {
    throw new Error(`No se pudo comprobar el aforo del evento: ${statsError.message}`);
  }

  if (eventDetailsError) {
    throw new Error(
      `No se pudo comprobar la restriccion de edad del evento: ${eventDetailsError.message}`,
    );
  }

  const typedEventStats = eventStats as EventTicketStatsRecord | null;
  const typedEventDetails = eventDetails as { age_restriction: "+16" | "+18" | "+21" | null } | null;

  if (!typedEventStats) {
    throw new Error("El evento seleccionado no existe.");
  }

  if (typedEventStats.remaining_tickets <= 0) {
    throw new Error("Ese evento ya no tiene entradas disponibles.");
  }

  if (!isBirthDateAllowedForRestriction(birthDate, typedEventDetails?.age_restriction ?? null)) {
    throw new Error(
      `No se puede generar la entrada porque el evento requiere edad minima ${typedEventDetails?.age_restriction}.`,
    );
  }

  const ticketId = crypto.randomUUID();
  const qrCodeValue = `ticket:${ticketId}`;
  const alphanumericCode = createManualCode();
  const stripeSessionId = `manual-${crypto.randomUUID()}`;

  const { error } = await ticketsTable.insert({
    id: ticketId,
    event_id: eventId,
    full_name: fullName,
    birth_date: birthDate,
    dni,
    phone,
    email,
    stripe_session_id: stripeSessionId,
    qr_code_value: qrCodeValue,
    alphanumeric_code: alphanumericCode,
  });

  if (error) {
    throw new Error(`No se pudo generar la entrada manual: ${error.message}`);
  }

  let emailResult:
    | {
        delivered: boolean;
        errorMessage: string | null;
      }
    | null = null;

  try {
    emailResult = await processTicketEmail(ticketId);
  } catch (error) {
    console.error("La entrada manual se creo, pero el email no se pudo procesar.", {
      ticketId,
      error,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/events");
  revalidatePath("/admin/tickets");
  await publishRealtimeUpdate("tickets", ticketId);
  await publishRealtimeUpdate("events", eventId);
  redirect(
    emailResult?.delivered
      ? "/admin/tickets?created=1"
      : "/admin/tickets?created=1&emailError=1",
  );
}

export async function retryTicketEmailAction(formData: FormData) {
  const ticketId = String(formData.get("ticketId") ?? "");

  if (!ticketId) {
    redirect("/admin/tickets?emailRetryFailed=1");
  }

  let emailResult:
    | {
        delivered: boolean;
        errorMessage: string | null;
      }
    | null = null;

  try {
    emailResult = await processTicketEmail(ticketId);
  } catch (error) {
    console.error("No se pudo reprocesar el email del ticket.", {
      ticketId,
      error,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/events");
  revalidatePath("/admin/tickets");
  await publishRealtimeUpdate("tickets", ticketId);

  redirect(
    emailResult?.delivered
      ? "/admin/tickets?emailRetried=1"
      : "/admin/tickets?emailRetryFailed=1",
  );
}

export async function deleteTicketAction(formData: FormData) {
  const ticketsTable = getTicketsTableClient();
  const ticketId = String(formData.get("ticketId") ?? "");

  if (!ticketId) {
    redirect("/admin/tickets?ticketDeleted=0");
  }

  const { error } = await ticketsTable.delete().eq("id", ticketId);

  if (error) {
    throw new Error(`No se pudo retirar la entrada: ${error.message}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/events");
  revalidatePath("/admin/tickets");
  await publishRealtimeUpdate("tickets", ticketId);
  await publishRealtimeUpdate("events");
  redirect("/admin/tickets?ticketDeleted=1");
}

export async function reactivateTicketAction(formData: FormData) {
  const ticketsTable = getTicketsTableClient();
  const ticketId = String(formData.get("ticketId") ?? "");

  if (!ticketId) {
    redirect("/admin/tickets?ticketReactivated=0");
  }

  const { error } = await ticketsTable
    .update({
      used: false,
      used_at: null,
    })
    .eq("id", ticketId);

  if (error) {
    throw new Error(`No se pudo reactivar la entrada: ${error.message}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/events");
  revalidatePath("/admin/tickets");
  revalidatePath("/admin/scan");
  await publishRealtimeUpdate("tickets", ticketId);
  await publishRealtimeUpdate("events");
  redirect("/admin/tickets?ticketReactivated=1");
}
