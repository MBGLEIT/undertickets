import Link from "next/link";
import { notFound } from "next/navigation";
import { PurchaseTicketForm } from "@/components/events/purchase-ticket-form";
import { getPublishedEventBySlug } from "@/lib/events";
import { formatEventDate, formatPrice } from "@/lib/formatters";

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

  const soldOut = event.remainingTickets <= 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-16 md:px-10">
      <Link href="/events" className="text-sm font-medium text-muted">
        Volver a eventos
      </Link>

      <section className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <article className="rounded-[2rem] border border-border bg-card p-8 shadow-[0_14px_40px_rgba(27,27,24,0.06)]">
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Evento local
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted">
              {soldOut ? "Agotado" : `${event.remainingTickets} plazas libres`}
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
                {soldOut
                  ? "No quedan entradas"
                  : `${event.remainingTickets} entradas disponibles`}
              </p>
            </div>

            <PurchaseTicketForm eventSlug={event.slug} disabled={soldOut} />
          </div>
        </aside>
      </section>
    </main>
  );
}
