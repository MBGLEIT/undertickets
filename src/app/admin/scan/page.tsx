import { TicketValidationPanel } from "@/components/admin/ticket-validation-panel";
import { hasSupabaseServerEnvConfig } from "@/lib/env";

export default function AdminScanPage() {
  const validationEnabled = hasSupabaseServerEnvConfig();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-16 md:px-10">
      <div className="space-y-3">
        <span className="inline-flex w-fit rounded-full border border-border bg-card px-4 py-1 text-sm font-medium text-muted">
          Control de acceso
        </span>
        <h1 className="text-4xl font-semibold tracking-tight">
          Escaneo y validacion de tickets
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted">
          Esta pantalla esta pensada para el personal de acceso. Permite leer QR
          con la camara del dispositivo o validar codigos manuales cuando el
          asistente no puede mostrar el QR correctamente.
        </p>
      </div>

      {!validationEnabled ? (
        <div className="rounded-[1.75rem] border border-[rgba(40,52,86,0.16)] bg-[rgba(40,52,86,0.08)] p-5 text-sm leading-7 text-[rgb(40,52,86)]">
          El flujo visual ya esta listo, pero la validacion real se activara
          cuando conectemos las variables de entorno de Supabase.
        </div>
      ) : null}

      <TicketValidationPanel validationEnabled={validationEnabled} />
    </main>
  );
}
