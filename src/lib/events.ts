import { unstable_noStore as noStore } from "next/cache";
import { getPublicEnv, hasSupabaseServerEnvConfig } from "@/lib/env";
import { mockEvents } from "@/lib/mock/events";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import type { EventStatus } from "@/types/domain";

export type PublicEvent = {
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
    imageUrl: event.image_url,
    ageRestriction: event.age_restriction,
    price: event.price,
    capacity: event.capacity,
    status: event.status,
    soldTickets: stats?.sold_tickets ?? 0,
    remainingTickets: stats?.remaining_tickets ?? event.capacity,
  };
}

export async function getPublishedEvents() {
  noStore();

  if (!getPublicEnvSafe() && !hasSupabaseServerEnvConfig()) {
    return mockEvents;
  }

  try {
    const supabase = createSupabaseAdminClient();

    const [{ data: events, error: eventsError }, { data: stats, error: statsError }] =
      await Promise.all([
        supabase
          .from("events")
          .select("*")
          .in("status", ["published", "sold_out", "cancelled"])
          .order("date", { ascending: true }),
        supabase.from("event_ticket_stats").select("*"),
      ]);

    if (eventsError) {
      throw new Error(eventsError.message);
    }

    if (statsError) {
      throw new Error(statsError.message);
    }

    const typedEvents = events as Database["public"]["Tables"]["events"]["Row"][];
    const typedStats =
      stats as Database["public"]["Views"]["event_ticket_stats"]["Row"][];
    const statsByEventId = new Map(typedStats.map((item) => [item.id, item]));

    return typedEvents.map((event) =>
      mapEventWithStats(event, statsByEventId.get(event.id)),
    );
  } catch (error) {
    console.error("Fallo cargando eventos publicados; devolviendo lista vacia.", error);
    return [];
  }
}

export async function getPublishedEventBySlug(slug: string) {
  noStore();

  if (!getPublicEnvSafe() && !hasSupabaseServerEnvConfig()) {
    return mockEvents.find((event) => event.slug === slug) ?? null;
  }

  try {
    const supabase = createSupabaseAdminClient();

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .in("status", ["published", "sold_out", "cancelled"])
      .maybeSingle();

    if (eventError) {
      throw new Error(eventError.message);
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
      throw new Error(statsError.message);
    }

    return mapEventWithStats(
      typedEvent,
      (stats as Database["public"]["Views"]["event_ticket_stats"]["Row"] | null) ??
        undefined,
    );
  } catch (error) {
    console.error(`Fallo cargando el evento ${slug}; devolviendo null.`, error);
    return null;
  }
}
