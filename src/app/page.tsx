import Link from "next/link";
import { siteConfig } from "@/lib/site";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(191,91,44,0.22),_transparent_34%),linear-gradient(180deg,_#faf5ed_0%,_#f2e5d1_100%)] px-6 py-16">
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center">
        <div className="space-y-6">
          <h1 className="text-6xl font-semibold tracking-[-0.06em] text-balance text-[#171512] md:text-8xl">
            {siteConfig.name}
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-[#5f594f] md:text-2xl">
            No dejes que se agoten. Descubre los eventos del momento y consigue
            tu entrada antes de que vuelen.
          </p>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <Link
            href="/events"
            className="rounded-full bg-[#171512] px-10 py-4 text-xl font-semibold transition hover:bg-[#2a2722]"
            style={{ color: "#ffffff" }}
          >
            Ver eventos
          </Link>
          <Link
            href="/admin"
            className="rounded-full border border-[rgba(23,21,18,0.14)] bg-white/85 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#5f594f] shadow-[0_12px_25px_rgba(23,21,18,0.08)] transition hover:border-[rgba(23,21,18,0.24)] hover:text-[#171512]"
          >
            Acceso Administradores
          </Link>
        </div>
      </section>
    </main>
  );
}
