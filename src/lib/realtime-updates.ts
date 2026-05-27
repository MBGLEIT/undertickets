import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type RealtimeTopic = "events" | "tickets";

export async function publishRealtimeUpdate(
  topic: RealtimeTopic,
  resourceId?: string | null,
) {
  const supabase = createSupabaseAdminClient();
  const table = supabase.from("realtime_updates") as unknown as {
    insert: (values: {
      topic: RealtimeTopic;
      resource_id?: string | null;
    }) => Promise<{ error: { message: string } | null }>;
  };

  const { error } = await table.insert({
    topic,
    resource_id: resourceId ?? null,
  });

  if (error) {
    throw new Error(`No se pudo publicar la actualizacion realtime: ${error.message}`);
  }
}
