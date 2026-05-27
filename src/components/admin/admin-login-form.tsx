import Link from "next/link";
import { adminLoginAction } from "@/app/admin/actions";

type AdminLoginFormProps = {
  redirectTo?: string;
  hasError?: boolean;
};

export function AdminLoginForm({
  redirectTo = "/admin",
  hasError = false,
}: AdminLoginFormProps) {
  return (
    <div className="space-y-5">
      <form action={adminLoginAction} className="space-y-5">
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <div className="space-y-2">
          <label
            htmlFor="admin-password"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a6a54]"
          >
            Clave de acceso
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            required
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
            placeholder="Introduce la clave"
          />
        </div>

        {hasError ? (
          <p className="text-sm text-[rgb(155,36,36)]">
            La clave no es correcta. Vuelve a intentarlo.
          </p>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-full bg-[#171512] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2722]"
        >
          Entrar al panel
        </button>
      </form>

      <Link
        href="/"
        className="flex w-full items-center justify-center rounded-full border border-border bg-white/80 px-5 py-3 text-sm font-semibold text-[#171512] transition hover:bg-card"
      >
        Volver al menu principal
      </Link>
    </div>
  );
}
