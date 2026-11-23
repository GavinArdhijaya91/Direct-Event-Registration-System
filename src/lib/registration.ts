import { z } from "zod";

const indonesiaMobileNumber = /^628[0-9]{8,12}$/;
const institutionAbbreviations = new Set([
  "FMIPA",
  "FT",
  "FBS",
  "FISIP",
  "FEB",
  "FH",
  "FIK",
  "FIPP",
  "FK",
  "UNNES",
  "UNDIP",
  "PMK",
  "KMK",
  "UK3",
  "TI",
  "SI",
]);

export const UNNES_FACULTIES = [
  "FK",
  "FEB",
  "FIPP",
  "FMIPA",
  "FBS",
  "FISIP",
  "FH",
  "FT",
  "FIK",
] as const;

export function normalizeWhatsappNumber(value: string) {
  const digits = value.replace(/\D/g, "");

  const normalized = digits.startsWith("0")
    ? `62${digits.slice(1)}`
    : digits.startsWith("8")
      ? `62${digits}`
      : digits;

  return indonesiaMobileNumber.test(normalized) ? normalized : null;
}

export function normalizeInstitution(value: string) {
  const compact = value.trim().replace(/\s+/g, " ");

  return compact
    .split(/([^\p{L}\p{N}]+)/u)
    .map((part) => {
      if (!/[\p{L}\p{N}]/u.test(part)) {
        return part;
      }

      const uppercase = part.toLocaleUpperCase("id-ID");
      if (institutionAbbreviations.has(uppercase)) {
        return uppercase;
      }

      const lowercase = part.toLocaleLowerCase("id-ID");
      return lowercase.replace(
        /^(\p{L}|\p{N})/u,
        (character) => character.toLocaleUpperCase("id-ID"),
      );
    })
    .join("");
}

export const registrationSchema = z
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
      error: "Pilih tipe peserta (Mahasiswa/Alumni atau Umum).",
    }),
    academicStatus: z.enum(["MAHASISWA", "ALUMNI"]).optional(),
    graduationYear: z.string().trim().optional(),
    campusType: z.enum(["UNNES", "LUAR_UNNES"]).optional(),
    campusName: z.string().trim().optional(),
    faculty: z.string().trim().optional(),
    studyProgram: z.string().trim().optional(),
    institution: z.string().trim().optional(),
    informationSource: z.enum(
      ["INSTAGRAM", "TEMAN_GRUP_GEREJA", "POSTER_KAMPUS"],
      { error: "Pilih sumber informasi." },
    ),
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
            message: "Tahun kelulusan wajib diisi 4 digit angka (misal: 2023).",
            path: ["graduationYear"],
          });
        }
      }

      if (!data.campusType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pilih asal kampus (UNNES atau Luar UNNES).",
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
            message: "Pilih salah satu fakultas UNNES yang tersedia.",
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
            message: "Nama perguruan tinggi / universitas wajib diisi.",
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

export type RegistrationInput = z.infer<typeof registrationSchema>;
