import { EventCard } from "@/components/events/event-card";
import { getPublishedEvents } from "@/lib/events";

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-16 md:px-10">
      <div className="mb-12 max-w-3xl space-y-4">
        <span className="inline-flex rounded-full border border-border bg-card px-4 py-1 text-sm font-medium text-muted">
          Web publica
        </span>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Eventos disponibles
        </h1>
        <p className="text-base leading-7 text-muted">
          Esta pantalla ya esta preparada para mostrar datos reales de Supabase.
          Mientras no haya variables de entorno configuradas, usa datos de
          ejemplo para que podamos avanzar en el desarrollo sin bloquear la UI.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </main>
  );
}
