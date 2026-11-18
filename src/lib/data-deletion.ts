const bulkDeletionStartsAt = Date.parse("2027-02-19T17:00:00.000Z");
const bulkDeletionEndsAt = Date.parse("2027-03-15T17:00:00.000Z");

export function isBulkDeletionWindowOpen(now: Date) {
  const timestamp = now.getTime();
  return timestamp >= bulkDeletionStartsAt && timestamp < bulkDeletionEndsAt;
}
