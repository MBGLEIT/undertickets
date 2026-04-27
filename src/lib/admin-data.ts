import { hasSupabaseServerEnvConfig } from "@/lib/env";
import { mockEvents } from "@/lib/mock/events";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatEventDate, formatPrice } from "@/lib/formatters";
import type { EventTicketStatsRecord } from "@/types/domain";

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

export type AdminAttendee = {
  id: string;
  fullName: string;
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

export async function getAdminEventsSummary() {
  if (!hasSupabaseServerEnvConfig()) {
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

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("event_ticket_stats")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    throw new Error(`No se pudo cargar el resumen admin: ${error.message}`);
  }

  const typedData = data as unknown as EventTicketStatsRecord[];
  return typedData.map(mapStatsRecord);
}

function buildMockAttendees(event: AdminEventSummary) {
  const totalTickets = Math.max(event.soldTickets, 1);

  return Array.from({ length: totalTickets }, (_, index) => {
    const used = index < event.usedTickets;

    return {
      id: `${event.slug}-ticket-${index + 1}`,
      fullName: `Asistente ${index + 1} ${event.name}`,
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

export async function getAdminEventAttendanceBySlug(slug: string) {
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

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(
      "id, full_name, dni, phone, email, used, used_at, alphanumeric_code, created_at, event_id",
    )
    .eq("event_id", event.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(
      `No se pudo cargar la asistencia del evento: ${error.message}`,
    );
  }

  const attendees = (data as unknown as Array<{
    id: string;
    full_name: string;
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
}

export async function getAdminDashboardData() {
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

  let recentTickets: AdminRecentTicket[] = [];

  if (hasSupabaseServerEnvConfig()) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("tickets")
      .select(
        "id, full_name, email, used, used_at, alphanumeric_code, events(name, date)",
      )
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      throw new Error(`No se pudieron cargar los tickets recientes: ${error.message}`);
    }

    recentTickets = (data as unknown as Array<{
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
      };
    });
  } else {
    recentTickets = events.slice(0, 3).map((event, index) => ({
      id: `mock-ticket-${index + 1}`,
      fullName: `Invitado ${index + 1}`,
      email: `invitado${index + 1}@localtickets.dev`,
      used: index % 2 === 0,
      usedAt: index % 2 === 0 ? new Date().toISOString() : null,
      eventName: event.name,
      eventDate: event.date,
      code: `MOCK-${index + 1}A${index + 7}Z`,
    }));
  }

  return {
    metrics,
    events,
    recentTickets,
  };
}

export function formatAdminStatus(status: AdminEventSummary["status"]) {
  switch (status) {
    case "draft":
      return "Borrador";
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
