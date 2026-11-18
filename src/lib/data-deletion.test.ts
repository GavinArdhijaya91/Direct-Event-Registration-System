import assert from "node:assert/strict";
import test from "node:test";
import { isBulkDeletionWindowOpen } from "@/lib/data-deletion";

test("allows bulk deletion for the inclusive WIB dates of February 20 to March 15", () => {
  assert.equal(
    isBulkDeletionWindowOpen(new Date("2027-02-19T16:59:59.999Z")),
    false,
  );
  assert.equal(
    isBulkDeletionWindowOpen(new Date("2027-02-19T17:00:00.000Z")),
    true,
  );
  assert.equal(
    isBulkDeletionWindowOpen(new Date("2027-03-15T16:59:59.999Z")),
    true,
  );
  assert.equal(
    isBulkDeletionWindowOpen(new Date("2027-03-15T17:00:00.000Z")),
    false,
  );
});
