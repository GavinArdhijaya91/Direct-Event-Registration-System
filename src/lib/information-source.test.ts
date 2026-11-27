import assert from "node:assert/strict";
import test from "node:test";
import { InformationSource } from "@/generated/prisma/enums";
import {
  DEFAULT_INFORMATION_SOURCE,
  toDbInformationSource,
} from "@/lib/information-source";

const validLabels = Object.values(InformationSource);

test("sumber informasi publik dipetakan ke label enum yang ada di database", () => {
  assert.equal(
    toDbInformationSource("TEMAN_GRUP_GEREJA"),
    InformationSource.GRUP_WA,
  );
  assert.equal(toDbInformationSource("INSTAGRAM"), InformationSource.INSTAGRAM);
  assert.equal(
    toDbInformationSource("POSTER_KAMPUS"),
    InformationSource.POSTER_KAMPUS,
  );

  for (const source of ["INSTAGRAM", "TEMAN_GRUP_GEREJA", "POSTER_KAMPUS"] as const) {
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
