import Link from "next/link";
import { RouteRealtimeRefresh } from "@/components/realtime/route-realtime-refresh";
import { EventCard } from "@/components/events/event-card";
import { getPublishedEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-16 md:px-10">
      <RouteRealtimeRefresh topics={["events", "tickets"]} />

      <div className="mb-12 max-w-3xl space-y-4">
        <span className="inline-flex rounded-full border border-border bg-card px-4 py-1 text-sm font-medium text-muted">
          Web publica
        </span>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Eventos disponibles
        </h1>
        <p className="text-base leading-7 text-muted">
          Descubre los eventos activos de UnderTickets y encuentra el plan que
          mas te encaje antes de que se agoten las entradas.
        </p>
      </div>

      {events.length > 0 ? (
        <>
          <div className="flex flex-col gap-8">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          <div className="mt-10 flex justify-end">
            <Link
              href="/"
              className="rounded-full border border-border bg-white/85 px-6 py-3 text-sm font-semibold text-[#171512] shadow-[0_12px_25px_rgba(23,21,18,0.08)] transition hover:bg-card"
            >
              Volver al inicio
            </Link>
          </div>
        </>
      ) : (
        <div className="space-y-8">
          <section className="rounded-[2rem] border border-border bg-card p-10 text-center shadow-[0_12px_30px_rgba(27,27,24,0.06)]">
            <h2 className="text-2xl font-semibold tracking-tight">
              Ahora mismo no hay eventos publicados
            </h2>
            <p className="mt-4 text-base leading-7 text-muted">
              En cuanto se creen nuevos eventos apareceran aqui automaticamente.
            </p>
          </section>

          <div className="flex justify-end">
            <Link
              href="/"
              className="rounded-full border border-border bg-white/85 px-6 py-3 text-sm font-semibold text-[#171512] shadow-[0_12px_25px_rgba(23,21,18,0.08)] transition hover:bg-card"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
