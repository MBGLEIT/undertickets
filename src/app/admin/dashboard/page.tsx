import {
  formatAdminEventDate,
  getAdminDashboardData,
} from "@/lib/admin-data";

export default async function AdminDashboardPage() {
  const { metrics, events, recentTickets } = await getAdminDashboardData();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-16 md:px-10">
      <div className="space-y-3">
        <span className="inline-flex w-fit rounded-full border border-border bg-card px-4 py-1 text-sm font-medium text-muted">
          Dashboard
        </span>
        <h1 className="text-4xl font-semibold tracking-tight">
          Ventas y asistencia
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted">
          Aqui concentramos una lectura rapida del negocio: facturacion,
          entradas emitidas, accesos consumidos y ocupacion por evento.
        </p>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_12px_30px_rgba(27,27,24,0.06)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {metric.label}
            </p>
            <p className="mt-4 text-3xl font-semibold tracking-tight">
              {metric.value}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">{metric.helper}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_12px_30px_rgba(27,27,24,0.06)]">
          <h2 className="text-2xl font-semibold tracking-tight">
            Resumen por evento
          </h2>
          <div className="mt-6 space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-border bg-background p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">{event.name}</h3>
                    <p className="text-sm text-muted">
                      {formatAdminEventDate(event.date)}
                    </p>
                    <p className="text-sm text-muted">{event.location}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="rounded-xl bg-card px-3 py-2">
                      <p className="text-muted">Vendidas</p>
                      <p className="font-semibold">{event.soldTickets}</p>
                    </div>
                    <div className="rounded-xl bg-card px-3 py-2">
                      <p className="text-muted">Usadas</p>
                      <p className="font-semibold">{event.usedTickets}</p>
                    </div>
                    <div className="rounded-xl bg-card px-3 py-2">
                      <p className="text-muted">Restantes</p>
                      <p className="font-semibold">{event.remainingTickets}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_12px_30px_rgba(27,27,24,0.06)]">
          <h2 className="text-2xl font-semibold tracking-tight">
            Tickets recientes
          </h2>
          <div className="mt-6 space-y-4">
            {recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-2xl border border-border bg-background p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold">{ticket.fullName}</p>
                    <p className="text-sm text-muted">{ticket.eventName}</p>
                    <p className="text-sm text-muted">{ticket.email}</p>
                    <p className="text-sm text-muted">{ticket.code}</p>
                  </div>
                  <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
                    {ticket.used ? "Usado" : "Pendiente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
