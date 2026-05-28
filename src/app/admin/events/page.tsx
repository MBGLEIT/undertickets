import Link from "next/link";
import {
  createEventAction,
  deleteEventAction,
  updateEventAction,
} from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { RouteRealtimeRefresh } from "@/components/realtime/route-realtime-refresh";
import {
  formatAdminDateInput,
  formatAdminEventDate,
  formatAdminPriceInput,
  formatAdminStatus,
  getAdminEventsForForm,
} from "@/lib/admin-data";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AdminEventsPageProps = {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
  }>;
};

function FeedbackBanner({
  created,
  updated,
  deleted,
}: {
  created?: string;
  updated?: string;
  deleted?: string;
}) {
  const message = created
    ? "Evento creado correctamente."
    : updated
      ? "Evento actualizado correctamente."
      : deleted
        ? "Evento eliminado correctamente."
        : null;

  if (!message) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[rgba(26,112,74,0.18)] bg-[rgba(26,112,74,0.08)] px-5 py-4 text-sm text-[rgb(26,112,74)]">
      {message}
    </div>
  );
}

export default async function AdminEventsPage({
  searchParams,
}: AdminEventsPageProps) {
  const [params, events] = await Promise.all([
    searchParams,
    getAdminEventsForForm(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-16 md:px-10">
      <RouteRealtimeRefresh topics={["events"]} />

      <AdminPageHeader
        badge="Crear Eventos"
        title="Gestion de eventos"
        description="Aqui puedes crear eventos nuevos, editar los ya publicados o retirar los que ya no deban estar disponibles para compra."
      />

      <FeedbackBanner
        created={params.created}
        updated={params.updated}
        deleted={params.deleted}
      />

      <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_12px_30px_rgba(27,27,24,0.06)]">
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Crear nuevo evento
          </h2>
          <p className="text-sm leading-6 text-muted">
            Completa los datos principales y el evento quedara disponible en el
            panel. Si lo marcas como publicado podra mostrarse en la web.
          </p>
        </div>

        <form
          action={createEventAction}
          encType="multipart/form-data"
          className="grid gap-4 md:grid-cols-2"
        >
          <input
            name="name"
            required
            placeholder="Nombre del evento"
            className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <input
            name="slug"
            placeholder="slug-opcional"
            className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <input
            name="location"
            required
            placeholder="Ubicacion"
            className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <input
            type="datetime-local"
            name="date"
            required
            className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <input
            name="price"
            required
            placeholder="Precio en euros. Ej: 25.00"
            className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <input
            type="number"
            name="capacity"
            min="1"
            required
            placeholder="Capacidad"
            className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <input
            name="imageUrl"
            placeholder="URL de imagen opcional si no subes cartel"
            className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent md:col-span-2"
          />
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Cartel del evento
            </label>
            <input
              type="file"
              name="poster"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-[#171512] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            <p className="text-xs leading-6 text-muted">
              Puedes subir el cartel directamente. Si subes archivo, tendra prioridad sobre la URL.
            </p>
          </div>
          <select
            name="status"
            defaultValue="draft"
            className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          >
            <option value="draft">Oculto</option>
            <option value="published">Publicado</option>
            <option value="sold_out">Agotado</option>
            <option value="cancelled">Cancelado</option>
          </select>
          <select
            name="ageRestriction"
            defaultValue=""
            className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          >
            <option value="">Sin restriccion de edad</option>
            <option value="+16">+16</option>
            <option value="+18">+18</option>
            <option value="+21">+21</option>
          </select>
          <textarea
            name="description"
            required
            placeholder="Descripcion del evento"
            className="min-h-32 rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent md:col-span-2"
          />
          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-[#171512] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2722]"
            >
              Crear evento
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-5">
        {events.length === 0 ? (
          <div className="rounded-[1.75rem] border border-border bg-card p-6 text-sm leading-7 text-muted shadow-[0_12px_30px_rgba(27,27,24,0.06)]">
            Ahora mismo no hay eventos creados en la base de datos. Cuando
            crees el primero aparecera aqui para editarlo y gestionar sus
            asistentes.
          </div>
        ) : null}

        {events.map((event) => (
          <article
            key={event.id}
            className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_12px_30px_rgba(27,27,24,0.06)]"
          >
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
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
                {event.ageRestriction ? (
                  <p className="text-sm text-muted">
                    Restriccion de edad: {event.ageRestriction}
                  </p>
                ) : null}
              </div>

              <Link
                href={`/admin/events/${event.slug}`}
                className="rounded-full border border-border bg-white/80 px-5 py-3 text-sm font-semibold text-[#171512] transition hover:bg-background"
              >
                Ver asistentes
              </Link>
            </div>

            <form
              action={updateEventAction}
              encType="multipart/form-data"
              className="grid gap-4 md:grid-cols-2"
            >
              <input type="hidden" name="id" value={event.id} />
              <input type="hidden" name="currentImageUrl" value={event.imageUrl ?? ""} />
              <input
                name="name"
                defaultValue={event.name}
                required
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <input
                name="slug"
                defaultValue={event.slug}
                required
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <input
                name="location"
                defaultValue={event.location}
                required
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <input
                type="datetime-local"
                name="date"
                defaultValue={formatAdminDateInput(event.date)}
                required
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <input
                name="price"
                defaultValue={formatAdminPriceInput(event.price)}
                required
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <input
                type="number"
                name="capacity"
                min="1"
                defaultValue={event.capacity}
                required
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <input
                name="imageUrl"
                defaultValue={event.imageUrl ?? ""}
                placeholder="URL de imagen opcional si no subes cartel"
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent md:col-span-2"
              />
              <div className="space-y-3 md:col-span-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Sustituir cartel
                  </label>
                  <input
                    type="file"
                    name="poster"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-[#171512] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />
                </div>
                {event.imageUrl ? (
                  <div className="space-y-3 rounded-2xl border border-border bg-background/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      Cartel actual
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.imageUrl}
                      alt={`Cartel de ${event.name}`}
                      className="h-48 w-full rounded-2xl object-cover"
                    />
                    <label className="flex items-center gap-3 text-sm text-muted">
                      <input type="checkbox" name="removePoster" className="h-4 w-4" />
                      Eliminar cartel actual
                    </label>
                  </div>
                ) : (
                  <p className="text-xs leading-6 text-muted">
                    Este evento todavia no tiene cartel guardado.
                  </p>
                )}
              </div>
              <select
                name="status"
                defaultValue={event.status}
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              >
                <option value="draft">Oculto</option>
                <option value="published">Publicado</option>
                <option value="sold_out">Agotado</option>
                <option value="cancelled">Cancelado</option>
              </select>
              <select
                name="ageRestriction"
                defaultValue={event.ageRestriction ?? ""}
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              >
                <option value="">Sin restriccion de edad</option>
                <option value="+16">+16</option>
                <option value="+18">+18</option>
                <option value="+21">+21</option>
              </select>
              <textarea
                name="description"
                defaultValue={event.description}
                required
                className="min-h-32 rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent md:col-span-2"
              />
              <div className="flex flex-wrap gap-3 md:col-span-2">
                <button
                  type="submit"
                  className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
                >
                  Guardar cambios
                </button>
              </div>
            </form>

            <form action={deleteEventAction} className="mt-4">
              <input type="hidden" name="id" value={event.id} />
              <button
                type="submit"
                className="rounded-full border border-[rgba(155,36,36,0.18)] px-5 py-3 text-sm font-semibold text-[rgb(155,36,36)] transition hover:bg-[rgba(155,36,36,0.06)]"
              >
                Eliminar evento
              </button>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}
