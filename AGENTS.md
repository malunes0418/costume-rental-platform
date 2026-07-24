# 🎭 Costume Rental Platform - Codex Guide

## 🛠️ Build & Dev Commands
- **Install dependencies:** `npm install`
- **Start all development servers:** `npm run dev` (executes `turbo run dev` for all workspaces)
- **Database migrations:** `npm run migrate` (in `apps/backend`)
- **Undo migrations:** `npm run migrate:undo` or `npm run migrate:undo:all`
- **Build production apps:** `npm run build`

## 🧠 Project Agent Skills

Project skills live in `.cursor/skills/` so Cursor Cloud Agents (and local Cursor) can discover them. Each skill is a folder with a `SKILL.md`.

### Included packs

- **Superpowers:** `using-superpowers`, `brainstorming`, `systematic-debugging`, `writing-plans`, `executing-plans`, `test-driven-development`, and related workflow skills
- **Engineering team:** role skills for architect/frontend/backend/fullstack/QA/devops/security/cloud/data/ML, plus `code-reviewer`, `tdd-guide`, `tech-stack-evaluator`, `a11y-audit`, etc.
- **Impeccable:** frontend design craft (`impeccable`) for distinctive UI work

### Overview of engineering skills

- **Core Engineering:** `senior-architect`, `senior-frontend`, `senior-backend`, `senior-fullstack`, `senior-qa`, `senior-devops`, `senior-secops`, `code-reviewer`, `senior-security`
- **Cloud & Enterprise:** `aws-solution-architect`, `ms365-tenant-manager`, `azure-cloud-architect`, `gcp-cloud-architect`
- **AI/ML/Data:** `senior-data-scientist`, `senior-data-engineer`, `senior-ml-engineer`, `senior-prompt-engineer`, `senior-computer-vision`
- **Security:** `adversarial-reviewer`, `threat-detection`, `incident-response`, `cloud-security`, `red-team`, `ai-security`
- **Other specialized skills:** `epic-design`, `a11y-audit`, `tdd-guide`, `tech-stack-evaluator`, `impeccable`

### How to use

Each skill typically contains:
1. `SKILL.md` — main instructions (auto-discovered by Cursor)
2. `references/` or `reference/` — detailed guides
3. `scripts/` — optional automation helpers

Example:
```bash
python .cursor/skills/senior-fullstack/scripts/code_quality_analyzer.py ./
```

## 📏 General Project Guidelines
- **TypeScript:** Use strict mode and provide explicit types for DTOs and models.
- **Frontend:** Next.js App Router, Tailwind CSS, functional components with Hooks.
- **Backend:** Express, clean architecture (Routes -> Controllers -> Services), Sequelize ORM.
- **Auth:** JWT and Google OAuth 2.0 via Passport.js.

## Cursor Cloud specific instructions

Services (start everything from the repo root with `npm run dev`, which runs turbo): the **backend** (Express/TS) serves on `http://localhost:4000` (Swagger at `/api-docs`) and the **web** app (Next.js) serves on `http://localhost:3000`. `packages/*` is declared in workspaces but is empty; only `apps/backend` and `apps/web` exist. There is no mobile/Expo app despite mentions in some docs.

- **Database is MySQL and must be running before the backend starts.** On boot `apps/backend/src/server.ts` calls `sequelize.authenticate()` and auto-applies pending migrations via Umzug, so the backend will refuse to listen if MySQL is unreachable. MySQL is installed via apt (not Docker); start it with `sudo service mysql start` (there is no systemd; `service` works). The DB is `costume_rental` and the `root` user uses `mysql_native_password` with an empty password over TCP, matching `apps/backend/.env`.
- **Env files are required and gitignored** (so they persist in the VM snapshot, not in git): `apps/backend/.env` (copied from `apps/backend/.env.sample`) and `apps/web/.env.local` (`NEXT_PUBLIC_API_URL=http://localhost:4000`). The backend throws at startup if any required var is missing; the sample's placeholder OAuth/EMAIL values are enough to boot (email/password login works without real Google/SMTP creds).
- **Migrations/seed:** migrations run automatically on backend startup, or manually with `npm --workspace backend run migrate`. Load demo data (no API keys needed — uses the committed `seed_scripts/seed.sql`) with `npm --workspace backend run seed:import`, then verify with `npm --workspace backend run seed:verify`. Seed logins: `admin@admin.com` / `admin` (ADMIN), and `customer1@example.com` / `vendor1@example.com` / `password123`.
- **Tests:** `npm --workspace backend run test` (Vitest, unit tests only — no DB or running server required). The web app has no test runner.
- **Lint:** `npm run lint` (turbo) only runs the web app's ESLint (backend has no `lint` script). It currently fails on pre-existing ESLint errors in `apps/web`; this is existing code, not an environment problem.
