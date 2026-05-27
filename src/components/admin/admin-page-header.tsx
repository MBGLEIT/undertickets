import Link from "next/link";
import { adminLogoutAction, adminLogoutToHomeAction } from "@/app/admin/actions";

type AdminPageHeaderProps = {
  badge: string;
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  showHomeAction?: boolean;
};

export function AdminPageHeader({
  badge,
  title,
  description,
  backHref = "/admin",
  backLabel = "Volver al panel",
  showHomeAction = true,
}: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-[#171512] transition hover:bg-card"
          >
            {backLabel}
          </Link>
          <span className="inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted">
            {badge}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {showHomeAction ? (
            <form action={adminLogoutToHomeAction}>
              <button
                type="submit"
                className="rounded-full bg-[#171512] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2722]"
              >
                Inicio y cerrar sesion
              </button>
            </form>
          ) : null}

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

      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-3xl text-base leading-7 text-muted">{description}</p>
      </div>
    </header>
  );
}
