import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeWhatsappNumber } from "@/lib/registration";
import {
  consumeRateLimit,
  hashRateLimitIdentity,
  rateLimitKey,
} from "@/lib/rate-limit";
import { recoverTicket } from "@/lib/ticket-recovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const recoverySchema = z.object({
  whatsappNumber: z
    .string()
    .trim()
    .transform(normalizeWhatsappNumber)
    .pipe(
      z.string({
        error: "Masukkan nomor WhatsApp Indonesia yang valid.",
      }),
    ),
  recoveryCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-F0-9]{32}$/, "Kode pemulihan tidak valid."),
});

const genericFailure = {
  status: "unavailable",
  message:
    "Data tidak cocok atau pemulihan belum dapat diproses. Periksa nomor dan kode, lalu coba lagi.",
};

export async function POST(request: Request) {
  const ipKey = rateLimitKey("ticket-recovery-ip", request);
  if (
    await consumeRateLimit(ipKey, {
      limit: 8,
      windowMilliseconds: 15 * 60 * 1000,
      blockMilliseconds: 15 * 60 * 1000,
    })
  ) {
    return NextResponse.json(genericFailure, {
      status: 429,
      headers: { "Cache-Control": "no-store" },
    });
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

  const parsed = recoverySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "invalid", message: "Masukkan nomor dan kode pemulihan yang valid." },
      { status: 400 },
    );
  }

  const credentialKey = hashRateLimitIdentity(
    `ticket-recovery:${parsed.data.whatsappNumber}`,
  );
  if (
    await consumeRateLimit(credentialKey, {
      limit: 5,
      windowMilliseconds: 15 * 60 * 1000,
      blockMilliseconds: 30 * 60 * 1000,
    })
  ) {
    return NextResponse.json(genericFailure, {
      status: 429,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const result = await recoverTicket(
    parsed.data.whatsappNumber,
    parsed.data.recoveryCode,
  );

  if (!result.recovered) {
    return NextResponse.json(genericFailure, {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return NextResponse.json(
    {
      status: "recovered",
      ticketPath: `/ticket/${result.ticketToken}`,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
