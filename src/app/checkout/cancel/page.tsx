import Link from "next/link";

type CheckoutCancelPageProps = {
  searchParams: Promise<{
    event?: string;
  }>;
};

export default async function CheckoutCancelPage({
  searchParams,
}: CheckoutCancelPageProps) {
  const { event } = await searchParams;
  const backHref = event ? `/events/${event}` : "/events";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16 md:px-10">
      <span className="inline-flex w-fit rounded-full border border-border bg-card px-4 py-1 text-sm font-medium text-muted">
        Checkout
      </span>
      <h1 className="text-4xl font-semibold tracking-tight">
        Pago cancelado
      </h1>
      <p className="text-base leading-7 text-muted">
        El usuario ha salido de Stripe sin completar el pago. Esto no genera
        ticket ni reserva de entrada.
      </p>
      <Link
        href={backHref}
        className="w-fit rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
      >
        Volver al evento
      </Link>
    </main>
  );
}
