# Environment Protection Policy

## 1. Agent Behavior Constraints
Agents working in this repository MUST adhere to the following rules regarding environment variables:

- **Never execute commands that overwrite `.env` files.** This includes `copy .env.example .env`, `cp`, `mv`, or equivalent commands in any shell.
- **Treat existing `.env` and `.env.local` files as read-only.**
- **Never modify, replace, or delete existing environment files automatically.**
- **If an environment file is missing**, stop immediately, report exactly which file is missing, and wait for user action. Do not generate placeholder values or overwrite anything.
- **Verify required environment variables before builds or deployments.** Report only whether they are present or missing. **Never print, log, export, or expose secret values.**
- **Create backups before modifying project configuration** (e.g., `.env.backup.timestamp` or `.env.local.backup.timestamp`), and **only do so if the user explicitly approves.**

By adhering to these rules, we ensure that user-owned secrets are never accidentally destroyed or exposed.
