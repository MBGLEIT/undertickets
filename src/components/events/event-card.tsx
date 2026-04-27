import Link from "next/link";
import { type PublicEvent } from "@/lib/events";
import { formatEventDate, formatPrice } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type EventCardProps = {
  event: PublicEvent;
};

export function EventCard({ event }: EventCardProps) {
  const soldOut = event.remainingTickets <= 0;

  return (
    <article className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-[0_12px_30px_rgba(27,27,24,0.06)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Evento local
        </span>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            soldOut
              ? "bg-[rgba(110,35,10,0.08)] text-[rgb(110,35,10)]"
              : "bg-[rgba(26,112,74,0.10)] text-[rgb(26,112,74)]",
          )}
        >
          {soldOut ? "Agotado" : `${event.remainingTickets} disponibles`}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">{event.name}</h2>
          <p className="text-sm leading-6 text-muted">
            {formatEventDate(event.date)}
          </p>
          <p className="text-sm leading-6 text-muted">{event.location}</p>
        </div>

        <p className="text-sm leading-7 text-muted">{event.description}</p>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Desde
          </p>
          <p className="text-2xl font-semibold">{formatPrice(event.price)}</p>
        </div>

        <Link
          href={`/events/${event.slug}`}
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
        >
          Ver detalle
        </Link>
      </div>
    </article>
  );
}
