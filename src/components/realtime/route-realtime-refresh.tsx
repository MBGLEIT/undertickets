"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { RealtimeTopic } from "@/lib/realtime-updates";

type RouteRealtimeRefreshProps = {
  topics: RealtimeTopic[];
};

export function RouteRealtimeRefresh({
  topics,
}: RouteRealtimeRefreshProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const lastRefreshAtRef = useRef(0);
  const [status, setStatus] = useState("connecting");
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);
  const fallbackEnabled = status !== "SUBSCRIBED";

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`route-refresh-${topics.join("-")}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "realtime_updates",
        },
        (payload) => {
          const topic = String((payload.new as { topic?: string }).topic ?? "");

          if (!topics.includes(topic as RealtimeTopic)) {
            return;
          }

          setStatus("event");
          setLastEventAt(new Date().toLocaleTimeString("es-ES"));
          console.info("[realtime] evento recibido", {
            topics,
            topic,
            payload,
          });

          const now = Date.now();

          if (now - lastRefreshAtRef.current < 700) {
            return;
          }

          lastRefreshAtRef.current = now;
          startTransition(() => {
            router.refresh();
          });
        },
      )
      .subscribe((subscriptionStatus) => {
        setStatus(subscriptionStatus);
        console.info("[realtime] estado suscripcion", {
          topics,
          subscriptionStatus,
        });
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, topics]);

  useEffect(() => {
    if (!fallbackEnabled) {
      return;
    }

    const interval = window.setInterval(() => {
      const now = Date.now();

      if (now - lastRefreshAtRef.current < 4000) {
        return;
      }

      lastRefreshAtRef.current = now;
      console.info("[realtime] fallback refresh", { topics, status });
      startTransition(() => {
        router.refresh();
      });
    }, 6000);

    return () => {
      window.clearInterval(interval);
    };
  }, [fallbackEnabled, router, startTransition, status, topics]);

  return null;
}
