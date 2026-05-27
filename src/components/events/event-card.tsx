import Link from "next/link";
import { type PublicEvent } from "@/lib/events";
import { formatEventDate, formatPrice } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type EventCardProps = {
  event: PublicEvent;
};

export function EventCard({ event }: EventCardProps) {
  const soldOut = event.status === "sold_out" || event.remainingTickets <= 0;
  const cancelled = event.status === "cancelled";
  const statusLabel = cancelled
    ? "Cancelado"
    : soldOut
      ? "Agotado"
      : `${event.remainingTickets} disponibles`;
  const ageRestrictionStyles = {
    "+16": "bg-[rgba(212,158,18,0.14)] text-[rgb(153,110,6)]",
    "+18": "bg-[rgba(155,36,36,0.12)] text-[rgb(155,36,36)]",
    "+21": "bg-[rgba(46,82,168,0.12)] text-[rgb(46,82,168)]",
  } as const;

  return (
    <article className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_12px_30px_rgba(27,27,24,0.06)]">
      <div className="grid md:grid-cols-[0.8fr_1.2fr]">
        <div className="relative min-h-72 bg-[#d9c6ab]">
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

        <div className="flex flex-col p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Evento
              </span>
              {event.ageRestriction ? (
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
                    ageRestrictionStyles[event.ageRestriction],
                  )}
                >
                  {event.ageRestriction}
                </span>
              ) : null}
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                cancelled
                  ? "bg-[rgba(74,84,112,0.12)] text-[rgb(55,65,92)]"
                  : soldOut
                    ? "bg-[rgba(110,35,10,0.08)] text-[rgb(110,35,10)]"
                  : "bg-[rgba(26,112,74,0.10)] text-[rgb(26,112,74)]",
              )}
            >
              {statusLabel}
            </span>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight">{event.name}</h2>
            <p className="text-sm leading-6 text-muted">
              {formatEventDate(event.date)}
            </p>
            <p className="text-sm leading-6 text-muted">{event.location}</p>
            <p className="text-base leading-7 text-muted">{event.description}</p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Precio
              </p>
              <p className="text-3xl font-semibold">{formatPrice(event.price)}</p>
            </div>

            <Link
              href={`/events/${event.slug}`}
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold transition hover:bg-accent-strong"
              style={{ color: "#ffffff" }}
            >
              Ver detalle
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
