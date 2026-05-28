import Link from "next/link";

type ScanModeCardProps = {
  href: string;
  title: string;
  description: string;
  cta: string;
};

function ScanModeIcon() {
  return (
    <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-border bg-[#171512] text-white shadow-[0_12px_30px_rgba(27,27,24,0.16)]">
      <span className="absolute h-9 w-9 rounded-[0.85rem] border border-white/65" />
      <span className="absolute h-6 w-4 rounded-[0.5rem] border border-white bg-transparent" />
      <span className="absolute bottom-[1.15rem] h-1 w-1 rounded-full bg-white/90" />
    </span>
  );
}

export function ScanModeCard({
  href,
  title,
  description,
  cta,
}: ScanModeCardProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-72 flex-col justify-between rounded-[2rem] border border-border bg-card p-6 shadow-[0_12px_30px_rgba(27,27,24,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(27,27,24,0.1)]"
    >
      <div className="space-y-5">
        <ScanModeIcon />
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-[#171512]">
            {title}
          </h2>
          <p className="max-w-md text-sm leading-7 text-muted">{description}</p>
        </div>
      </div>

      <span className="inline-flex w-fit rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition group-hover:bg-accent-strong">
        {cta}
      </span>
    </Link>
  );
}
