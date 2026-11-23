import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-session";
import { csvCell } from "@/lib/csv";
import { getPrismaClient } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatWib(date: Date | null) {
  return date
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "short",
        timeStyle: "medium",
        timeZone: "Asia/Jakarta",
      }).format(date)
    : "";
}

export async function GET(request: Request) {
  if (!hasAdminSession(request)) {
    return NextResponse.json(
      { status: "unauthorized", message: "Silakan masuk sebagai admin." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const prisma = getPrismaClient();
  const attendees = await prisma.$transaction(async (transaction) => {
    const result = await transaction.attendee.findMany({
      orderBy: { registeredAt: "asc" },
      select: {
        ticketCode: true,
        fullName: true,
        whatsappNumber: true,
        birthPlace: true,
        birthDate: true,
        churchOrigin: true,
        domicile: true,
        participantType: true,
        academicStatus: true,
        graduationYear: true,
        campusType: true,
        campusName: true,
        faculty: true,
        studyProgram: true,
        category: true,
        institution: true,
        informationSource: true,
        registeredAt: true,
        status: true,
        checkedInAt: true,
        checkinMethod: true,
      },
    });
    await transaction.adminAuditLog.create({
      data: {
        action: "csv-export",
        details: { rowCount: result.length },
      },
    });
    return result;
  });

  const header = [
    "Kode Tiket",
    "Nama Lengkap",
    "Nomor WA",
    "Tempat Lahir",
    "Tanggal Lahir",
    "Asal Stasi / Gereja",
    "Domisili",
    "Tipe Peserta",
    "Status Akademik",
    "Tahun Kelulusan (Alumni)",
    "Asal Kampus",
    "Nama Universitas",
    "Fakultas",
    "Program Studi",
    "Kategori Final",
    "Asal Instansi",
    "Sumber Informasi",
    "Waktu Daftar (WIB)",
    "Status Kehadiran",
    "Waktu Check-in (WIB)",
    "Metode Check-in",
  ];

  const rows = attendees.map((attendee) =>
    [
      attendee.ticketCode,
      attendee.fullName,
      attendee.whatsappNumber,
      attendee.birthPlace,
      attendee.birthDate,
      attendee.churchOrigin,
      attendee.domicile,
      attendee.participantType === "MAHASISWA_ALUMNI" ? "Mahasiswa / Alumni" : "Umum",
      attendee.academicStatus ?? "",
      attendee.graduationYear ?? "",
      attendee.campusType === "UNNES"
        ? "UNNES"
        : attendee.campusType === "LUAR_UNNES"
          ? "Luar UNNES"
          : "",
      attendee.campusName ?? "",
      attendee.faculty ?? "",
      attendee.studyProgram ?? "",
      attendee.category,
      attendee.institution,
      attendee.informationSource,
      formatWib(attendee.registeredAt),
      attendee.status,
      formatWib(attendee.checkedInAt),
      attendee.checkinMethod ?? "",
    ]
      .map(csvCell)
      .join(","),
  );

  const csv = `\uFEFF${[header.map(csvCell).join(","), ...rows].join("\r\n")}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="peserta-natal-pwk-2026.csv"',
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
