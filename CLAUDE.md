# 🎭 Costume Rental Platform - Claude Code Guide

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
