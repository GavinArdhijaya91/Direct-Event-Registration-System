import { NextResponse } from "next/server";
import { z } from "zod";
import { hasAdminSession, hasSameOrigin } from "@/lib/admin-session";
import { registerWalkinAttendee } from "@/lib/register-walkin";
import {
  normalizeWhatsappNumber,
  normalizeInstitution,
} from "@/lib/registration";

export const runtime = "nodejs";

const walkinSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Nama lengkap wajib diisi.")
    .max(120, "Nama lengkap maksimal 120 karakter."),
  whatsappNumber: z
    .string()
    .trim()
    .min(1, "Nomor WhatsApp wajib diisi.")
    .transform(normalizeWhatsappNumber)
    .pipe(
      z.string({
        error:
          "Masukkan nomor WhatsApp Indonesia yang valid, misalnya 081234567890.",
      }),
    ),
  category: z.enum(["MAHASISWA", "ALUMNI", "TAMU_UNDANGAN"], {
    error: "Pilih kategori peserta.",
  }),
  institution: z
    .string()
    .transform(normalizeInstitution)
    .pipe(
      z
        .string()
        .min(1, "Asal atau instansi wajib diisi.")
        .max(120, "Asal atau instansi maksimal 120 karakter."),
    ),
  reason: z
    .string()
    .trim()
    .min(1, "Alasan pendaftaran OTS wajib diisi.")
    .max(500, "Alasan maksimal 500 karakter."),
});

export async function POST(request: Request) {
  if (!hasAdminSession(request)) {
    return NextResponse.json(
      { status: "unauthorized", message: "Silakan masuk sebagai admin." },
      { status: 401 },
    );
  }
  if (!hasSameOrigin(request)) {
    return NextResponse.json(
      { status: "forbidden", message: "Permintaan tidak diizinkan." },
      { status: 403 },
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

  const parsed = walkinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "invalid",
        message: "Periksa kembali data yang dimasukkan.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const result = await registerWalkinAttendee(parsed.data);
    if (result.status === "already-present") {
      return NextResponse.json(
        { status: "already-present", message: result.message },
        { status: 409 },
      );
    }
    if (result.status === "unavailable") {
      return NextResponse.json(
        { status: "unavailable", message: result.message },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        status: result.status,
        message:
          result.status === "registered"
            ? `Peserta OTS berhasil didaftarkan dan diabsenkan HADIR dengan kode ${result.attendee.ticketCode}.`
            : result.message,
        attendee: "attendee" in result ? result.attendee : undefined,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Gagal memproses pendaftaran OTS.",
      },
      { status: 500 },
    );
  }
}
