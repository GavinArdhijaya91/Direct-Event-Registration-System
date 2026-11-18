---
name: event-registration-prd-review
description: Review or change product requirements and implementation for the Natal PWK 2026 registration, tickets, check-in, capacity, admin, CSV export, or event-day operations. Use this skill to keep changes aligned with the PRD and surface unresolved product decisions.
---

# Event Registration PRD Review

## Source of truth

Read the repository `PRD.md` and `AGENTS.md` first. The PRD is a draft; its "Keputusan Terbuka Sebelum Implementasi" section identifies unresolved choices. Do not silently turn an open question into a product commitment.

## Review workflow

1. Identify the affected user journey: registration, duplicate handling, ticket issuance/recovery, check-in, admin operation, reporting, or event-day fallback.
2. Compare the proposed change with the PRD and these invariants:
   - One registration represents one person; group members register individually.
   - A WhatsApp number is unique per participant but is not verified identity; recovery requires both the normalized number and the secret recovery code.
   - A ticket URL is a bearer secret; its display code is not an access credential.
   - A static venue QR can be copied and does not prove physical presence. Client clocks, animation, and screenshots are not security controls.
   - Admin actions require server-side authorization. A shared password cannot attribute actions to individual organizers.
   - Capacity checks and one-time check-in must remain correct under concurrent requests.
   - Personal data and CSV exports are restricted to their stated event purposes.
3. Check failure paths and event-day constraints: duplicate submits, full capacity, concurrent check-in, expired/out-of-window check-in, lost device, denied camera permission, weak connectivity, database outage, and manual reconciliation.
4. For architecture or vendor claims, distinguish requirements from choices. Verify current limits, prices, and runtime compatibility from primary documentation before stating them as facts.
5. If behavior is unclear or changes a product risk, ask the product owner. Otherwise make the smallest change that satisfies the stated acceptance criteria and update the PRD when behavior changes.

## Review output

Report concise findings with:

- Requirement or invariant and its PRD section.
- Concrete evidence in the change or spec.
- Impact on participants, organizers, privacy, reliability, or cost.
- Whether it is a confirmed issue, an accepted trade-off, or an unresolved decision.

Do not label the static-QR design "anti-fraud" or claim a free-tier deployment will cost Rp0 without current evidence.
