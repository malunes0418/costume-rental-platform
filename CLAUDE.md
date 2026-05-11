# 🎭 Costume Rental Platform - Claude Code Guide

## 🛠️ Build & Dev Commands
- **Install dependencies:** `npm install`
- **Start all development servers:** `npm run dev` (executes `turbo run dev` for all workspaces)
- **Database migrations:** `npm run migrate` (in `apps/backend`)
- **Undo migrations:** `npm run migrate:undo` or `npm run migrate:undo:all`
- **Build production apps:** `npm run build`

## 🧠 Engineering Team Skills

This repository uses a comprehensive suite of Engineering Team Skills to support development. These skills provide specialized tools, reference guides, and automation scripts for 18 different engineering roles tailored to our tech stack (Next.js, Node.js, Express, Sequelize, React Native, etc.).

The skills are stored locally in `.skills/engineering-team/`.

### Installation

If you need to install or update these skills globally for your AI agent (like Claude Code, Cursor, etc.), run:

```bash
# Install all engineering skills
npx ai-agent-skills install alirezarezvani/claude-skills/engineering-team

# Install to Claude Code specifically
npx ai-agent-skills install alirezarezvani/claude-skills/engineering-team --agent claude
```

### Overview of Available Skills

- **Core Engineering:** `senior-architect`, `senior-frontend`, `senior-backend`, `senior-fullstack`, `senior-qa`, `senior-devops`, `senior-secops`, `code-reviewer`, `senior-security`
- **Cloud & Enterprise:** `aws-solution-architect`, `ms365-tenant-manager`, `azure-cloud-architect`, `gcp-cloud-architect`
- **AI/ML/Data:** `senior-data-scientist`, `senior-data-engineer`, `senior-ml-engineer`, `senior-prompt-engineer`, `senior-computer-vision`
- **Security:** `adversarial-reviewer`, `threat-detection`, `incident-response`, `cloud-security`, `red-team`, `ai-security`
- **Other specialized skills:** `epic-design`, `a11y-audit`, `tdd-guide`, `tech-stack-evaluator`

### How to Use the Local Skills

Each skill typically contains:
1. `SKILL.md` - Main documentation and usage instructions.
2. `references/` - Detailed reference guides and best practices.
3. `scripts/` - Python automation scripts (e.g., project scaffolding, analysis).

To run an automation script, use Python. For example, to run the code quality analyzer:
```bash
python .skills/engineering-team/senior-fullstack/scripts/code_quality_analyzer.py ./
```

For comprehensive documentation, refer to:
- `.skills/engineering-team/README.md`
- `.skills/engineering-team/START_HERE.md`
- `.skills/engineering-team/CLAUDE.md`

## 📏 General Project Guidelines
- **TypeScript:** Use strict mode and provide explicit types for DTOs and models.
- **Frontend:** Next.js App Router, Tailwind CSS, functional components with Hooks.
- **Backend:** Express, clean architecture (Routes -> Controllers -> Services), Sequelize ORM.
- **Auth:** JWT and Google OAuth 2.0 via Passport.js.
