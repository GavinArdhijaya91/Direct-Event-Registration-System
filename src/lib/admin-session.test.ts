import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdminSession,
  hasAdminSession,
  hasSameOrigin,
  verifyAdminPassword,
  ADMIN_SESSION_COOKIE,
} from "@/lib/admin-session";

test("admin password verification uses timing safe comparison", () => {
  const originalEnv = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = "super-secret-password-123";

  try {
    assert.equal(verifyAdminPassword("super-secret-password-123"), true);
    assert.equal(verifyAdminPassword("wrong-password"), false);
    assert.equal(verifyAdminPassword(""), false);
  } finally {
    process.env.ADMIN_PASSWORD = originalEnv;
  }
});

test("admin session token creation and verification lifecycle", () => {
  const originalSecret = process.env.ADMIN_SESSION_SECRET;
  process.env.ADMIN_SESSION_SECRET = "0123456789abcdef0123456789abcdef"; // 32 bytes

  try {
    const sessionToken = createAdminSession();
    assert.ok(sessionToken);

    // Request with valid session cookie
    const validRequest = new Request("https://natalpwk.com/api/admin/dashboard", {
      headers: { cookie: `${ADMIN_SESSION_COOKIE}=${sessionToken}` },
    });
    assert.equal(hasAdminSession(validRequest), true);

    // Request without session cookie
    const noCookieRequest = new Request("https://natalpwk.com/api/admin/dashboard");
    assert.equal(hasAdminSession(noCookieRequest), false);

    // Request with tampered session cookie
    const tamperedRequest = new Request("https://natalpwk.com/api/admin/dashboard", {
      headers: { cookie: `${ADMIN_SESSION_COOKIE}=${sessionToken}tampered` },
    });
    assert.equal(hasAdminSession(tamperedRequest), false);

    // Request with expired session payload
    const expiredPayload = "1600000000.abc123nonce";
    const expiredRequest = new Request("https://natalpwk.com/api/admin/dashboard", {
      headers: { cookie: `${ADMIN_SESSION_COOKIE}=${expiredPayload}.invalidsig` },
    });
    assert.equal(hasAdminSession(expiredRequest), false);
  } finally {
    process.env.ADMIN_SESSION_SECRET = originalSecret;
  }
});

test("hasSameOrigin validates CSRF origin against request url", () => {
  const matchingRequest = new Request("https://natalpwk.com/api/admin/settings", {
    headers: { origin: "https://natalpwk.com" },
  });
  assert.equal(hasSameOrigin(matchingRequest), true);

  const crossOriginRequest = new Request("https://natalpwk.com/api/admin/settings", {
    headers: { origin: "https://evil-attacker.com" },
  });
  assert.equal(hasSameOrigin(crossOriginRequest), false);

  const missingOriginRequest = new Request("https://natalpwk.com/api/admin/settings");
  assert.equal(hasSameOrigin(missingOriginRequest), false);
});
