import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ScanModeCard } from "@/components/admin/scan-mode-card";
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
        title="Selecciona modo de validacion"
        description="Elige la pantalla que mas te convenga para el control de acceso. Puedes trabajar con camara o pasar a una vista de validacion manual mas comoda para incidencias."
      />

      {!validationEnabled ? (
        <div className="rounded-[1.75rem] border border-[rgba(40,52,86,0.16)] bg-[rgba(40,52,86,0.08)] p-5 text-sm leading-7 text-[rgb(40,52,86)]">
          El flujo visual ya esta listo, pero la validacion real se activara
          cuando conectemos las variables de entorno de Supabase.
        </div>
      ) : null}

      <div className="hidden lg:block">
        {validationEnabled ? (
          <TicketValidationPanel
            validationEnabled={validationEnabled}
            mode="combined"
          />
        ) : null}
      </div>

      <section className="grid gap-6 lg:hidden">
        <ScanModeCard
          href="/admin/scan/camera"
          title="Escaneo con camara"
          description="Pensado para movil. La camara queda arriba y el resultado del ticket aparece debajo en una vista limpia y rapida."
          cta="Abrir modo camara"
        />

        <ScanModeCard
          href="/admin/scan/manual"
          title="Validacion manual"
          description="Ideal cuando el QR falla o necesitas teclear un codigo. El formulario queda arriba y el resultado debajo para trabajar mas comodo."
          cta="Abrir modo manual"
        />
      </section>
    </main>
  );
}
