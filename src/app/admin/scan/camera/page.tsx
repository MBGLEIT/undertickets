import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TicketValidationPanel } from "@/components/admin/ticket-validation-panel";
import { RouteRealtimeRefresh } from "@/components/realtime/route-realtime-refresh";
import { hasSupabaseServerEnvConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function AdminScanCameraPage() {
  const validationEnabled = hasSupabaseServerEnvConfig();

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-4 md:gap-8 md:px-8 md:py-14">
      <RouteRealtimeRefresh topics={["tickets"]} />

      <AdminPageHeader
        badge="Modo camara"
        title="Escaneo de QR"
        description="Vista pensada para usar desde movil. La camara queda arriba y el resultado del ticket aparece justo debajo."
        backHref="/admin/scan"
        backLabel="Volver a modos"
      />

      {!validationEnabled ? (
        <div className="rounded-[1.75rem] border border-[rgba(40,52,86,0.16)] bg-[rgba(40,52,86,0.08)] p-5 text-sm leading-7 text-[rgb(40,52,86)]">
          El flujo visual ya esta listo, pero la validacion real se activara
          cuando conectemos las variables de entorno de Supabase.
        </div>
      ) : null}

      <TicketValidationPanel validationEnabled={validationEnabled} mode="camera" />
    </main>
  );
}
