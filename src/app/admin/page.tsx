import Link from "next/link";

const adminSections = [
  {
    href: "/admin/events",
    title: "Gestión de eventos",
    description: "Crear, editar y eliminar eventos desde una interfaz privada.",
  },
  {
    href: "/admin/dashboard",
    title: "Ventas y asistentes",
    description: "Ver métricas, tickets vendidos y estado general de cada evento.",
  },
  {
    href: "/admin/scan",
    title: "Escaneo de accesos",
    description: "Validar entradas mediante QR o código manual en tiempo real.",
  },
];

export default function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-16 md:px-10">
      <div className="space-y-3">
        <span className="inline-flex rounded-full border border-border bg-card px-4 py-1 text-sm font-medium text-muted">
          Área privada
        </span>
        <h1 className="text-4xl font-semibold tracking-tight">Panel admin</h1>
        <p className="max-w-2xl text-base leading-7 text-muted">
          Desde aqui centralizamos operacion interna: gestion de eventos,
          metricas de ventas y control de acceso con validacion en tiempo real.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {adminSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(27,27,24,0.08)]"
          >
            <h2 className="mb-3 text-xl font-semibold">{section.title}</h2>
            <p className="text-sm leading-7 text-muted">{section.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
