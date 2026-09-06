import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  isTwitchTimestampFresh,
  verifyTwitchMessage,
} from "@/lib/twitch-eventsub";

describe("Twitch EventSub signature", () => {
  const secret = "test-secret-value";
  const messageId = "msg-1";
  const timestamp = new Date().toISOString();
  const body = '{"event":{"id":"redemption-1"}}';

  function sign(payload: string) {
    return (
      "sha256=" +
      createHmac("sha256", secret)
        .update(messageId + timestamp + payload)
        .digest("hex")
    );
  }

  it("accepts a valid HMAC", () => {
    expect(
      verifyTwitchMessage({
        secret,
        messageId,
        timestamp,
        body,
        signature: sign(body),
      }),
    ).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(
      verifyTwitchMessage({
        secret,
        messageId,
        timestamp,
        body: '{"event":{"id":"other"}}',
        signature: sign(body),
      }),
    ).toBe(false);
  });

  it("rejects stale timestamps", () => {
    const old = new Date(Date.now() - 11 * 60 * 1000).toISOString();
    expect(isTwitchTimestampFresh(old)).toBe(false);
    expect(isTwitchTimestampFresh(timestamp)).toBe(true);
  });
});
