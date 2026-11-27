import assert from "node:assert/strict";
import test from "node:test";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  hasAdminSession,
  hasSameOrigin,
  parseAdminSession,
  revokeAdminSession,
  verifyAdminPassword,
} from "@/lib/admin-session";

function createFakePrisma() {
  const revokedHashes = new Set<string>();
  const prisma = {
    adminAuditLog: {
      findFirst: async ({ where }: { where: { details: { equals: string } } }) =>
        revokedHashes.has(where.details.equals) ? { id: "log-1" } : null,
      create: async ({ data }: { data: { details: { nonceHash: string } } }) => {
        revokedHashes.add(data.details.nonceHash);
        return { id: "log-1" };
      },
    },
  } as unknown as PrismaClient;

  return prisma;
}

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

test("admin session token creation and verification lifecycle", async () => {
  const originalSecret = process.env.ADMIN_SESSION_SECRET;
  process.env.ADMIN_SESSION_SECRET = "0123456789abcdef0123456789abcdef"; // 32 bytes
  const prisma = createFakePrisma();

  try {
    const sessionToken = createAdminSession();
    assert.ok(parseAdminSession(sessionToken));

    const validRequest = new Request("https://natalpwk.com/api/admin/dashboard", {
      headers: { cookie: `${ADMIN_SESSION_COOKIE}=${sessionToken}` },
    });
    assert.equal(await hasAdminSession(validRequest, prisma), true);

    const noCookieRequest = new Request("https://natalpwk.com/api/admin/dashboard");
    assert.equal(await hasAdminSession(noCookieRequest, prisma), false);

    const tamperedRequest = new Request("https://natalpwk.com/api/admin/dashboard", {
      headers: { cookie: `${ADMIN_SESSION_COOKIE}=${sessionToken}tampered` },
    });
    assert.equal(await hasAdminSession(tamperedRequest, prisma), false);

    const expiredPayload = "1600000000.abc123nonce";
    const expiredRequest = new Request("https://natalpwk.com/api/admin/dashboard", {
      headers: { cookie: `${ADMIN_SESSION_COOKIE}=${expiredPayload}.invalidsig` },
    });
    assert.equal(await hasAdminSession(expiredRequest, prisma), false);
  } finally {
    process.env.ADMIN_SESSION_SECRET = originalSecret;
  }
});

test("logout mencabut token lama tetapi tidak token baru", async () => {
  const originalSecret = process.env.ADMIN_SESSION_SECRET;
  process.env.ADMIN_SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  const prisma = createFakePrisma();

  const sessionRequest = (token: string) =>
    new Request("https://natalpwk.com/api/admin/dashboard", {
      headers: { cookie: `${ADMIN_SESSION_COOKIE}=${token}` },
    });

  try {
    const firstToken = createAdminSession();
    const request = sessionRequest(firstToken);
    assert.equal(await hasAdminSession(request, prisma), true);

    await revokeAdminSession(request, prisma);
    assert.equal(await hasAdminSession(request, prisma), false);

    const secondToken = createAdminSession();
    assert.equal(await hasAdminSession(sessionRequest(secondToken), prisma), true);
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
