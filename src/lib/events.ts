import { getPublicEnv } from "@/lib/env";
import { mockEvents } from "@/lib/mock/events";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { EventStatus } from "@/types/domain";

export type PublicEvent = {
  id: string;
  slug: string;
  name: string;
  date: string;
  location: string;
  description: string;
  price: number;
  capacity: number;
  status: EventStatus;
  soldTickets: number;
  remainingTickets: number;
};

function getPublicEnvSafe() {
  try {
    return getPublicEnv();
  } catch {
    return null;
  }
}

function mapEventWithStats(
  event: Database["public"]["Tables"]["events"]["Row"],
  stats?: Database["public"]["Views"]["event_ticket_stats"]["Row"],
): PublicEvent {
  return {
    id: event.id,
    slug: event.slug,
    name: event.name,
    date: event.date,
    location: event.location,
    description: event.description,
    price: event.price,
    capacity: event.capacity,
    status: event.status,
    soldTickets: stats?.sold_tickets ?? 0,
    remainingTickets: stats?.remaining_tickets ?? event.capacity,
  };
}

export async function getPublishedEvents() {
  if (!getPublicEnvSafe()) {
    return mockEvents;
  }

  const supabase = await createSupabaseServerClient();

  const [{ data: events, error: eventsError }, { data: stats, error: statsError }] =
    await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("status", "published")
        .order("date", { ascending: true }),
      supabase.from("event_ticket_stats").select("*"),
    ]);

  if (eventsError) {
    throw new Error(`No se pudieron cargar los eventos: ${eventsError.message}`);
  }

  if (statsError) {
    throw new Error(
      `No se pudieron cargar las estadisticas de eventos: ${statsError.message}`,
    );
  }

  const typedEvents = events as Database["public"]["Tables"]["events"]["Row"][];
  const typedStats =
    stats as Database["public"]["Views"]["event_ticket_stats"]["Row"][];
  const statsByEventId = new Map(typedStats.map((item) => [item.id, item]));

  return typedEvents.map((event) =>
    mapEventWithStats(event, statsByEventId.get(event.id)),
  );
}

export async function getPublishedEventBySlug(slug: string) {
  if (!getPublicEnvSafe()) {
    return mockEvents.find((event) => event.slug === slug) ?? null;
  }

  const supabase = await createSupabaseServerClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (eventError) {
    throw new Error(`No se pudo cargar el evento: ${eventError.message}`);
  }

  if (!event) {
    return null;
  }

  const typedEvent = event as Database["public"]["Tables"]["events"]["Row"];

  const { data: stats, error: statsError } = await supabase
    .from("event_ticket_stats")
    .select("*")
    .eq("id", typedEvent.id)
    .maybeSingle();

  if (statsError) {
    throw new Error(
      `No se pudieron cargar las estadisticas del evento: ${statsError.message}`,
    );
  }

  return mapEventWithStats(
    typedEvent,
    (stats as Database["public"]["Views"]["event_ticket_stats"]["Row"] | null) ??
      undefined,
  );
}
