---
name: anti-slop-event-ui
description: Design or review participant and admin interfaces for the Natal PWK 2026 registration system. Use when building forms, tickets, check-in states, dashboards, or responsive visual design.
---

# Event UI Quality

## Principles

- Read `PRD.md` and follow the real participant or organizer task before choosing visual treatments.
- Prefer a clear event identity and restrained Christmas palette (deep green, limited red accents, green for checked-in state) over generic dashboard templates or excessive festive decoration.
- Use real application states and data. Do not invent attendee metrics, pretend controls work, or show success before the server confirms it.
- Every data or action area needs an honest loading, empty, error, disabled, or success state as applicable.
- Prioritize mobile readability, keyboard access, semantic labels, visible focus, sufficient contrast, and understandable camera-permission guidance.
- Keep animations subtle and nonessential. Motion, a running clock, and a polished ticket are not proof of identity, venue presence, or server state.
- Do not imitate another event brand's distinctive graphics. Reuse existing project components/tokens when they exist; add dependencies only for a demonstrated need.

## Review checklist

1. Can a first-time participant register, save the ticket, find help, and understand what happens next?
2. Are privacy and duplicate-registration messages helpful without exposing another person's data?
3. Are ticket state and check-in time based on the server response?
4. Can an organizer identify and recover from full capacity, camera failure, network loss, and server errors?
5. Does the UI remain usable on a narrow phone viewport and with reduced motion?

Report functional or accessibility defects separately from subjective visual preferences.
