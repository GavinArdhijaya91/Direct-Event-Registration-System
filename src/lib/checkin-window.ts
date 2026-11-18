export function getCheckinWindowStatus(
  now: Date,
  opensAt: Date | null,
  closesAt: Date | null,
) {
  if (!opensAt || !closesAt) {
    return "not-configured" as const;
  }
  if (now < opensAt) {
    return "not-open" as const;
  }
  if (now > closesAt) {
    return "closed" as const;
  }
  return "open" as const;
}
