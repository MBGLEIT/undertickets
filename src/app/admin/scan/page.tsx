import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TicketValidationPanel } from "@/components/admin/ticket-validation-panel";
import { RouteRealtimeRefresh } from "@/components/realtime/route-realtime-refresh";
import { hasSupabaseServerEnvConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function AdminScanPage() {
  const validationEnabled = hasSupabaseServerEnvConfig();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-16 md:px-10">
      <RouteRealtimeRefresh topics={["tickets"]} />

      <AdminPageHeader
        badge="Control de acceso"
        title="Escaneo y validacion de tickets"
        description="Esta pantalla esta pensada para el personal de acceso. Permite leer QR con la camara del dispositivo o validar codigos manuales cuando el asistente no puede mostrar el QR correctamente."
      />

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
