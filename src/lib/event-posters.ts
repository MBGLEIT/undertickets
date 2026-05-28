import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const EVENT_POSTERS_BUCKET = "event-posters";

function normalizePosterName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getPosterExtension(fileName: string, fileType: string) {
  const fileNameExtension = fileName.split(".").pop()?.toLowerCase();

  if (fileNameExtension && fileNameExtension.length <= 5) {
    return fileNameExtension;
  }

  if (fileType === "image/png") {
    return "png";
  }

  if (fileType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

export async function uploadEventPoster(params: {
  eventSlug: string;
  file: File;
}) {
  const { eventSlug, file } = params;

  if (!file.size) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("El cartel del evento debe ser una imagen valida.");
  }

  const extension = getPosterExtension(file.name, file.type);
  const storagePath = `events/${normalizePosterName(eventSlug) || "evento"}-${crypto.randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const supabase = createSupabaseAdminClient();
  const storage = supabase.storage.from(EVENT_POSTERS_BUCKET);

  const { error: uploadError } = await storage.upload(storagePath, bytes, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`No se pudo subir el cartel del evento: ${uploadError.message}`);
  }

  const { data } = storage.getPublicUrl(storagePath);

  return {
    path: storagePath,
    publicUrl: data.publicUrl,
  };
}

export function getPosterPathFromUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) {
    return null;
  }

  const marker = `/storage/v1/object/public/${EVENT_POSTERS_BUCKET}/`;
  const markerIndex = imageUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return imageUrl.slice(markerIndex + marker.length);
}

export async function deleteEventPosterByUrl(imageUrl: string | null | undefined) {
  const storagePath = getPosterPathFromUrl(imageUrl);

  if (!storagePath) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(EVENT_POSTERS_BUCKET).remove([storagePath]);

  if (error) {
    console.error("No se pudo eliminar el cartel anterior del evento.", {
      imageUrl,
      error,
    });
  }
}
