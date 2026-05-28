import { unstable_noStore as noStore } from "next/cache";
import { hasSupabaseServerEnvConfig } from "@/lib/env";
import { formatEventDate, formatPrice } from "@/lib/formatters";
import { mockEvents } from "@/lib/mock/events";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { EventRecord, EventTicketStatsRecord } from "@/types/domain";

export type AdminMetric = {
  label: string;
  value: string;
  helper: string;
};

export type AdminRecentTicket = {
  id: string;
  fullName: string;
  email: string;
  used: boolean;
  usedAt: string | null;
  eventName: string;
  eventDate: string;
  code: string;
};

export type AdminEventSummary = {
  id: string;
  slug: string;
  name: string;
  date: string;
  location: string;
  price: number;
  capacity: number;
  soldTickets: number;
  usedTickets: number;
  remainingTickets: number;
  status: "draft" | "published" | "sold_out" | "cancelled";
};

export type AdminEventFormRecord = {
  id: string;
  slug: string;
  name: string;
  date: string;
  location: string;
  description: string;
  imageUrl: string | null;
  ageRestriction: "+16" | "+18" | "+21" | null;
  price: number;
  capacity: number;
  status: "draft" | "published" | "sold_out" | "cancelled";
};

export type AdminAttendee = {
  id: string;
  fullName: string;
  age: number;
  dni: string;
  phone: string;
  email: string;
  used: boolean;
  usedAt: string | null;
  code: string;
  purchasedAt: string;
};

export type AdminEventAttendanceDetail = {
  event: AdminEventSummary;
  arrivedAttendees: AdminAttendee[];
  pendingAttendees: AdminAttendee[];
};

export type AdminTicketOverview = {
  id: string;
  eventId: string;
  eventName: string;
  eventSlug: string;
  fullName: string;
  age: number;
  dni: string;
  phone: string;
  email: string;
  code: string;
  used: boolean;
  usedAt: string | null;
  purchasedAt: string;
  emailStatus: "pending" | "sent" | "failed" | "not_requested";
};

export type AdminFailedEmailTicket = {
  ticketId: string;
  eventName: string;
  eventSlug: string;
  fullName: string;
  email: string;
  errorMessage: string;
  attemptCount: number;
  lastAttemptAt: string | null;
};

function mapMockSummary() {
  return mockEvents.map((event) => ({
    id: event.id,
    slug: event.slug,
    name: event.name,
    date: event.date,
    location: event.location,
    price: event.price,
    capacity: event.capacity,
    soldTickets: event.soldTickets,
    usedTickets: Math.min(18, event.soldTickets),
    remainingTickets: event.remainingTickets,
    status: event.remainingTickets <= 0 ? "sold_out" : "published",
  })) satisfies AdminEventSummary[];
}

function mapStatsRecord(record: EventTicketStatsRecord): AdminEventSummary {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    date: record.date,
    location: record.location,
    price: record.price,
    capacity: record.capacity,
    soldTickets: record.sold_tickets,
    usedTickets: record.used_tickets,
    remainingTickets: record.remaining_tickets,
    status: record.remaining_tickets <= 0 ? "sold_out" : "published",
  };
}

function buildMockAttendees(event: AdminEventSummary) {
  const totalTickets = Math.max(event.soldTickets, 1);

  return Array.from({ length: totalTickets }, (_, index) => {
    const used = index < event.usedTickets;

    return {
      id: `${event.slug}-ticket-${index + 1}`,
      fullName: `Asistente ${index + 1} ${event.name}`,
      age: 18 + (index % 10),
      dni: `0000000${(index % 9) + 1}A`,
      phone: `+34 600 000 ${String(index + 1).padStart(3, "0")}`,
      email: `asistente${index + 1}@${event.slug}.local`,
      used,
      usedAt: used ? new Date().toISOString() : null,
      code: `${event.slug.slice(0, 4).toUpperCase()}-${String(index + 1).padStart(4, "0")}`,
      purchasedAt: new Date(
        Date.now() - (index + 1) * 1000 * 60 * 60 * 4,
      ).toISOString(),
    } satisfies AdminAttendee;
  });
}

export async function getAdminEventsSummary() {
  noStore();

  if (!hasSupabaseServerEnvConfig()) {
    return mapMockSummary();
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("event_ticket_stats")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data as unknown as EventTicketStatsRecord[]).map(mapStatsRecord);
  } catch (error) {
    console.error("Fallo cargando el resumen admin; devolviendo vacio.", error);
    return [];
  }
}

export async function getAdminEventsForForm() {
  noStore();

  if (!hasSupabaseServerEnvConfig()) {
    return mockEvents.map((event) => ({
      id: event.id,
      slug: event.slug,
      name: event.name,
      date: event.date,
      location: event.location,
      description: event.description,
      imageUrl: event.imageUrl,
      ageRestriction: event.ageRestriction,
      price: event.price,
      capacity: event.capacity,
      status: event.status,
    })) satisfies AdminEventFormRecord[];
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data as EventRecord[]).map((event) => ({
      id: event.id,
      slug: event.slug,
      name: event.name,
      date: event.date,
      location: event.location,
      description: event.description,
      imageUrl: event.image_url,
      ageRestriction: event.age_restriction,
      price: event.price,
      capacity: event.capacity,
      status: event.status,
    }));
  } catch (error) {
    console.error("Fallo cargando eventos para el formulario admin; devolviendo vacio.", error);
    return [];
  }
}

export async function getAdminEventAttendanceBySlug(slug: string) {
  noStore();

  const events = await getAdminEventsSummary();
  const event = events.find((item) => item.slug === slug) ?? null;

  if (!event) {
    return null;
  }

  if (!hasSupabaseServerEnvConfig()) {
    const mockAttendees = buildMockAttendees(event);

    return {
      event,
      arrivedAttendees: mockAttendees.filter((attendee) => attendee.used),
      pendingAttendees: mockAttendees.filter((attendee) => !attendee.used),
    } satisfies AdminEventAttendanceDetail;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("tickets")
      .select(
        "id, full_name, age, dni, phone, email, used, used_at, alphanumeric_code, created_at, event_id",
      )
      .eq("event_id", event.id)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const attendees = (data as unknown as Array<{
      id: string;
      full_name: string;
      age: number;
      dni: string;
      phone: string;
      email: string;
      used: boolean;
      used_at: string | null;
      alphanumeric_code: string;
      created_at: string;
    }>).map((ticket) => ({
      id: ticket.id,
      fullName: ticket.full_name,
      age: ticket.age,
      dni: ticket.dni,
      phone: ticket.phone,
      email: ticket.email,
      used: ticket.used,
      usedAt: ticket.used_at,
      code: ticket.alphanumeric_code,
      purchasedAt: ticket.created_at,
    }));

    return {
      event,
      arrivedAttendees: attendees.filter((attendee) => attendee.used),
      pendingAttendees: attendees.filter((attendee) => !attendee.used),
    } satisfies AdminEventAttendanceDetail;
  } catch (error) {
    console.error(`Fallo cargando asistencia del evento ${slug}; devolviendo vacio.`, error);
    return {
      event,
      arrivedAttendees: [],
      pendingAttendees: [],
    } satisfies AdminEventAttendanceDetail;
  }
}

export async function getAdminDashboardData() {
  noStore();

  const events = await getAdminEventsSummary();

  const totalRevenue = events.reduce(
    (sum, event) => sum + event.price * event.soldTickets,
    0,
  );
  const totalTickets = events.reduce((sum, event) => sum + event.soldTickets, 0);
  const totalUsed = events.reduce((sum, event) => sum + event.usedTickets, 0);
  const totalRemaining = events.reduce(
    (sum, event) => sum + event.remainingTickets,
    0,
  );

  const metrics: AdminMetric[] = [
    {
      label: "Facturacion",
      value: formatPrice(totalRevenue),
      helper: "Suma de entradas vendidas por precio del evento.",
    },
    {
      label: "Entradas vendidas",
      value: String(totalTickets),
      helper: "Total de tickets emitidos.",
    },
    {
      label: "Accesos validados",
      value: String(totalUsed),
      helper: "Tickets marcados como usados en control de acceso.",
    },
    {
      label: "Plazas restantes",
      value: String(totalRemaining),
      helper: "Aforo disponible acumulado en eventos activos.",
    },
  ];

  if (!hasSupabaseServerEnvConfig()) {
    return {
      metrics,
      events,
      recentTickets: events.slice(0, 3).map((event, index) => ({
        id: `mock-ticket-${index + 1}`,
        fullName: `Invitado ${index + 1}`,
        email: `invitado${index + 1}@localtickets.dev`,
        used: index % 2 === 0,
        usedAt: index % 2 === 0 ? new Date().toISOString() : null,
        eventName: event.name,
        eventDate: event.date,
        code: `MOCK-${index + 1}A${index + 7}Z`,
      })) satisfies AdminRecentTicket[],
    };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("tickets")
      .select(
        "id, full_name, email, used, used_at, alphanumeric_code, events(name, date)",
      )
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      throw new Error(error.message);
    }

    const recentTickets = (data as unknown as Array<{
      id: string;
      full_name: string;
      email: string;
      used: boolean;
      used_at: string | null;
      alphanumeric_code: string;
      events:
        | {
            name: string;
            date: string;
          }
        | Array<{
            name: string;
            date: string;
          }>
        | null;
    }>).map((ticket) => {
      const event = Array.isArray(ticket.events) ? ticket.events[0] : ticket.events;

      return {
        id: ticket.id,
        fullName: ticket.full_name,
        email: ticket.email,
        used: ticket.used,
        usedAt: ticket.used_at,
        eventName: event?.name ?? "Evento sin nombre",
        eventDate: event?.date ?? new Date().toISOString(),
        code: ticket.alphanumeric_code,
      } satisfies AdminRecentTicket;
    });

    return {
      metrics,
      events,
      recentTickets,
    };
  } catch (error) {
    console.error("Fallo cargando tickets recientes; devolviendo vacio.", error);
    return {
      metrics,
      events,
      recentTickets: [],
    };
  }
}

export async function getAdminTicketOverview() {
  noStore();

  const events = await getAdminEventsSummary();

  if (!hasSupabaseServerEnvConfig()) {
    const tickets = events.flatMap((event) =>
      buildMockAttendees(event).map((ticket) => ({
        id: ticket.id,
        eventId: event.id,
        eventName: event.name,
        eventSlug: event.slug,
        fullName: ticket.fullName,
        age: ticket.age,
        dni: ticket.dni,
        phone: ticket.phone,
        email: ticket.email,
        code: ticket.code,
      used: ticket.used,
      usedAt: ticket.usedAt,
      purchasedAt: ticket.purchasedAt,
      emailStatus: "sent",
    })),
    );

    return {
      events,
      tickets,
      failedEmailTickets: [],
    };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const [{ data, error }, { data: failedEmailData, error: failedEmailError }] = await Promise.all([
      supabase
      .from("tickets")
      .select(
        "id, event_id, full_name, age, dni, phone, email, used, used_at, alphanumeric_code, created_at, events(name, slug), ticket_email_jobs(status)",
      )
      .order("created_at", { ascending: false }),
      supabase
        .from("ticket_email_jobs")
        .select(
          "ticket_id, status, error_message, attempt_count, last_attempt_at, tickets(id, full_name, email, events(name, slug))",
        )
        .eq("status", "failed")
        .order("updated_at", { ascending: false }),
    ]);

    if (error) {
      throw new Error(error.message);
    }

    if (failedEmailError) {
      throw new Error(failedEmailError.message);
    }

    const tickets = (data as unknown as Array<{
      id: string;
      event_id: string;
      full_name: string;
      age: number;
      dni: string;
      phone: string;
      email: string;
      used: boolean;
      used_at: string | null;
      alphanumeric_code: string;
      created_at: string;
      ticket_email_jobs:
        | {
            status: "pending" | "sent" | "failed";
          }
        | Array<{
            status: "pending" | "sent" | "failed";
          }>
        | null;
      events:
        | {
            name: string;
            slug: string;
          }
        | Array<{
            name: string;
            slug: string;
          }>
        | null;
    }>).map((ticket) => {
      const event = Array.isArray(ticket.events) ? ticket.events[0] : ticket.events;
      const emailJob = Array.isArray(ticket.ticket_email_jobs)
        ? ticket.ticket_email_jobs[0]
        : ticket.ticket_email_jobs;

      return {
        id: ticket.id,
        eventId: ticket.event_id,
        eventName: event?.name ?? "Evento sin nombre",
        eventSlug: event?.slug ?? "sin-evento",
        fullName: ticket.full_name,
        age: ticket.age,
        dni: ticket.dni,
        phone: ticket.phone,
        email: ticket.email,
        code: ticket.alphanumeric_code,
        used: ticket.used,
        usedAt: ticket.used_at,
        purchasedAt: ticket.created_at,
        emailStatus: emailJob?.status ?? "not_requested",
      } satisfies AdminTicketOverview;
    });

    const failedEmailTickets = (failedEmailData as unknown as Array<{
      ticket_id: string;
      status: "pending" | "sent" | "failed";
      error_message: string | null;
      attempt_count: number;
      last_attempt_at: string | null;
      tickets:
        | {
            id: string;
            full_name: string;
            email: string;
            events:
              | {
                  name: string;
                  slug: string;
                }
              | Array<{
                  name: string;
                  slug: string;
                }>
              | null;
          }
        | Array<{
            id: string;
            full_name: string;
            email: string;
            events:
              | {
                  name: string;
                  slug: string;
                }
              | Array<{
                  name: string;
                  slug: string;
                }>
              | null;
          }>
        | null;
    }>).map((job) => {
      const ticket = Array.isArray(job.tickets) ? job.tickets[0] : job.tickets;
      const event = Array.isArray(ticket?.events) ? ticket?.events[0] : ticket?.events;

      return {
        ticketId: job.ticket_id,
        eventName: event?.name ?? "Evento sin nombre",
        eventSlug: event?.slug ?? "sin-evento",
        fullName: ticket?.full_name ?? "Asistente sin nombre",
        email: ticket?.email ?? "Email no disponible",
        errorMessage: job.error_message ?? "No se pudo enviar el correo.",
        attemptCount: job.attempt_count,
        lastAttemptAt: job.last_attempt_at,
      } satisfies AdminFailedEmailTicket;
    });

    return {
      events,
      tickets,
      failedEmailTickets,
    };
  } catch (error) {
    console.error("Fallo cargando el listado de entradas; devolviendo vacio.", error);
    return {
      events,
      tickets: [],
      failedEmailTickets: [],
    };
  }
}

export function formatAdminStatus(status: AdminEventSummary["status"]) {
  switch (status) {
    case "draft":
      return "Oculto";
    case "published":
      return "Publicado";
    case "sold_out":
      return "Agotado";
    case "cancelled":
      return "Cancelado";
  }
}

export function formatAdminEventDate(value: string) {
  return formatEventDate(value);
}

export function formatAdminPriceInput(value: number) {
  return (value / 100).toFixed(2);
}

export function formatAdminDateInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}
