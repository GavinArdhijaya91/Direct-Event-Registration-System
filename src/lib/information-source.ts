import { InformationSource } from "@/generated/prisma/enums";
import type { RegistrationInput } from "@/lib/registration";

export const DEFAULT_INFORMATION_SOURCE = InformationSource.GRUP_WA;

export function toDbInformationSource(
  source: RegistrationInput["informationSource"],
): InformationSource {
  switch (source) {
    case "TEMAN_GRUP_GEREJA":
      return InformationSource.GRUP_WA;
    default:
      return source;
  }
}
