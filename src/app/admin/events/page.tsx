import Link from "next/link";
import {
  formatAdminEventDate,
  formatAdminStatus,
  getAdminEventsSummary,
} from "@/lib/admin-data";
import { formatPrice } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export default async function AdminEventsPage() {
  const events = await getAdminEventsSummary();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-16 md:px-10">
      <div className="space-y-3">
        <span className="inline-flex w-fit rounded-full border border-border bg-card px-4 py-1 text-sm font-medium text-muted">
          Eventos
        </span>
        <h1 className="text-4xl font-semibold tracking-tight">
          Gestion de eventos
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted">
          Esta vista resume capacidad, ventas y estado de cada evento. En el
          siguiente bloque podremos convertirla en un CRUD completo con crear,
          editar y eliminar.
        </p>
      </div>

      <div className="grid gap-5">
        {events.map((event) => (
          <article
            key={event.id}
            className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_12px_30px_rgba(27,27,24,0.06)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {event.name}
                  </h2>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      event.status === "sold_out"
                        ? "bg-[rgba(110,35,10,0.08)] text-[rgb(110,35,10)]"
                        : "bg-[rgba(26,112,74,0.10)] text-[rgb(26,112,74)]",
                    )}
                  >
                    {formatAdminStatus(event.status)}
                  </span>
                </div>
                <p className="text-sm text-muted">
                  {formatAdminEventDate(event.date)}
                </p>
                <p className="text-sm text-muted">{event.location}</p>
              </div>

              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Precio
                </p>
                <p className="text-2xl font-semibold">
                  {formatPrice(event.price)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Capacidad
                </p>
                <p className="mt-2 text-2xl font-semibold">{event.capacity}</p>
              </div>
              <div className="rounded-2xl bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Vendidas
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {event.soldTickets}
                </p>
              </div>
              <div className="rounded-2xl bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Usadas
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {event.usedTickets}
                </p>
              </div>
              <div className="rounded-2xl bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Restantes
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {event.remainingTickets}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Link
                href={`/admin/events/${event.slug}`}
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
              >
                Ver asistentes
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
