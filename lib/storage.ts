import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/supabase-env";

function getServiceClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) return null;
  return createClient(url, key);
}

export function getBrowserSupabase() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function uploadImage(file: File) {
  return uploadCardImage(file);
}

export async function uploadCardImage(file: File) {
  const bucket = process.env.SUPABASE_CARD_BUCKET ?? "card-art";
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const client = getServiceClient();

  if (client) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await client.storage.from(bucket).upload(path, buffer, {
      contentType: file.type || "image/png",
      upsert: false,
    });
    if (error) throw new Error(error.message);
    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  const { mkdir, writeFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const filename = path;
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${filename}`;
}
