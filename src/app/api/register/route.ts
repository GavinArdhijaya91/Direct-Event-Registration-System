import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import {
  consumeRateLimit,
  hashRateLimitIdentity,
  rateLimitKey,
} from "@/lib/rate-limit";
import { registerAttendee } from "@/lib/register-attendee";
import { registrationSchema } from "@/lib/registration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimitedResponse = {
  status: "rate-limited",
  message: "Terlalu banyak percobaan pendaftaran. Coba lagi nanti.",
};

export async function GET() {
  const settings = await getPrismaClient().eventSettings.findUnique({
    where: { id: 1 },
    select: {
      maxCapacity: true,
      registeredCount: true,
      registrationOpen: true,
    },
  });

  if (!settings) {
    return NextResponse.json(
      { status: "unavailable", message: "Konfigurasi acara belum tersedia." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    status: "available",
    registrationOpen: settings.registrationOpen,
    registeredCount: settings.registeredCount,
    maxCapacity: settings.maxCapacity,
    full: settings.registeredCount >= settings.maxCapacity,
  });
}

export async function POST(request: Request) {
  if (
    await consumeRateLimit(rateLimitKey("register-ip", request), {
      limit: 300,
      windowMilliseconds: 15 * 60 * 1000,
      blockMilliseconds: 15 * 60 * 1000,
    })
  ) {
    return NextResponse.json(rateLimitedResponse, {
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

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "invalid",
        message: "Periksa kembali data pendaftaran.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const numberKey = hashRateLimitIdentity(
    `register-wa:${parsed.data.whatsappNumber}`,
  );
  if (
    await consumeRateLimit(numberKey, {
      limit: 5,
      windowMilliseconds: 60 * 60 * 1000,
      blockMilliseconds: 60 * 60 * 1000,
    })
  ) {
    return NextResponse.json(rateLimitedResponse, {
      status: 429,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const result = await registerAttendee(parsed.data);

  if (result.status === "duplicate") {
    return NextResponse.json(
      {
        status: "duplicate",
        message:
          "Nomor WhatsApp ini sudah terdaftar. Gunakan nomor tersebut bersama kode pemulihan untuk membuka tiket.",
      },
      { status: 409 },
    );
  }

  if (result.status === "closed") {
    return NextResponse.json(
      { status: "closed", message: "Pendaftaran sedang ditutup." },
      { status: 409 },
    );
  }

  if (result.status === "full") {
    return NextResponse.json(
      { status: "full", message: "Kuota pendaftaran telah terpenuhi." },
      { status: 409 },
    );
  }

  if (result.status === "unavailable") {
    return NextResponse.json(
      { status: "unavailable", message: "Konfigurasi acara belum tersedia." },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      status: "registered",
      ticketCode: result.ticketCode,
      ticketPath: `/ticket/${result.ticketToken}`,
      recoveryCode: result.recoveryCode,
    },
    {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
