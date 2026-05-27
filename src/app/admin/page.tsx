import Link from "next/link";
import { adminLogoutAction, adminLogoutToHomeAction } from "@/app/admin/actions";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { isAdminAuthenticated } from "@/lib/admin-auth";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
    redirectTo?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [{ error, redirectTo }, isAuthenticated] = await Promise.all([
    searchParams,
    isAdminAuthenticated(),
  ]);

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-6 py-16 md:px-10">
        <section className="w-full rounded-[2rem] border border-border bg-card p-8 shadow-[0_18px_45px_rgba(27,27,24,0.08)]">
          <div className="mb-8 space-y-3">
            <span className="inline-flex rounded-full border border-border bg-background px-4 py-1 text-sm font-medium text-muted">
              Acceso privado
            </span>
            <h1 className="text-4xl font-semibold tracking-tight">
              Panel de administracion
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted">
              Accede con la clave del panel para gestionar eventos, crear
              entradas manuales y comprobar el estado de los accesos.
            </p>
          </div>

          <AdminLoginForm
            redirectTo={redirectTo || "/admin"}
            hasError={error === "1"}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-16 md:px-10">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="space-y-3">
          <span className="inline-flex rounded-full border border-border bg-card px-4 py-1 text-sm font-medium text-muted">
            Area privada
          </span>
          <h1 className="text-4xl font-semibold tracking-tight">
            Panel de administracion
          </h1>
          <p className="max-w-3xl text-base leading-7 text-muted">
            Desde aqui centralizas la operativa de UnderTickets: alta de
            eventos, emision manual de entradas, comprobacion de tickets y
            seguimiento de asistentes.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <form action={adminLogoutToHomeAction}>
            <button
              type="submit"
              className="rounded-full bg-[#171512] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2722]"
            >
              Inicio y cerrar sesion
            </button>
          </form>

          <form action={adminLogoutAction}>
            <button
              type="submit"
              className="rounded-full border border-border bg-white/80 px-5 py-3 text-sm font-semibold text-[#171512] transition hover:bg-card"
            >
              Cerrar sesion
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-6">
        <details className="group rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_12px_30px_rgba(27,27,24,0.06)]" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                1. Crear Eventos
              </h2>
              <p className="text-sm leading-6 text-muted">
                Crea nuevos eventos, modifica los existentes y elimina los que
                ya no deban venderse.
              </p>
            </div>
            <span className="text-sm font-semibold text-muted group-open:rotate-45 transition">
              +
            </span>
          </summary>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/admin/events"
              className="rounded-full bg-[#171512] px-5 py-3 text-sm font-semibold transition hover:bg-[#2a2722]"
              style={{ color: "#ffffff" }}
            >
              Gestionar eventos
            </Link>
            <Link
              href="/admin/dashboard"
              className="rounded-full border border-border bg-white/80 px-5 py-3 text-sm font-semibold text-[#171512] transition hover:bg-background"
            >
              Ver resumen de ventas
            </Link>
          </div>
        </details>

        <details className="group rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_12px_30px_rgba(27,27,24,0.06)]" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                2. Generar y Comprobar Entradas
              </h2>
              <p className="text-sm leading-6 text-muted">
                Genera entradas manuales para invitados, revisa las que ya
                existen y controla los accesos durante el evento.
              </p>
            </div>
            <span className="text-sm font-semibold text-muted group-open:rotate-45 transition">
              +
            </span>
          </summary>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/admin/tickets"
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold transition hover:bg-accent-strong"
              style={{ color: "#ffffff" }}
            >
              Generar y revisar entradas
            </Link>
            <Link
              href="/admin/scan"
              className="rounded-full border border-border bg-white/80 px-5 py-3 text-sm font-semibold text-[#171512] transition hover:bg-background"
            >
              Escanear accesos
            </Link>
          </div>
        </details>
      </div>
    </main>
  );
}
