"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { QrScanner } from "@/components/admin/qr-scanner";
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
  const [scannerKey, setScannerKey] = useState(0);
  const [cameraMode, setCameraMode] = useState<"auto" | "environment" | "user">("auto");
  const [cameraDevices, setCameraDevices] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("auto");
  const [result, setResult] = useState<TicketValidationResult | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const lastSubmittedRef = useRef<{ value: string; at: number } | null>(null);

  const scannerPaused = useMemo(
    () => !scannerActive || isPending || !validationEnabled || !cameraReady,
    [cameraReady, isPending, scannerActive, validationEnabled],
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

  function mapScannerError(error: unknown) {
    const message =
      error instanceof Error ? error.message : "No se pudo acceder a la camara.";

    if (message.includes("NotReadableError")) {
      return "La camara existe, pero no se puede iniciar ahora mismo. Cierra otras apps que puedan estar usandola y prueba con otra camara.";
    }

    if (message.includes("NotAllowedError") || message.includes("Permission denied")) {
      return "El navegador no tiene permiso para usar la camara. Revisa los permisos del sitio.";
    }

    if (message.includes("NotFoundError")) {
      return "No se ha encontrado una camara disponible en este dispositivo.";
    }

    if (message.includes("OverconstrainedError")) {
      return "La camara seleccionada no esta disponible. Cambia el modo de camara y vuelve a intentarlo.";
    }

    return message;
  }

  function restartScanner() {
    setScannerError(null);
    setCameraReady(false);
    setScannerKey((current) => current + 1);
  }

  function buildPreferredCameraConstraints() {
    if (selectedDeviceId !== "auto") {
      return {
        video: {
          deviceId: {
            ideal: selectedDeviceId,
          },
        },
      } satisfies MediaStreamConstraints;
    }

    if (cameraMode === "auto") {
      return {
        video: true,
      } satisfies MediaStreamConstraints;
    }

    return {
      video: {
        facingMode: {
          ideal: cameraMode,
        },
      },
    } satisfies MediaStreamConstraints;
  }

  async function loadCameraDevices() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices
      .filter((device) => device.kind === "videoinput")
      .map((device, index) => ({
        id: device.deviceId,
        label: device.label || `Camara ${index + 1}`,
      }));

    setCameraDevices(videoDevices);

    if (selectedDeviceId !== "auto" && !videoDevices.some((device) => device.id === selectedDeviceId)) {
      setSelectedDeviceId("auto");
    }
  }

  useEffect(() => {
    void loadCameraDevices();
  }, []);

  useEffect(() => {
    if (!scannerActive || !validationEnabled || typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraReady(false);
      setCameraLoading(false);
      return;
    }

    let cancelled = false;

    async function prepareCamera() {
      setCameraLoading(true);
      setScannerError(null);

      try {
        let stream: MediaStream | null = null;

        try {
          stream = await navigator.mediaDevices.getUserMedia(
            buildPreferredCameraConstraints(),
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);

          if (!message.includes("OverconstrainedError")) {
            throw error;
          }

          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
        }

        stream.getTracks().forEach((track) => track.stop());
        await loadCameraDevices();

        if (!cancelled) {
          setCameraReady(true);
          setScannerKey((current) => current + 1);
        }
      } catch (error) {
        if (!cancelled) {
          setCameraReady(false);
          setScannerError(mapScannerError(error));
        }
      } finally {
        if (!cancelled) {
          setCameraLoading(false);
        }
      }
    }

    void prepareCamera();

    return () => {
      cancelled = true;
    };
  }, [cameraMode, scannerActive, selectedDeviceId, validationEnabled]);

  const scannerConstraints =
    selectedDeviceId !== "auto"
      ? {
          deviceId: {
            ideal: selectedDeviceId,
          },
        }
      : cameraMode === "auto"
        ? {}
        : {
            facingMode: {
              ideal: cameraMode,
            },
          };

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
            onClick={() => {
              setScannerError(null);
              setScannerActive((current) => !current);
            }}
            disabled={!validationEnabled}
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {scannerActive ? "Detener camara" : "Activar camara"}
          </button>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            <span>Camara</span>
            <select
              value={cameraMode}
              onChange={(event) => {
                setCameraMode(
                  event.target.value as "auto" | "environment" | "user",
                );
                setSelectedDeviceId("auto");
                restartScanner();
              }}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="auto">Automatica</option>
              <option value="environment">Trasera</option>
              <option value="user">Delantera</option>
            </select>
          </label>

          {cameraDevices.length > 0 ? (
            <label className="flex items-center gap-2 text-sm text-muted">
              <span>Dispositivo</span>
              <select
                value={selectedDeviceId}
                onChange={(event) => {
                  setSelectedDeviceId(event.target.value);
                  restartScanner();
                }}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
              >
                <option value="auto">Seleccion automatica</option>
                {cameraDevices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <button
            type="button"
            onClick={restartScanner}
            disabled={!scannerActive}
            className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-[#171512] transition hover:bg-card disabled:cursor-not-allowed disabled:opacity-55"
          >
            Reiniciar camara
          </button>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-border bg-[#171512]">
          {scannerActive && validationEnabled && cameraLoading ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-6 text-center text-sm leading-7 text-white/72">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
              <p>Intentando iniciar la camara seleccionada...</p>
            </div>
          ) : scannerActive && validationEnabled && cameraReady ? (
            <QrScanner
              key={scannerKey}
              paused={scannerPaused}
              allowMultiple={false}
              constraints={scannerConstraints}
              onScan={(codes) => {
                const code = codes[0];

                if (!code?.rawValue) {
                  return;
                }

                setScannerError(null);
                handleScan(code.rawValue);
              }}
              onError={(error) => {
                setScannerError(mapScannerError(error));
              }}
            />
          ) : (
            <div className="flex min-h-72 items-center justify-center px-6 text-center text-sm leading-7 text-white/72">
              {validationEnabled
                ? scannerError
                  ? "La camara no ha podido iniciarse. Puedes cambiar el dispositivo o usar la validacion manual."
                  : "La camara se activara aqui cuando pulses el boton de escaneo."
                : "La validacion aun no esta activada en este entorno."}
            </div>
          )}
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
