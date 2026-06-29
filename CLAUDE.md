# CLAUDE.md

Project guidance for **DevAnswers**. General working principles (empirical verification,
WHY-focused commits, skill consciousness, the 200-line index rule) live in the global
`~/.claude/CLAUDE.md` — this file only adds project specifics.

## Project

**DevAnswers** — a Stack-Overflow-style Q&A app.

- `devanswers-backend/` — Express 5 + Mongoose 8 REST API. Layered: `routes → controllers
  → services → models`. JWT auth, Helmet, rate-limiting, Gemini AI (`@google/genai`).
  Tests: Vitest + Supertest + `mongodb-memory-server`.
- `devanswers-frontend/` — React 19 + Redux Toolkit + React Router 7, built with Vite.
  Axios service layer, Bootstrap UI. Tests: Vitest + Testing Library + MSW.

Requirements source: **`WK11_GradedProject_Problem_Statement.pdf`** (project root) — the
authoritative spec for what to build. The code is already scaffolded against it.

### Docs: two folders, two audiences
- **`docs/`** — local-only working notes (gitignored). Architecture, conventions, gotchas
  for *us* while building.
  - `docs/architecture.md` — module boundaries, data flow, schema.
  - `docs/backend.md` / `docs/frontend.md` — per-app conventions and gotchas.
  - `docs/testing.md` — how to run/write tests, fixtures, MSW handlers.
- **`docs_shared/`** — version-controlled, outward-facing docs for co-devs and users
  (getting-started, API reference, features). Committed to the repo.

## Commands

Backend (`cd devanswers-backend`):
- `npm run dev` — run with nodemon · `npm start` — run · `npm test` — Vitest
- `npm run populate` — seed the DB

Frontend (`cd devanswers-frontend`):
- `npm run dev` — Vite dev server · `npm run build` · `npm test` · `npm run lint`

## Tooling
- **Commits/PRs:** use the `gh` CLI.
- **E2E testing:** use the **Playwright CLI** to verify UI behavior empirically.
- **API testing:** Postman MCP + Postman VS Code extension are available. The
  `POSTMAN_API_KEY` is in `devanswers-backend/.env` (never commit it).

## Conventions (quick reference; deep-dives in `docs/`)
- Backend is ESM (`"type": "module"`). Keep the `routes → controllers → services → models`
  layering — business logic in services, not controllers.
- Frontend state via Redux Toolkit slices (`src/reducers/`); API calls via the Axios
  service layer (`src/services/`, `src/api/axiosInstance.js`), never ad-hoc in components.
- Secrets in `.env` (see `devanswers-backend/.env.example`) — never commit them.
- Match the style, naming, and test patterns of surrounding code.
