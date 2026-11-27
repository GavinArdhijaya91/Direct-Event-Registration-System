import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { PrismaClient } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { hashCredential } from "@/lib/ticket-credentials";

export const ADMIN_SESSION_COOKIE = "pwk_admin_session";
const sessionLifetimeSeconds = 8 * 60 * 60;
const logoutAuditAction = "admin-logout";

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("ADMIN_SESSION_SECRET harus diatur dengan minimal 32 byte acak.");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function verifyAdminPassword(candidate: string) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD harus diatur.");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD harus memiliki minimal 12 karakter.");
  }
  return safeCompare(candidate, password);
}

export function createAdminSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionLifetimeSeconds;
  const payload = `${expiresAt}.${randomBytes(24).toString("base64url")}`;
  return `${payload}.${sign(payload)}`;
}

function readSessionCookie(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${ADMIN_SESSION_COOKIE}=`))
    ?.slice(ADMIN_SESSION_COOKIE.length + 1);
}

/** Pemeriksaan tanpa database: format, masa berlaku, dan tanda tangan token. */
export function parseAdminSession(token: string) {
  const [expiresAtText, nonce, signature, ...rest] = token.split(".");
  if (!expiresAtText || !nonce || !signature || rest.length > 0) {
    return null;
  }

  const expiresAt = Number(expiresAtText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now() / 1000) {
    return null;
  }

  try {
    if (!safeCompare(signature, sign(`${expiresAtText}.${nonce}`))) {
      return null;
    }
  } catch {
    return null;
  }

  return { expiresAt, nonce };
}

export async function hasAdminSession(
  request: Request,
  prisma: PrismaClient = getPrismaClient(),
) {
  const token = readSessionCookie(request);
  if (!token) {
    return false;
  }

  const session = parseAdminSession(token);
  if (!session) {
    return false;
  }

  // Logout menulis hash nonce ke audit log; token yang sudah dicabut tidak diterima lagi.
  const revoked = await prisma.adminAuditLog.findFirst({
    where: {
      action: logoutAuditAction,
      details: { path: ["nonceHash"], equals: hashCredential(session.nonce) },
    },
    select: { id: true },
  });

  return !revoked;
}

export async function revokeAdminSession(
  request: Request,
  prisma: PrismaClient = getPrismaClient(),
) {
  const token = readSessionCookie(request);
  if (!token) {
    return;
  }

  const session = parseAdminSession(token);
  if (!session) {
    return;
  }

  await prisma.adminAuditLog.create({
    data: {
      action: logoutAuditAction,
      details: { nonceHash: hashCredential(session.nonce) },
    },
  });
}

export function setAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSession(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: sessionLifetimeSeconds,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
