import Link from "next/link";
import { notFound } from "next/navigation";
import { PurchaseTicketForm } from "@/components/events/purchase-ticket-form";
import { RouteRealtimeRefresh } from "@/components/realtime/route-realtime-refresh";
import { getPublishedEventBySlug } from "@/lib/events";
import { formatEventDate, formatPrice } from "@/lib/formatters";

export const dynamic = "force-dynamic";

type EventDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const soldOut = event.status === "sold_out" || event.remainingTickets <= 0;
  const cancelled = event.status === "cancelled";
  const disabledReason = cancelled ? "cancelled" : soldOut ? "sold_out" : null;
  const ageRestrictionStyles = {
    "+16": "bg-[rgba(212,158,18,0.14)] text-[rgb(153,110,6)]",
    "+18": "bg-[rgba(155,36,36,0.12)] text-[rgb(155,36,36)]",
    "+21": "bg-[rgba(46,82,168,0.12)] text-[rgb(46,82,168)]",
  } as const;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-16 md:px-10">
      <RouteRealtimeRefresh topics={["events", "tickets"]} />

      <Link
        href="/events"
        className="inline-flex w-fit items-center rounded-full border border-border bg-white/85 px-5 py-3 text-sm font-semibold text-[#171512] shadow-[0_12px_25px_rgba(23,21,18,0.08)] transition hover:bg-card"
      >
        Volver a eventos
      </Link>

      <section className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <article className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_14px_40px_rgba(27,27,24,0.06)]">
          <div className="relative min-h-80 bg-[#d9c6ab]">
            {event.imageUrl ? (
              <img
                src={event.imageUrl}
                alt={event.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,_rgba(191,91,44,0.18),_rgba(239,226,200,0.75))] p-10 text-center text-[#5f594f]">
                Imagen del evento pendiente
              </div>
            )}
          </div>

          <div className="p-8">
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Evento local
            </span>
            {event.ageRestriction ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${ageRestrictionStyles[event.ageRestriction]}`}
              >
                {event.ageRestriction}
              </span>
            ) : null}
            <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted">
              {cancelled
                ? "Cancelado"
                : soldOut
                  ? "Agotado"
                  : `${event.remainingTickets} plazas libres`}
            </span>
          </div>

          <div className="space-y-5">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              {event.name}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-muted">
              {event.description}
            </p>
          </div>
          </div>
        </article>

        <aside className="rounded-[2rem] border border-border bg-[#1f1d1a] p-8 text-white shadow-[0_14px_40px_rgba(27,27,24,0.12)]">
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/55">
                Fecha y hora
              </p>
              <p className="text-lg font-medium">{formatEventDate(event.date)}</p>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/55">
                Ubicacion
              </p>
              <p className="text-lg font-medium">{event.location}</p>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/55">
                Precio
              </p>
              <p className="text-3xl font-semibold">{formatPrice(event.price)}</p>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/55">
                Aforo restante
              </p>
              <p className="text-lg font-medium">
                {cancelled
                  ? "Evento cancelado"
                  : soldOut
                  ? "No quedan entradas"
                  : `${event.remainingTickets} entradas disponibles`}
              </p>
            </div>

            {event.ageRestriction ? (
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/55">
                  Restriccion de edad
                </p>
                <p className="text-lg font-medium">{event.ageRestriction}</p>
              </div>
            ) : null}

            <PurchaseTicketForm
              eventSlug={event.slug}
              ageRestriction={event.ageRestriction}
              disabled={Boolean(disabledReason)}
              disabledReason={disabledReason}
            />
          </div>
        </aside>
      </section>
    </main>
  );
}
