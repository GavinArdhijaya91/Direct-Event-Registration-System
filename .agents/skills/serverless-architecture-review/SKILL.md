---
name: serverless-architecture-review
description: Review architectural decisions for the Natal PWK 2026 registration app, including Next.js server/client boundaries, APIs, PostgreSQL, Prisma, admin authentication, deployment, and event-day reliability.
---

# Serverless Architecture Review

## Review workflow

1. Read `PRD.md` and `AGENTS.md`; identify the goal, user journey, constraints, open product decisions, and existing implementation before proposing a design.
2. Trace the relevant data flow end to end: browser, server boundary, authorization, database, and response. Mark personal data, bearer tokens, admin secrets, and untrusted input.
3. Check core invariants: server-side validation/authentication; private ticket access; atomic duplicate/capacity/check-in behavior; explicit WIB schedule; CSV safety; and visible service failures.
4. Evaluate expected load (200–300 registrations plus a short check-in burst), database connection limits, provider quotas, outage behavior, backup/restore, and event-day fallback.
5. Compare only realistic alternatives. Prefer the least complex option that meets the accepted requirement; do not introduce a queue, cache, microservice, realtime provider, or abstraction without evidence it is needed.
6. Verify current framework/provider behaviors with primary documentation when the recommendation depends on version, plan, limits, or runtime support. Use `event-platform-research` for report-scale comparisons.
7. Ask the product owner before resolving choices that change threat model, participant recovery, admin access, recurring cost, or operational responsibility.

## Output

Summarize the recommendation and rationale, data/security boundaries, failure modes, operational trade-offs, alternatives rejected, and decisions still needed. Label confirmed constraints, estimates, and assumptions distinctly. Do not present an architecture sketch as a security audit or load-test result.
