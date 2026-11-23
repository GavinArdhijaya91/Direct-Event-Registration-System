import { NextResponse } from "next/server";
import { z } from "zod";
import {
  hasSameOrigin,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "@/lib/admin-session";
import { getPrismaClient } from "@/lib/prisma";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z.object({
  password: z.string().min(1).max(256),
});

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json(
      { status: "forbidden", message: "Permintaan tidak diizinkan." },
      { status: 403 },
    );
  }

  const limited = await consumeRateLimit(rateLimitKey("admin-login", request), {
    limit: 5,
    windowMilliseconds: 15 * 60 * 1000,
    blockMilliseconds: 15 * 60 * 1000,
  });
  if (limited) {
    return NextResponse.json(
      { status: "rate-limited", message: "Terlalu banyak percobaan. Coba lagi nanti." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "invalid", message: "Format permintaan tidak valid." },
      { status: 400 },
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "invalid", message: "Masukkan kata sandi admin." },
      { status: 400 },
    );
  }

  let passwordMatches = false;
  try {
    passwordMatches = verifyAdminPassword(parsed.data.password);
  } catch {
    return NextResponse.json(
      {
        status: "unavailable",
        message: "Konfigurasi admin belum aman. Hubungi penanggung jawab.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!passwordMatches) {
    return NextResponse.json(
      { status: "unauthorized", message: "Kata sandi tidak cocok." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  await getPrismaClient().adminAuditLog.create({
    data: { action: "admin-login" },
  });

  const response = NextResponse.json(
    { status: "authenticated" },
    { headers: { "Cache-Control": "no-store" } },
  );
  setAdminSessionCookie(response);
  return response;
}
