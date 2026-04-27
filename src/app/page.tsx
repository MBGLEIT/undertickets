import Link from "next/link";
import { siteConfig } from "@/lib/site";

export default function Home() {
  const sections = [
    {
      title: "Explorar eventos",
      description:
        "Listado publico con conciertos y eventos locales, detalle de cada evento y entrada al flujo de compra.",
    },
    {
      title: "Comprar con seguridad",
      description:
        "Pago mediante Stripe Checkout y confirmacion real solo cuando el webhook del backend valida la operacion.",
    },
    {
      title: "Validar accesos",
      description:
        "Panel admin para escanear QR, introducir codigos manuales y marcar tickets como usados en tiempo real.",
    },
  ];

  return (
    <main className="flex-1">
      <section className="border-b border-border bg-[radial-gradient(circle_at_top,_rgba(191,91,44,0.18),_transparent_38%),linear-gradient(180deg,_#f9f4ea_0%,_#f7f0e4_100%)]">
        <div className="mx-auto flex min-h-[72vh] w-full max-w-6xl flex-col justify-center gap-10 px-6 py-16 md:px-10">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex rounded-full border border-border bg-card px-4 py-1 text-sm font-medium text-muted">
              Base inicial del proyecto
            </span>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
                {siteConfig.name}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted md:text-xl">
                {siteConfig.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/events"
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
            >
              Ver eventos
            </Link>
            <Link
              href="/admin"
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold transition hover:bg-card"
            >
              Ir al panel admin
            </Link>
          </div>
        </div>
      </section>

      <section
        id="estructura"
        className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10"
      >
        <div className="mb-10 max-w-2xl space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight">
            Que estamos dejando preparado
          </h2>
          <p className="text-base leading-7 text-muted">
            Esta primera version no vende entradas todavia, pero ya define el
            terreno de juego: pagina publica, panel admin y una organizacion
            clara para poder integrar Supabase, Stripe, QR, PDF y emails sin
            mezclar responsabilidades.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-3xl border border-border bg-card p-6 shadow-[0_12px_30px_rgba(27,27,24,0.06)]"
            >
              <h3 className="mb-3 text-xl font-semibold">{section.title}</h3>
              <p className="text-sm leading-7 text-muted">
                {section.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
