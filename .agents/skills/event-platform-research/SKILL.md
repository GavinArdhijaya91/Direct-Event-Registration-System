---
name: event-platform-research
description: Research current hosting, database, framework, privacy, and operational choices for the Natal PWK 2026 registration system. Use when a decision depends on current provider plans, pricing, limits, compatibility, or official requirements.
---

# Event Platform Research

## Research rules

- Read `PRD.md` and `AGENTS.md` to understand the exact event workload and unresolved decisions before researching.
- Use primary sources first: official Vercel, database-provider, Next.js/Prisma, government, or standards documentation. Use secondary sources only to add context, and label them.
- Verify that a source describes the current plan/product and record its last-updated/effective date when available. Do not rely on install counts, old tutorials, or marketing claims as technical evidence.
- Do not state that the system will cost Rp0 until the actual deployment configuration, provider terms, and usage estimates have been checked. Identify quotas, overage behavior, and likely failure modes.
- Do not send repository code, credentials, participant data, or other private material to external research services.

## Workflow

1. Frame the decision and what is not being decided. Ask for the minimum missing constraint when it changes the recommendation.
2. Research official documentation for each option using equivalent criteria: supported runtime, database connection/pooling, free-tier limits, backup/restore, region/data location, operational requirements, and likely cost for 200–300 registrations plus event-day burst traffic.
3. Separate verified facts, estimates, assumptions, and unknowns. Include source links and access date for material claims.
4. Compare trade-offs against the event's simple one-off workload; do not recommend extra services or architecture solely for theoretical scale.
5. Summarize the recommendation, rejected alternatives, risks, validation steps, and any decision the product owner must make. Update `PRD.md` only after a product decision is accepted.

## Expected output

Use a concise comparison table when comparing providers. Cite primary sources beside claims, state the date checked, and avoid false precision in cost estimates.
