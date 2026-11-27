import { NextResponse } from "next/server";
import { z } from "zod";
import { hasAdminSession, hasSameOrigin } from "@/lib/admin-session";
import { registerWalkinAttendee } from "@/lib/register-walkin";
import {
  normalizeWhatsappNumber,
  normalizeInstitution,
  UNNES_FACULTIES,
} from "@/lib/registration";

export const runtime = "nodejs";

const walkinSchema = z
  .object({
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
    birthPlace: z
      .string()
      .trim()
      .min(1, "Tempat lahir wajib diisi.")
      .max(100, "Tempat lahir maksimal 100 karakter."),
    birthDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal lahir harus berformat YYYY-MM-DD."),
    churchOrigin: z
      .string()
      .trim()
      .min(1, "Asal stasi / identitas gereja wajib diisi.")
      .max(150, "Asal gereja maksimal 150 karakter."),
    domicile: z
      .string()
      .trim()
      .min(1, "Alamat domisili atau tempat tinggal wajib diisi.")
      .max(255, "Domisili maksimal 255 karakter."),
    participantType: z.enum(["MAHASISWA_ALUMNI", "UMUM"], {
      error: "Pilih tipe peserta.",
    }),
    academicStatus: z.enum(["MAHASISWA", "ALUMNI"]).optional(),
    graduationYear: z.string().trim().optional(),
    campusType: z.enum(["UNNES", "LUAR_UNNES"]).optional(),
    campusName: z.string().trim().optional(),
    faculty: z.string().trim().optional(),
    studyProgram: z.string().trim().optional(),
    institution: z.string().trim().optional(),
    reason: z
      .string()
      .trim()
      .min(1, "Alasan pendaftaran OTS wajib diisi.")
      .max(500, "Alasan maksimal 500 karakter."),
  })
  .superRefine((data, ctx) => {
    if (data.participantType === "MAHASISWA_ALUMNI") {
      if (!data.academicStatus) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pilih status (masih Mahasiswa atau sudah Alumni).",
          path: ["academicStatus"],
        });
      }
      if (data.academicStatus === "ALUMNI") {
        if (!data.graduationYear || !/^\d{4}$/.test(data.graduationYear)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Tahun kelulusan wajib 4 digit angka.",
            path: ["graduationYear"],
          });
        }
      }
      if (!data.campusType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pilih asal kampus.",
          path: ["campusType"],
        });
      }
      if (data.campusType === "UNNES") {
        if (
          !data.faculty ||
          !UNNES_FACULTIES.includes(data.faculty as (typeof UNNES_FACULTIES)[number])
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Pilih salah satu fakultas UNNES.",
            path: ["faculty"],
          });
        }
        if (!data.studyProgram || data.studyProgram.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Program studi (prodi) wajib diisi.",
            path: ["studyProgram"],
          });
        }
      } else if (data.campusType === "LUAR_UNNES") {
        if (!data.campusName || data.campusName.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Nama universitas wajib diisi.",
            path: ["campusName"],
          });
        }
        if (!data.faculty || data.faculty.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Fakultas wajib diisi.",
            path: ["faculty"],
          });
        }
        if (!data.studyProgram || data.studyProgram.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Program studi (prodi) wajib diisi.",
            path: ["studyProgram"],
          });
        }
      }
    }
  })
  .transform((data) => {
    let category: "MAHASISWA" | "ALUMNI" | "TAMU_UNDANGAN" = "TAMU_UNDANGAN";
    let institution = "";

    if (data.participantType === "MAHASISWA_ALUMNI") {
      category = data.academicStatus === "ALUMNI" ? "ALUMNI" : "MAHASISWA";
      if (data.campusType === "UNNES") {
        institution = normalizeInstitution(
          `${data.faculty ?? ""} - ${data.studyProgram ?? ""} UNNES`,
        );
      } else {
        institution = normalizeInstitution(
          `${data.campusName ?? ""} - ${data.faculty ?? ""} / ${data.studyProgram ?? ""}`,
        );
      }
    } else {
      category = "TAMU_UNDANGAN";
      institution = normalizeInstitution(
        data.institution && data.institution.trim().length > 0
          ? data.institution
          : data.churchOrigin,
      );
    }

    return {
      ...data,
      category,
      institution: institution.slice(0, 120),
    };
  });

export async function POST(request: Request) {
  if (!(await hasAdminSession(request))) {
    return NextResponse.json(
      { status: "unauthorized", message: "Silakan masuk sebagai admin." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!hasSameOrigin(request)) {
    return NextResponse.json(
      {
        status: "forbidden",
        message: "Permintaan ditolak untuk mencegah pemalsuan lintas situs.",
      },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "invalid", message: "Format payload tidak valid." },
      { status: 400 },
    );
  }

  const parsed = walkinSchema.safeParse(body);
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? "Data pendaftaran OTS tidak valid.";
    return NextResponse.json(
      {
        status: "invalid",
        message: firstError,
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const outcome = await registerWalkinAttendee(parsed.data);

    if (outcome.status === "registered") {
      return NextResponse.json({
        status: "success",
        message: `Peserta ${outcome.attendee.fullName} (${outcome.attendee.ticketCode}) berhasil didaftarkan dan langsung diabsenkan HADIR.`,
        attendee: outcome.attendee,
      });
    }

    if (outcome.status === "checked-in-existing") {
      return NextResponse.json({
        status: "success",
        message: outcome.message,
      });
    }

    if (outcome.status === "already-present") {
      return NextResponse.json(
        { status: "already-present", message: outcome.message },
        { status: 409 },
      );
    }

    if (
      outcome.status === "not-configured" ||
      outcome.status === "not-open" ||
      outcome.status === "outside-window"
    ) {
      return NextResponse.json(
        { status: outcome.status, message: outcome.message },
        {
          status: outcome.status === "not-configured" ? 503 : 409,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    return NextResponse.json(
      { status: outcome.status, message: outcome.message },
      { status: 503 },
    );
  } catch (error) {
    console.error("Gagal memproses pendaftaran OTS admin:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Terjadi kesalahan server saat memproses pendaftaran OTS.",
      },
      { status: 500 },
    );
  }
}
