---
description: Turn a feature description into a precise, testable spec
argument-hint: <feature name or description>
---

# /spec — write a testable feature specification

You are writing a specification for: **$ARGUMENTS**

The spec is the highest-leverage artifact in this workflow: a vague spec produces vague
code, a precise one produces correct, reviewable code. Spend the effort here.

## Before writing
1. Read `CLAUDE.md` and the relevant `docs/` notes for architecture and conventions.
2. Explore the existing codebase for what **already exists** vs. what is missing — do not
   propose building something the codebase already provides. Cite real files (`path:line`).
3. If a requirements source exists (e.g. a problem-statement PDF), treat it as authoritative.

## Output
Write the spec to `specs/<kebab-feature-name>.spec.md` with these sections:

- **Summary** — one paragraph: what the feature does and for whom.
- **User-facing behaviour** — concrete, observable behaviour (the bar the code must meet).
- **Acceptance criteria** — a numbered, individually testable checklist. Each item must be
  verifiable by a test or a manual step. Cover the happy path AND authorization/ownership.
- **Edge cases & error handling** — empty/invalid input, unauthenticated/unauthorized
  access, not-found, idempotency, race conditions. State the expected status code/response.
- **API contract** — every new/changed endpoint: method, path, auth, request body,
  success response (with the project's response envelope), and error responses with codes.
- **Data model changes** — new fields/collections, types, defaults, indexes.
- **Affected files** — the concrete list to add or change, grouped by layer, reusing
  existing patterns/utilities (name them).
- **Out of scope** — what this feature explicitly does NOT include.
- **Open questions** — anything needing a human decision (don't guess silently).

## Principles
- Keep it generic to the codebase's real conventions; push solution-specific depth into the
  spec, not into CLAUDE.md.
- Be empirical: every acceptance criterion should map to a test you could actually run.
- Do not write implementation code here — that's `/plan-feature` and the build stage.
