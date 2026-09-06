import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { CmsSyncError, parseCmsWebhookPayload } from "@/lib/cms/map-catalog";
import { revalidateCatalogPaths } from "@/lib/cms/revalidate";
import { handleCmsWebhook } from "@/lib/cms/sync-catalog";

export const runtime = "nodejs";

function authorized(req: NextRequest) {
  const secret = process.env.CMS_SYNC_SECRET?.trim();
  if (!secret) return false;
  const header = (
    req.headers.get("x-cms-sync-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    ""
  ).trim();
  const left = Buffer.from(header);
  const right = Buffer.from(secret);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  try {
    const result = await handleCmsWebhook(
      parseCmsWebhookPayload(body, req.headers.get("x-strapi-event")),
    );
    revalidateCatalogPaths();
    console.info("[cms-sync]", result);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof CmsSyncError ? error.message : "Sync failed";
    const status = error instanceof CmsSyncError ? 400 : 500;
    console.error("[cms-sync]", message, error);
    return NextResponse.json({ error: message }, { status });
  }
}
