"use client";

import { useState, useTransition } from "react";

type PurchaseTicketFormProps = {
  eventSlug: string;
  disabled?: boolean;
  disabledReason?: "sold_out" | "cancelled" | null;
};

type CheckoutResponse = {
  url?: string;
  error?: string;
};

export function PurchaseTicketForm({
  eventSlug,
  disabled = false,
  disabledReason = null,
}: PurchaseTicketFormProps) {
  const [fullName, setFullName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventSlug,
          fullName,
          dni,
          phone,
          email,
        }),
      });

      const data = (await response.json()) as CheckoutResponse;

      if (!response.ok || !data.url) {
        setError(data.error ?? "No se pudo iniciar el proceso de pago.");
        return;
      }

      window.location.assign(data.url);
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label
          htmlFor="ticket-full-name"
          className="text-xs uppercase tracking-[0.18em] text-white/55"
        >
          Nombre y apellidos
        </label>
        <input
          id="ticket-full-name"
          type="text"
          name="fullName"
          required
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Nombre Apellidos"
          className="w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/35"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="ticket-dni"
            className="text-xs uppercase tracking-[0.18em] text-white/55"
          >
            DNI
          </label>
          <input
            id="ticket-dni"
            type="text"
            name="dni"
            required
            value={dni}
            onChange={(event) => setDni(event.target.value.toUpperCase())}
            placeholder="12345678A"
            className="w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/35"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="ticket-phone"
            className="text-xs uppercase tracking-[0.18em] text-white/55"
          >
            Telefono
          </label>
          <input
            id="ticket-phone"
            type="tel"
            name="phone"
            required
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+34 600 000 000"
            className="w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/35"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="ticket-email"
          className="text-xs uppercase tracking-[0.18em] text-white/55"
        >
          Email del comprador
        </label>
        <input
          id="ticket-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
          className="w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/35"
        />
      </div>

      <p className="text-xs leading-6 text-white/55">
        Estos datos viajaran con el ticket para identificar al asistente y para
        poder saber en admin quien ha llegado y quien falta por llegar.
      </p>

      <button
        type="submit"
        disabled={disabled || isPending}
        className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-white/20"
      >
        {disabled
          ? disabledReason === "cancelled"
            ? "Evento cancelado"
            : "Evento agotado"
          : isPending
            ? "Preparando pago..."
            : "Comprar entrada"}
      </button>

      {error ? <p className="text-sm text-[#ffb293]">{error}</p> : null}
    </form>
  );
}
