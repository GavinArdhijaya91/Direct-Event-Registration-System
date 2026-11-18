import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDynamicQrPayload,
  getDynamicQrToken,
  verifyLocationCode,
  QR_ROTATION_INTERVAL_SECONDS,
} from "@/lib/dynamic-qr";

test("generates deterministic dynamic tokens within the same 3-minute window", () => {
  const baseCode = "PWK2026-B6-FBS";
  const now = 1770000000000; // arbitrary fixed timestamp
  const { token: token1 } = getDynamicQrToken(baseCode, now);
  const { token: token2 } = getDynamicQrToken(baseCode, now + 30_000); // +30 seconds
  assert.equal(token1, token2);

  const payload = buildDynamicQrPayload(baseCode, now);
  assert.equal(payload, `${baseCode}.${token1}`);
});

test("changes token when the 3-minute window expires", () => {
  const baseCode = "PWK2026-B6-FBS";
  const now = 1770000000000;
  const { token: tokenCurrent } = getDynamicQrToken(baseCode, now);
  const nextWindow = now + (QR_ROTATION_INTERVAL_SECONDS + 5) * 1000; // 3 mins + 5s
  const { token: tokenNext } = getDynamicQrToken(baseCode, nextWindow);

  assert.notEqual(tokenCurrent, tokenNext);
});

test("validates dynamic full payload, short token, and static code", () => {
  const baseCode = "PWK2026-B6-FBS";
  const now = 1770000000000;
  const { token } = getDynamicQrToken(baseCode, now);

  // Full payload "PWK2026-B6-FBS.TOKEN"
  assert.equal(
    verifyLocationCode(`${baseCode}.${token}`, baseCode, now),
    true,
  );

  // Short 6-char token "TOKEN"
  assert.equal(
    verifyLocationCode(token, baseCode, now),
    true,
  );

  // Static code
  assert.equal(
    verifyLocationCode(baseCode, baseCode, now),
    true,
  );

  // Invalid code
  assert.equal(
    verifyLocationCode("WRONG-CODE", baseCode, now),
    false,
  );
});

test("allows grace period for previous 3-minute window to accommodate network lag", () => {
  const baseCode = "PWK2026-B6-FBS";
  const now = 1770000000000;
  const { token: oldToken } = getDynamicQrToken(baseCode, now);

  // Participant scanned near the end of the window, request arrives 10 seconds into next window
  const requestArrivedTime = now + (QR_ROTATION_INTERVAL_SECONDS + 10) * 1000;

  assert.equal(
    verifyLocationCode(`${baseCode}.${oldToken}`, baseCode, requestArrivedTime),
    true,
  );

  // But fails if scanned 10 minutes ago
  const tooLateTime = now + 600 * 1000;
  assert.equal(
    verifyLocationCode(`${baseCode}.${oldToken}`, baseCode, tooLateTime),
    false,
  );
});
