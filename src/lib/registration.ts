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

export const registrationSchema = z.object({
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
      z
        .string({
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
  informationSource: z.enum(
    ["INSTAGRAM", "GRUP_WA", "TEMAN_KATING", "POSTER_KAMPUS", "GEREJA_PMK"],
    { error: "Pilih sumber informasi." },
  ),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
