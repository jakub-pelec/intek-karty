import { NextRequest, NextResponse } from "next/server";
import {
  ingestChannelPointsRedemption,
  isTwitchTimestampFresh,
  verifyTwitchMessage,
  type ChannelPointsRedemption,
} from "@/lib/twitch-eventsub";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.TWITCH_EVENTSUB_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "EventSub is not configured" }, { status: 500 });
  }

  const body = await req.text();
  const messageId = req.headers.get("twitch-eventsub-message-id") ?? "";
  const timestamp = req.headers.get("twitch-eventsub-message-timestamp") ?? "";
  const signature = req.headers.get("twitch-eventsub-message-signature") ?? "";
  const messageType = req.headers.get("twitch-eventsub-message-type") ?? "";

  if (
    !verifyTwitchMessage({ secret, messageId, timestamp, body, signature }) ||
    !isTwitchTimestampFresh(timestamp)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  if (messageType === "webhook_callback_verification") {
    const payload = JSON.parse(body) as { challenge?: string };
    return new NextResponse(payload.challenge ?? "", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
  }

  if (messageType === "revocation") {
    return NextResponse.json({ ok: true });
  }

  const payload = JSON.parse(body) as {
    subscription?: { type?: string };
    event?: ChannelPointsRedemption;
  };

  if (
    payload.subscription?.type ===
      "channel.channel_points_custom_reward_redemption.add" &&
    payload.event
  ) {
    await ingestChannelPointsRedemption(payload.event);
  }

  return NextResponse.json({ ok: true });
}
