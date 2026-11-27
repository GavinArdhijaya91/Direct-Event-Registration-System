import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDynamicQrPayload,
  canonicalizeLocationCode,
  getDynamicQrToken,
  QR_ROTATION_INTERVAL_SECONDS,
  QR_TOKEN_LENGTH,
  verifyLocationCodeForMode,
} from "@/lib/dynamic-qr";

const secret = "test-signing-secret-with-at-least-32-bytes";
const baseCode = "PWK2026-B6-FBS";
const now = 1770000000000;

test("generates deterministic dynamic tokens within the same 3-minute window", () => {
  const { token: token1 } = getDynamicQrToken(secret, baseCode, now);
  const { token: token2 } = getDynamicQrToken(secret, baseCode, now + 30_000);
  assert.equal(token1, token2);
  assert.equal(token1.length, QR_TOKEN_LENGTH);
  assert.match(token1, /^[0-9A-HJKMNP-TV-Z]+$/);

  const payload = buildDynamicQrPayload(secret, baseCode, now);
  assert.equal(payload, `${baseCode}.${token1}`);
});

test("uses all 32 values in every token position", () => {
  const seen = Array.from({ length: QR_TOKEN_LENGTH }, () => new Set<string>());

  for (let index = 0; index < 512; index += 1) {
    const token = getDynamicQrToken(`entropy-secret-${index}`, baseCode, now).token;
    for (let position = 0; position < QR_TOKEN_LENGTH; position += 1) {
      seen[position].add(token[position]);
    }
  }

  for (const values of seen) {
    assert.equal(values.size, 32, "setiap posisi token harus memakai 32 nilai Crockford base32");
  }
});

test("changes token when the 3-minute window expires", () => {
  const { token: tokenCurrent } = getDynamicQrToken(secret, baseCode, now);
  const nextWindow = now + (QR_ROTATION_INTERVAL_SECONDS + 5) * 1000;
  const { token: tokenNext } = getDynamicQrToken(secret, baseCode, nextWindow);

  assert.notEqual(tokenCurrent, tokenNext);
});

test("binds tokens to the location code and signing secret", () => {
  const { token } = getDynamicQrToken(secret, baseCode, now);
  const otherLocation = getDynamicQrToken(secret, "PWK2026-GD-A", now);
  const otherSecret = getDynamicQrToken(`${secret}-other`, baseCode, now);

  assert.notEqual(token, otherLocation.token);
  assert.notEqual(token, otherSecret.token);
});

test("accepts full payload and short token only in dynamic mode", () => {
  const { token } = getDynamicQrToken(secret, baseCode, now);

  assert.equal(
    verifyLocationCodeForMode(
      `${baseCode}.${token}`,
      baseCode,
      "DYNAMIC",
      secret,
      now,
    ),
    true,
  );
  assert.equal(
    verifyLocationCodeForMode(token, baseCode, "DYNAMIC", secret, now),
    true,
  );
  assert.equal(
    verifyLocationCodeForMode(baseCode, baseCode, "DYNAMIC", secret, now),
    false,
  );
  assert.equal(
    verifyLocationCodeForMode("WRONG-CODE", baseCode, "DYNAMIC", secret, now),
    false,
  );
});

test("rejects dynamic tokens in static mode", () => {
  const { token } = getDynamicQrToken(secret, baseCode, now);

  assert.equal(
    verifyLocationCodeForMode(baseCode, baseCode, "STATIC", null, now),
    true,
  );
  assert.equal(
    verifyLocationCodeForMode(`${baseCode}.${token}`, baseCode, "STATIC", secret, now),
    false,
  );
});

test("allows one window before and after, but rejects stale tokens", () => {
  const { token: oldToken } = getDynamicQrToken(secret, baseCode, now);
  const requestArrivedTime = now + (QR_ROTATION_INTERVAL_SECONDS + 10) * 1000;

  assert.equal(
    verifyLocationCodeForMode(
      `${baseCode}.${oldToken}`,
      baseCode,
      "DYNAMIC",
      secret,
      requestArrivedTime,
    ),
    true,
  );

  assert.equal(
    verifyLocationCodeForMode(
      `${baseCode}.${oldToken}`,
      baseCode,
      "DYNAMIC",
      secret,
      now + 600 * 1000,
    ),
    false,
  );

  const nextWindowToken = getDynamicQrToken(
    secret,
    baseCode,
    now + (QR_ROTATION_INTERVAL_SECONDS + 10) * 1000,
  ).token;
  assert.equal(
    verifyLocationCodeForMode(
      `${baseCode}.${nextWindowToken}`,
      baseCode,
      "DYNAMIC",
      secret,
      now,
    ),
    true,
  );

  const tooFarToken = getDynamicQrToken(
    secret,
    baseCode,
    now + 2 * QR_ROTATION_INTERVAL_SECONDS * 1000 + 10_000,
  ).token;
  assert.equal(
    verifyLocationCodeForMode(
      `${baseCode}.${tooFarToken}`,
      baseCode,
      "DYNAMIC",
      secret,
      now,
    ),
    false,
  );
});

test("canonicalizes location codes consistently", () => {
  assert.equal(canonicalizeLocationCode("  pwk2026 b6  "), "PWK2026-B6");
  const normalized = getDynamicQrToken(secret, "  pwk2026 b6  ", now);
  const canonical = getDynamicQrToken(secret, "PWK2026-B6", now);
  assert.equal(normalized.token, canonical.token);
});

test("fails closed without a signing secret in dynamic mode", () => {
  const { token } = getDynamicQrToken(secret, baseCode, now);
  assert.equal(
    verifyLocationCodeForMode(`${baseCode}.${token}`, baseCode, "DYNAMIC", null, now),
    false,
  );
  assert.throws(() => getDynamicQrToken("", baseCode, now));
});
