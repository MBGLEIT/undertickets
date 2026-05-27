import Link from "next/link";
import {
  createManualTicketAction,
  deleteTicketAction,
  retryTicketEmailAction,
} from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ManualTicketForm } from "@/components/admin/manual-ticket-form";
import { RouteRealtimeRefresh } from "@/components/realtime/route-realtime-refresh";
import { getAdminTicketOverview } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

type AdminTicketsPageProps = {
  searchParams: Promise<{
    created?: string;
    emailError?: string;
    emailRetried?: string;
    emailRetryFailed?: string;
    ticketDeleted?: string;
  }>;
};

export default async function AdminTicketsPage({
  searchParams,
}: AdminTicketsPageProps) {
  const [{ created, emailError, emailRetried, emailRetryFailed, ticketDeleted }, { events, tickets, failedEmailTickets }] = await Promise.all([
    searchParams,
    getAdminTicketOverview(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-16 md:px-10">
      <RouteRealtimeRefresh topics={["tickets", "events"]} />

      <AdminPageHeader
        badge="Generar y Comprobar Entradas"
        title="Entradas manuales y comprobacion"
        description="Genera entradas para invitados o incidencias y revisa todas las entradas ya creadas o compradas desde un solo sitio."
      />

      {created || emailError || emailRetried || emailRetryFailed || ticketDeleted ? (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm ${
            emailRetryFailed
              ? "border-[rgba(155,36,36,0.16)] bg-[rgba(155,36,36,0.08)] text-[rgb(155,36,36)]"
              : ticketDeleted
                ? "border-[rgba(26,112,74,0.18)] bg-[rgba(26,112,74,0.08)] text-[rgb(26,112,74)]"
              : emailError
                ? "border-[rgba(179,93,0,0.16)] bg-[rgba(179,93,0,0.08)] text-[rgb(140,76,8)]"
                : "border-[rgba(26,112,74,0.18)] bg-[rgba(26,112,74,0.08)] text-[rgb(26,112,74)]"
          }`}
        >
          {emailRetryFailed
            ? "La entrada existe, pero el email sigue fallando. La tienes en Entradas con errores."
            : ticketDeleted
              ? "Entrada retirada correctamente."
            : emailError
              ? "Entrada creada correctamente, pero el email no se pudo enviar. Puedes revisarlo en Entradas con errores."
              : emailRetried
                ? "Email reenviado correctamente."
                : "Entrada generada correctamente."}
        </div>
      ) : null}

      <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_12px_30px_rgba(27,27,24,0.06)]">
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Generar entrada manual
          </h2>
          <p className="text-sm leading-6 text-muted">
            Crea una entrada como si ya se hubiera comprado para invitados,
            prensa o resolucion de incidencias en taquilla.
          </p>
        </div>

        <ManualTicketForm action={createManualTicketAction} events={events} />
      </section>

      <details
        className="group rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_12px_30px_rgba(27,27,24,0.06)]"
        open={failedEmailTickets.length > 0}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Entradas con errores
            </h2>
            <p className="text-sm leading-6 text-muted">
              Aqui aparecen las entradas cuyo correo no se pudo enviar, ya sean
              manuales o compradas desde la web.
            </p>
          </div>
          <span className="flex items-center gap-3">
            <span className="rounded-full bg-[rgba(155,36,36,0.12)] px-3 py-1 text-xs font-semibold text-[rgb(155,36,36)]">
              {failedEmailTickets.length}
            </span>
            <span className="text-sm font-semibold text-muted transition group-open:rotate-45">
              +
            </span>
          </span>
        </summary>

        {failedEmailTickets.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {failedEmailTickets.map((ticket) => (
              <article
                key={ticket.ticketId}
                className="rounded-[1.5rem] border border-[rgba(155,36,36,0.12)] bg-[rgba(255,255,255,0.78)] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold">{ticket.fullName}</h3>
                    <p className="text-sm text-muted">{ticket.eventName}</p>
                    <p className="text-sm text-muted">{ticket.email}</p>
                    <p className="text-sm text-[rgb(155,36,36)]">
                      Error: {ticket.errorMessage}
                    </p>
                  </div>

                  <div className="space-y-2 text-right text-sm">
                    <p className="text-muted">Intentos: {ticket.attemptCount}</p>
                    <p className="text-muted">
                      Ultimo intento:{" "}
                      {ticket.lastAttemptAt
                        ? new Intl.DateTimeFormat("es-ES", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(ticket.lastAttemptAt))
                        : "Sin intentos"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/api/generate-pdf?ticketId=${ticket.ticketId}`}
                    className="rounded-full border border-border bg-white/85 px-5 py-3 text-sm font-semibold text-[#171512] transition hover:bg-card"
                  >
                    Descargar PDF
                  </Link>

                  <form action={retryTicketEmailAction}>
                    <input type="hidden" name="ticketId" value={ticket.ticketId} />
                    <button
                      type="submit"
                      className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
                    >
                      Reenviar correo
                    </button>
                  </form>

                  <form action={deleteTicketAction}>
                    <input type="hidden" name="ticketId" value={ticket.ticketId} />
                    <button
                      type="submit"
                      className="rounded-full border border-[rgba(155,36,36,0.18)] px-5 py-3 text-sm font-semibold text-[rgb(155,36,36)] transition hover:bg-[rgba(155,36,36,0.06)]"
                    >
                      Retirar entrada
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm leading-6 text-muted">
            No hay incidencias de email ahora mismo.
          </p>
        )}
      </details>

      <section className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Entradas existentes
          </h2>
          <p className="text-sm leading-6 text-muted">
            Aqui ves tanto las entradas manuales como las compradas desde la web.
          </p>
        </div>

        {tickets.length > 0 ? (
          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <article
                key={ticket.id}
                className="rounded-[1.5rem] border border-border bg-card p-5 shadow-[0_12px_30px_rgba(27,27,24,0.06)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold">{ticket.fullName}</h3>
                    <p className="text-sm text-muted">{ticket.eventName}</p>
                    <p className="text-sm text-muted">{ticket.email}</p>
                    <p className="text-sm text-muted">DNI: {ticket.dni}</p>
                    <p className="text-sm text-muted">Telefono: {ticket.phone}</p>
                  </div>

                  <div className="space-y-2 text-right text-sm">
                    <div className="flex flex-wrap justify-end gap-2">
                      <span className="inline-flex rounded-full bg-surface px-3 py-1 font-semibold text-muted">
                        {ticket.used ? "Usada" : "Pendiente"}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 font-semibold ${
                          ticket.emailStatus === "failed"
                            ? "bg-[rgba(155,36,36,0.12)] text-[rgb(155,36,36)]"
                            : ticket.emailStatus === "sent"
                              ? "bg-[rgba(26,112,74,0.10)] text-[rgb(26,112,74)]"
                              : "bg-white/80 text-muted"
                        }`}
                      >
                        {ticket.emailStatus === "failed"
                          ? "Email fallido"
                          : ticket.emailStatus === "sent"
                            ? "Email enviado"
                            : ticket.emailStatus === "pending"
                              ? "Email pendiente"
                              : "Sin registro email"}
                      </span>
                    </div>
                    <p className="text-muted">Codigo: {ticket.code}</p>
                    <p className="text-muted">
                      Compra:{" "}
                      {new Intl.DateTimeFormat("es-ES", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(ticket.purchasedAt))}
                    </p>
                    {ticket.usedAt ? (
                      <p className="text-muted">
                        Acceso:{" "}
                        {new Intl.DateTimeFormat("es-ES", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(ticket.usedAt))}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/api/generate-pdf?ticketId=${ticket.id}`}
                    className="rounded-full border border-border bg-white/85 px-5 py-3 text-sm font-semibold text-[#171512] transition hover:bg-card"
                  >
                    Descargar PDF
                  </Link>

                  <form action={retryTicketEmailAction}>
                    <input type="hidden" name="ticketId" value={ticket.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
                    >
                      Reenviar correo
                    </button>
                  </form>

                  <form action={deleteTicketAction}>
                    <input type="hidden" name="ticketId" value={ticket.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-[rgba(155,36,36,0.18)] px-5 py-3 text-sm font-semibold text-[rgb(155,36,36)] transition hover:bg-[rgba(155,36,36,0.06)]"
                    >
                      Retirar entrada
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted">
            Todavia no hay entradas creadas para revisar.
          </div>
        )}
      </section>
    </main>
  );
}
