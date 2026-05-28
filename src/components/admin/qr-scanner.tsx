"use client";

import dynamic from "next/dynamic";

type ScannerModuleProps = {
  paused?: boolean;
  allowMultiple?: boolean;
  constraints?: MediaTrackConstraints;
  classNames?: {
    container?: string;
    video?: string;
  };
  onScan: (codes: Array<{ rawValue?: string }>) => void;
  onError?: (error: unknown) => void;
};

const Scanner = dynamic<ScannerModuleProps>(
  () => import("@yudiel/react-qr-scanner").then((module) => module.Scanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-72 items-center justify-center bg-[#171512] px-6 text-center text-sm text-white/70">
        Preparando la camara del dispositivo...
      </div>
    ),
  },
);

export function QrScanner(props: ScannerModuleProps) {
  return <Scanner {...props} />;
}
