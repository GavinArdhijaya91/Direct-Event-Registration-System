import assert from "node:assert/strict";
import test from "node:test";
import { rateLimitKey } from "@/lib/rate-limit";

test("pembatas laju mengabaikan header x-real-ip dari klien", () => {
  const originalSecret = process.env.ADMIN_SESSION_SECRET;
  process.env.ADMIN_SESSION_SECRET = "0123456789abcdef0123456789abcdef";

  const requestFromVercel = (realIp: string) =>
    new Request("https://natalpwk.com/api/checkin", {
      headers: {
        "x-vercel-forwarded-for": "1.2.3.4",
        "x-real-ip": realIp,
      },
    });

  try {
    assert.equal(
      rateLimitKey("checkin-ip", requestFromVercel("9.9.9.9")),
      rateLimitKey("checkin-ip", requestFromVercel("8.8.8.8")),
    );

    const otherClient = new Request("https://natalpwk.com/api/checkin", {
      headers: { "x-vercel-forwarded-for": "5.6.7.8" },
    });
    assert.notEqual(
      rateLimitKey("checkin-ip", requestFromVercel("9.9.9.9")),
      rateLimitKey("checkin-ip", otherClient),
    );
  } finally {
    process.env.ADMIN_SESSION_SECRET = originalSecret;
  }
});
