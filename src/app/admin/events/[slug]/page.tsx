import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { RouteRealtimeRefresh } from "@/components/realtime/route-realtime-refresh";
import {
  formatAdminEventDate,
  getAdminEventAttendanceBySlug,
} from "@/lib/admin-data";

export const dynamic = "force-dynamic";

type AdminEventAttendancePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function AttendanceList({
  title,
  description,
  attendees,
  emptyMessage,
  accentClassName,
}: {
  title: string;
  description: string;
  attendees: Array<{
    id: string;
    fullName: string;
    dni: string;
    phone: string;
    email: string;
    code: string;
    usedAt: string | null;
    purchasedAt: string;
  }>;
  emptyMessage: string;
  accentClassName: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_12px_30px_rgba(27,27,24,0.06)]">
      <div className="mb-5 space-y-2">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${accentClassName}`}>
            {attendees.length}
          </span>
        </div>
        <p className="text-sm leading-6 text-muted">{description}</p>
      </div>

      {attendees.length > 0 ? (
        <div className="space-y-3">
          {attendees.map((attendee) => (
            <div
              key={attendee.id}
              className="rounded-2xl border border-border bg-background p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-semibold">{attendee.fullName}</p>
                  <p className="text-sm text-muted">DNI: {attendee.dni}</p>
                  <p className="text-sm text-muted">Telefono: {attendee.phone}</p>
                  <p className="text-sm text-muted">{attendee.email}</p>
                  <p className="text-sm text-muted">Codigo: {attendee.code}</p>
                </div>

                <div className="text-right text-sm text-muted">
                  <p>
                    Compra:{" "}
                    {new Intl.DateTimeFormat("es-ES", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(attendee.purchasedAt))}
                  </p>
                  {attendee.usedAt ? (
                    <p>
                      Acceso:{" "}
                      {new Intl.DateTimeFormat("es-ES", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(attendee.usedAt))}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-muted">{emptyMessage}</p>
      )}
    </article>
  );
}

export default async function AdminEventAttendancePage({
  params,
}: AdminEventAttendancePageProps) {
  const { slug } = await params;
  const attendance = await getAdminEventAttendanceBySlug(slug);

  if (!attendance) {
    notFound();
  }

  const { event, arrivedAttendees, pendingAttendees } = attendance;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-16 md:px-10">
      <RouteRealtimeRefresh topics={["tickets", "events"]} />

      <AdminPageHeader
        badge="Seguimiento de asistentes"
        title={event.name}
        description={`${formatAdminEventDate(event.date)} · ${event.location}`}
        backHref="/admin/events"
        backLabel="Volver a eventos"
      />

      <section className="rounded-[2rem] border border-border bg-card p-8 shadow-[0_12px_30px_rgba(27,27,24,0.06)]">
        <div className="flex flex-wrap justify-end gap-4">
          <div className="grid min-w-[280px] grid-cols-2 gap-4">
            <div className="rounded-2xl bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Han llegado
              </p>
              <p className="mt-2 text-3xl font-semibold">{arrivedAttendees.length}</p>
            </div>
            <div className="rounded-2xl bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Faltan por llegar
              </p>
              <p className="mt-2 text-3xl font-semibold">{pendingAttendees.length}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <AttendanceList
          title="Asistentes ya validados"
          description="Personas con entrada que ya han pasado por control de acceso."
          attendees={arrivedAttendees}
          emptyMessage="Todavia no se ha validado ninguna entrada en este evento."
          accentClassName="bg-[rgba(26,112,74,0.10)] text-[rgb(26,112,74)]"
        />

        <AttendanceList
          title="Entradas pendientes de llegada"
          description="Personas con ticket emitido que aun no han sido escaneadas."
          attendees={pendingAttendees}
          emptyMessage="No queda nadie pendiente de acceder con entrada emitida."
          accentClassName="bg-[rgba(191,91,44,0.12)] text-[rgb(142,63,26)]"
        />
      </div>
    </main>
  );
}
