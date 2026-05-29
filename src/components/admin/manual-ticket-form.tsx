"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

type ManualTicketFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  events: Array<{
    id: string;
    name: string;
  }>;
};

const stagedLogs = [
  "Comprobando aforo y datos del evento...",
  "Generando identificador del ticket y codigo QR...",
  "Guardando la entrada en la base de datos...",
  "Preparando PDF y gestionando el envio del email...",
  "Finalizando proceso de emision...",
];

function LoadingState() {
  const { pending } = useFormStatus();
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!pending) {
      setVisibleLogs([]);
      return;
    }

    setVisibleLogs([stagedLogs[0]]);
    let index = 1;

    const interval = setInterval(() => {
      setVisibleLogs((current) => {
        if (index >= stagedLogs.length) {
          return current;
        }

        const nextLogs = [...current, stagedLogs[index]];
        index += 1;
        return nextLogs;
      });
    }, 1100);

    return () => clearInterval(interval);
  }, [pending]);

  if (!pending) {
    return null;
  }

  return (
    <div className="mt-5 rounded-[1.5rem] border border-border bg-background p-5 shadow-[0_12px_25px_rgba(27,27,24,0.05)]">
      <div className="flex items-center gap-3">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#c85f2b] border-t-transparent" />
        <div>
          <p className="text-sm font-semibold text-[#171512]">
            Generando entrada...
          </p>
          <p className="text-sm text-muted">
            Estamos completando el alta del ticket y su preparacion.
          </p>
        </div>
      </div>

      <details className="mt-4" open>
        <summary className="cursor-pointer text-sm font-semibold text-[#171512]">
          Ver progreso
        </summary>

        <div className="mt-3 space-y-2 rounded-2xl border border-border bg-white/70 p-4 text-sm text-muted">
          {visibleLogs.map((log) => (
            <p key={log}>{log}</p>
          ))}
        </div>
      </details>
    </div>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-full bg-[#171512] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2722] disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? "Generando entrada..." : "Generar entrada"}
    </button>
  );
}

export function ManualTicketForm({ action, events }: ManualTicketFormProps) {
  const hasEvents = useMemo(() => events.length > 0, [events.length]);

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <select
        name="eventId"
        required
        className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
      >
        <option value="">Selecciona evento</option>
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.name}
          </option>
        ))}
      </select>
      <input
        name="fullName"
        required
        placeholder="Nombre y apellidos"
        className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
      />
      <input
        name="birthDate"
        type="date"
        required
        max={new Date().toISOString().slice(0, 10)}
        className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
      />
      <input
        name="dni"
        required
        placeholder="DNI"
        className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
      />
      <input
        name="phone"
        required
        placeholder="Telefono"
        className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
      />
      <input
        name="email"
        type="email"
        required
        placeholder="Correo electronico"
        className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent md:col-span-2"
      />
      <div className="md:col-span-2">
        <SubmitButton disabled={!hasEvents} />
      </div>

      <div className="md:col-span-2">
        <LoadingState />
      </div>

      {!hasEvents ? (
        <p className="md:col-span-2 text-sm leading-6 text-[rgb(155,36,36)]">
          Antes de generar entradas manuales necesitas crear al menos un evento
          en el panel.
        </p>
      ) : null}
    </form>
  );
}
