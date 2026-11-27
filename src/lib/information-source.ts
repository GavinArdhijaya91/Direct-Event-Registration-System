import { InformationSource } from "@/generated/prisma/enums";
import type { RegistrationInput } from "@/lib/registration";

export const DEFAULT_INFORMATION_SOURCE = InformationSource.GRUP_WA;

export function toDbInformationSource(
  source: RegistrationInput["informationSource"],
): InformationSource {
  switch (source) {
    case "WHATSAPP":
      return InformationSource.GRUP_WA;
    case "INSTAGRAM":
      return InformationSource.INSTAGRAM;
    case "FACEBOOK":
      return InformationSource.FACEBOOK;
    case "TEMAN_KOMUNITAS_GEREJA":
      return InformationSource.TEMAN_KOMUNITAS_GEREJA;
  }
}
