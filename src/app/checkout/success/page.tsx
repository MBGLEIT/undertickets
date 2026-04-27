import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16 md:px-10">
      <span className="inline-flex w-fit rounded-full border border-border bg-card px-4 py-1 text-sm font-medium text-muted">
        Checkout
      </span>
      <h1 className="text-4xl font-semibold tracking-tight">
        Pago recibido
      </h1>
      <p className="text-base leading-7 text-muted">
        Esta pantalla representa el regreso desde Stripe. Ojo con este detalle:
        que el usuario llegue aqui no significa todavia que debamos emitir la
        entrada. La confirmacion real la haremos mas adelante con el webhook.
      </p>
      <Link
        href="/events"
        className="w-fit rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
      >
        Volver a eventos
      </Link>
    </main>
  );
}
