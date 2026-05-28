import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TicketValidationPanel } from "@/components/admin/ticket-validation-panel";
import { RouteRealtimeRefresh } from "@/components/realtime/route-realtime-refresh";
import { hasSupabaseServerEnvConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function AdminScanManualPage() {
  const validationEnabled = hasSupabaseServerEnvConfig();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
      <RouteRealtimeRefresh topics={["tickets"]} />

      <AdminPageHeader
        badge="Modo manual"
        title="Validacion manual"
        description="Vista comoda para incidencias o para accesos sin QR. Introduce el codigo arriba y revisa el estado del ticket debajo."
        backHref="/admin/scan"
        backLabel="Volver a modos"
      />

      {!validationEnabled ? (
        <div className="rounded-[1.75rem] border border-[rgba(40,52,86,0.16)] bg-[rgba(40,52,86,0.08)] p-5 text-sm leading-7 text-[rgb(40,52,86)]">
          El flujo visual ya esta listo, pero la validacion real se activara
          cuando conectemos las variables de entorno de Supabase.
        </div>
      ) : null}

      <TicketValidationPanel validationEnabled={validationEnabled} mode="manual" />
    </main>
  );
}
