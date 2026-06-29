---
description: Turn a feature spec into an ordered, bottom-up implementation plan
argument-hint: <path to spec file, or feature name>
---

# /plan-feature — implementation plan from a spec

Produce an ordered, bottom-up implementation plan for: **$ARGUMENTS**

## Before writing
1. Read the corresponding `specs/<feature>.spec.md`. If it doesn't exist, run `/spec` first.
2. Re-read `CLAUDE.md` + `docs/` for the layering and patterns to follow.
3. Confirm against the real code which pieces already exist (cite `path:line`).

## Output
Write to `specs/<kebab-feature-name>.plan.md` with these sections:

- **Context** — why this work, linking to the spec.
- **Implementation steps** — an ordered, bottom-up sequence. Build in dependency order so
  each step is testable before the next:
  `data model → service → controller → route → backend tests → FE config → FE service →
  Redux slice → component → FE tests → E2E`.
  For each step: the file(s), what changes, which existing pattern/utility to reuse, and the
  test that proves it works.
- **Test strategy** — unit + integration + E2E coverage mapped to the spec's acceptance
  criteria. Prefer tests-first where practical.
- **Verification** — how to confirm end-to-end in the running app (commands, MCP tools,
  manual steps), and confirmation that pre-existing tests still pass (don't break what works).
- **Risks / rollback** — what could break and how to back out.

## Principles
- Smallest change that fully satisfies the spec; reuse before adding.
- Each step should leave the tree green (or clearly tests-first red → green).
- Name real files and real existing helpers — no placeholders.
