"use client";

import { Scanner } from "@yudiel/react-qr-scanner";
import { useMemo, useRef, useState, useTransition } from "react";
import { formatEventDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { TicketValidationResult } from "@/lib/ticket-validation";

type TicketValidationPanelProps = {
  validationEnabled: boolean;
};

const resultStyles: Record<
  TicketValidationResult["status"],
  {
    container: string;
    badge: string;
    label: string;
  }
> = {
  validated: {
    container: "border-[rgba(26,112,74,0.18)] bg-[rgba(26,112,74,0.08)]",
    badge: "bg-[rgba(26,112,74,0.14)] text-[rgb(26,112,74)]",
    label: "Acceso valido",
  },
  already_used: {
    container: "border-[rgba(179,93,0,0.16)] bg-[rgba(179,93,0,0.08)]",
    badge: "bg-[rgba(179,93,0,0.14)] text-[rgb(140,76,8)]",
    label: "Ya utilizado",
  },
  not_found: {
    container: "border-[rgba(155,36,36,0.16)] bg-[rgba(155,36,36,0.08)]",
    badge: "bg-[rgba(155,36,36,0.14)] text-[rgb(155,36,36)]",
    label: "No encontrado",
  },
  not_configured: {
    container: "border-[rgba(40,52,86,0.16)] bg-[rgba(40,52,86,0.08)]",
    badge: "bg-[rgba(40,52,86,0.14)] text-[rgb(40,52,86)]",
    label: "Configuracion pendiente",
  },
};

export function TicketValidationPanel({
  validationEnabled,
}: TicketValidationPanelProps) {
  const [manualValue, setManualValue] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const [result, setResult] = useState<TicketValidationResult | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const lastSubmittedRef = useRef<{ value: string; at: number } | null>(null);

  const scannerPaused = useMemo(
    () => !scannerActive || isPending || !validationEnabled,
    [isPending, scannerActive, validationEnabled],
  );

  function submitValue(value: string) {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      setResult({
        status: "not_found",
        message: "Introduce un codigo o escanea un QR para validar.",
        ticket: null,
      });
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/validate-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          value: normalizedValue,
        }),
      });

      const data = (await response.json()) as TicketValidationResult;
      setResult(data);
    });
  }

  function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitValue(manualValue);
  }

  function handleScan(rawValue: string) {
    const now = Date.now();
    const previous = lastSubmittedRef.current;

    if (
      previous &&
      previous.value === rawValue &&
      now - previous.at < 3000
    ) {
      return;
    }

    lastSubmittedRef.current = {
      value: rawValue,
      at: now,
    };

    submitValue(rawValue);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-[0_12px_30px_rgba(27,27,24,0.06)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Escanear con camara
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Ideal para validar accesos rapidamente desde movil o tablet.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setScannerActive((current) => !current)}
            disabled={!validationEnabled}
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {scannerActive ? "Detener camara" : "Activar camara"}
          </button>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-border bg-[#171512]">
          <Scanner
            paused={scannerPaused}
            allowMultiple={false}
            constraints={{ facingMode: "environment" }}
            onScan={(codes) => {
              const code = codes[0];

              if (!code?.rawValue) {
                return;
              }

              setScannerError(null);
              handleScan(code.rawValue);
            }}
            onError={(error) => {
              const message =
                error instanceof Error
                  ? error.message
                  : "No se pudo acceder a la camara.";

              setScannerError(message);
            }}
          />
        </div>

        <div className="mt-4 space-y-2 text-sm text-muted">
          <p>
            Si es la primera vez, el navegador te pedira permiso para usar la
            camara del dispositivo.
          </p>
          <p>
            El QR puede contener `ticket:uuid` o directamente el identificador
            del ticket.
          </p>
          {scannerError ? (
            <p className="text-[rgb(155,36,36)]">{scannerError}</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-6">
        <article className="rounded-[2rem] border border-border bg-card p-6 shadow-[0_12px_30px_rgba(27,27,24,0.06)]">
          <h2 className="text-2xl font-semibold tracking-tight">
            Validacion manual
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Util cuando el QR no se puede leer o cuando el asistente trae solo
            el codigo alfanumerico.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleManualSubmit}>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                QR o codigo
              </span>
              <input
                type="text"
                value={manualValue}
                onChange={(event) => setManualValue(event.target.value)}
                placeholder="ticket:uuid o ABCD1234"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              />
            </label>

            <button
              type="submit"
              disabled={isPending || !validationEnabled}
              className="w-full rounded-full bg-[#1f1d1a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {isPending ? "Validando..." : "Validar ticket"}
            </button>
          </form>
        </article>

        <article
          className={cn(
            "rounded-[2rem] border p-6 shadow-[0_12px_30px_rgba(27,27,24,0.06)]",
            result
              ? resultStyles[result.status].container
              : "border-border bg-card",
          )}
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">Resultado</h2>
            {result ? (
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  resultStyles[result.status].badge,
                )}
              >
                {resultStyles[result.status].label}
              </span>
            ) : null}
          </div>

          {result ? (
            <div className="space-y-4">
              <p className="text-sm leading-6">{result.message}</p>

              {result.ticket ? (
                <div className="space-y-2 rounded-2xl border border-black/6 bg-white/60 p-4 text-sm">
                  <p>
                    <strong>Asistente:</strong> {result.ticket.fullName}
                  </p>
                  <p>
                    <strong>DNI:</strong> {result.ticket.dni}
                  </p>
                  <p>
                    <strong>Telefono:</strong> {result.ticket.phone}
                  </p>
                  <p>
                    <strong>Email:</strong> {result.ticket.email}
                  </p>
                  <p>
                    <strong>Evento:</strong> {result.ticket.eventName}
                  </p>
                  <p>
                    <strong>Fecha:</strong>{" "}
                    {formatEventDate(result.ticket.eventDate)}
                  </p>
                  <p>
                    <strong>Ubicacion:</strong> {result.ticket.eventLocation}
                  </p>
                  <p>
                    <strong>Codigo:</strong> {result.ticket.alphanumericCode}
                  </p>
                  <p>
                    <strong>Estado:</strong>{" "}
                    {result.ticket.used ? "Usado" : "Pendiente"}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm leading-6 text-muted">
              Aqui veras la respuesta del sistema despues de cada escaneo o
              validacion manual.
            </p>
          )}
        </article>
      </section>
    </div>
  );
}
