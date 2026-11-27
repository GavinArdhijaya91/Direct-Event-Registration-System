import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
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

function autoFitColumns(rows: (string | number)[][]): { wch: number }[] {
  if (rows.length === 0) return [];
  const colCount = Math.max(...rows.map((r) => r.length));
  const widths: number[] = new Array(colCount).fill(10);
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      const val = row[i] != null ? String(row[i]) : "";
      widths[i] = Math.max(widths[i], Math.min(val.length + 3, 42));
    }
  }
  return widths.map((w) => ({ wch: w }));
}

const infoSourceLabels: Record<string, string> = {
  INSTAGRAM: "Instagram",
  GRUP_WA: "WhatsApp",
  TEMAN_KATING: "Teman / Kating",
  POSTER_KAMPUS: "Poster Kampus",
  GEREJA_PMK: "Gereja / PMK",
  FACEBOOK: "Facebook",
  TEMAN_KOMUNITAS_GEREJA: "Teman / Komunitas Gereja",
};

export async function GET(request: Request) {
  if (!(await hasAdminSession(request))) {
    return NextResponse.json(
      { status: "unauthorized", message: "Silakan masuk sebagai admin." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all"; // 'internal' | 'presensi' | 'all'
  const format = searchParams.get("format") || "xlsx"; // 'xlsx' | 'csv'

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
        action: `export-${type}-${format}`,
        details: { rowCount: result.length, type, format },
      },
    });
    return result;
  });

  const totalRegistered = attendees.length;
  const totalHadir = attendees.filter((a) => a.status === "HADIR").length;
  const totalBelum = totalRegistered - totalHadir;
  const persentaseHadir =
    totalRegistered > 0 ? ((totalHadir / totalRegistered) * 100).toFixed(1) : "0";

  // 1. Data Peserta Internal (Tanpa status kehadiran hari-H)
  const internalHeaders = [
    "No",
    "Kode Tiket",
    "Nama Lengkap",
    "Nomor WhatsApp",
    "Tempat Lahir",
    "Tanggal Lahir",
    "Asal Stasi / Gereja",
    "Domisili",
    "Tipe Peserta",
    "Status Akademik",
    "Tahun Kelulusan",
    "Asal Kampus",
    "Nama Universitas",
    "Fakultas",
    "Program Studi",
    "Kategori",
    "Asal Instansi",
    "Sumber Informasi",
    "Waktu Pendaftaran (WIB)",
  ];

  const internalRows: (string | number)[][] = attendees.map((a, index) => [
    index + 1,
    a.ticketCode,
    a.fullName,
    a.whatsappNumber,
    a.birthPlace || "-",
    a.birthDate || "-",
    a.churchOrigin || "-",
    a.domicile || "-",
    a.participantType === "MAHASISWA_ALUMNI" ? "Mahasiswa / Alumni" : "Umum",
    a.academicStatus || "-",
    a.graduationYear || "-",
    a.campusType === "UNNES"
      ? "UNNES"
      : a.campusType === "LUAR_UNNES"
        ? "Luar UNNES"
        : "-",
    a.campusName || "-",
    a.faculty || "-",
    a.studyProgram || "-",
    a.category,
    a.institution,
    infoSourceLabels[a.informationSource] || a.informationSource,
    formatWib(a.registeredAt),
  ]);

  // 2. Rekapitulasi Kehadiran Hari-H (Presensi)
  const presensiHeaders = [
    "No",
    "Kode Tiket",
    "Nama Lengkap",
    "Nomor WhatsApp",
    "Kategori",
    "Asal Instansi",
    "Status Kehadiran",
    "Waktu Check-in (WIB)",
    "Metode Check-in",
    "Waktu Pendaftaran (WIB)",
  ];

  const presensiRows: (string | number)[][] = attendees.map((a, index) => [
    index + 1,
    a.ticketCode,
    a.fullName,
    a.whatsappNumber,
    a.category,
    a.institution,
    a.status === "HADIR" ? "HADIR" : "BELUM HADIR",
    formatWib(a.checkedInAt) || "-",
    a.checkinMethod === "SCAN_MANDIRI"
      ? "Scan Mandiri (Peserta)"
      : a.checkinMethod === "MANUAL_ADMIN"
        ? "Manual oleh Admin"
        : "-",
    formatWib(a.registeredAt),
  ]);

  // Baris ringkasan presensi
  const summaryRows: (string | number)[][] = [
    [],
    ["RINGKASAN KEHADIRAN", "", "", "", "", "", "", "", "", ""],
    ["Total Peserta Terdaftar", totalRegistered, "", "", "", "", "", "", "", ""],
    ["Jumlah Hadir", totalHadir, `(${persentaseHadir}%)`, "", "", "", "", "", "", ""],
    ["Jumlah Belum Hadir", totalBelum, "", "", "", "", "", "", "", ""],
  ];

  // 3. Ekspor ke Excel (.xlsx)
  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new();

    if (type === "internal") {
      const allData = [internalHeaders, ...internalRows];
      const sheet = XLSX.utils.aoa_to_sheet(allData);
      sheet["!cols"] = autoFitColumns(allData);
      XLSX.utils.book_append_sheet(workbook, sheet, "Data Peserta Internal");
    } else if (type === "presensi") {
      const allData = [presensiHeaders, ...presensiRows, ...summaryRows];
      const sheet = XLSX.utils.aoa_to_sheet(allData);
      sheet["!cols"] = autoFitColumns([presensiHeaders, ...presensiRows]);
      XLSX.utils.book_append_sheet(workbook, sheet, "Rekap Kehadiran Hari-H");
    } else {
      // type === "all" -> Buat 2 Sheet terpisah yang sangat rapi
      const internalData = [internalHeaders, ...internalRows];
      const sheetInternal = XLSX.utils.aoa_to_sheet(internalData);
      sheetInternal["!cols"] = autoFitColumns(internalData);
      XLSX.utils.book_append_sheet(workbook, sheetInternal, "Data Peserta (Internal)");

      const presensiData = [presensiHeaders, ...presensiRows, ...summaryRows];
      const sheetPresensi = XLSX.utils.aoa_to_sheet(presensiData);
      sheetPresensi["!cols"] = autoFitColumns([presensiHeaders, ...presensiRows]);
      XLSX.utils.book_append_sheet(workbook, sheetPresensi, "Rekap Kehadiran (Hari-H)");
    }

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const filename =
      type === "internal"
        ? "data-peserta-internal-natal-pwk-2026.xlsx"
        : type === "presensi"
          ? "rekap-kehadiran-hari-h-natal-pwk-2026.xlsx"
          : "laporan-lengkap-peserta-natal-pwk-2026.xlsx";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  }

  // 4. Ekspor ke CSV (.csv)
  let csvHeaders: string[];
  let csvDataRows: (string | number)[][];
  let filename: string;

  if (type === "internal") {
    csvHeaders = internalHeaders;
    csvDataRows = internalRows;
    filename = "data-peserta-internal-natal-pwk-2026.csv";
  } else if (type === "presensi") {
    csvHeaders = presensiHeaders;
    csvDataRows = [...presensiRows, ...summaryRows];
    filename = "rekap-kehadiran-hari-h-natal-pwk-2026.csv";
  } else {
    // Gabungan
    csvHeaders = [
      ...internalHeaders,
      "Status Kehadiran",
      "Waktu Check-in (WIB)",
      "Metode Check-in",
    ];
    csvDataRows = attendees.map((a, index) => [
      index + 1,
      a.ticketCode,
      a.fullName,
      a.whatsappNumber,
      a.birthPlace || "-",
      a.birthDate || "-",
      a.churchOrigin || "-",
      a.domicile || "-",
      a.participantType === "MAHASISWA_ALUMNI" ? "Mahasiswa / Alumni" : "Umum",
      a.academicStatus || "-",
      a.graduationYear || "-",
      a.campusType === "UNNES"
        ? "UNNES"
        : a.campusType === "LUAR_UNNES"
          ? "Luar UNNES"
          : "-",
      a.campusName || "-",
      a.faculty || "-",
      a.studyProgram || "-",
      a.category,
      a.institution,
      infoSourceLabels[a.informationSource] || a.informationSource,
      formatWib(a.registeredAt),
      a.status === "HADIR" ? "HADIR" : "BELUM HADIR",
      formatWib(a.checkedInAt) || "-",
      a.checkinMethod === "SCAN_MANDIRI"
        ? "Scan Mandiri (Peserta)"
        : a.checkinMethod === "MANUAL_ADMIN"
          ? "Manual oleh Admin"
          : "-",
    ]);
    filename = "laporan-lengkap-peserta-natal-pwk-2026.csv";
  }

  const csv = `\uFEFF${[
    csvHeaders.map(csvCell).join(","),
    ...csvDataRows.map((row) => row.map((c) => csvCell(String(c))).join(",")),
  ].join("\r\n")}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
