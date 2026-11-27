import assert from "node:assert/strict";
import test from "node:test";
import { InformationSource } from "@/generated/prisma/enums";
import {
  DEFAULT_INFORMATION_SOURCE,
  toDbInformationSource,
} from "@/lib/information-source";

const validLabels = Object.values(InformationSource);

test("sumber informasi publik dipetakan ke label enum yang ada di database", () => {
  const sources = [
    "INSTAGRAM",
    "WHATSAPP",
    "FACEBOOK",
    "TEMAN_KOMUNITAS_GEREJA",
  ] as const;

  assert.equal(toDbInformationSource("INSTAGRAM"), InformationSource.INSTAGRAM);
  assert.equal(toDbInformationSource("WHATSAPP"), InformationSource.GRUP_WA);
  assert.equal(toDbInformationSource("FACEBOOK"), InformationSource.FACEBOOK);
  assert.equal(
    toDbInformationSource("TEMAN_KOMUNITAS_GEREJA"),
    InformationSource.TEMAN_KOMUNITAS_GEREJA,
  );

  for (const source of sources) {
    assert.ok(
      validLabels.includes(toDbInformationSource(source)),
      `label hasil pemetaan ${source} tidak dikenal database`,
    );
  }
});

test("nilai default pendaftaran OTS juga memakai label enum yang valid", () => {
  assert.ok(validLabels.includes(DEFAULT_INFORMATION_SOURCE));
  assert.equal(DEFAULT_INFORMATION_SOURCE, InformationSource.GRUP_WA);
});
