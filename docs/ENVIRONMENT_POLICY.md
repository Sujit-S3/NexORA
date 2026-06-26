# Environment Protection Policy

## 1. Overview
Environment files (`.env`, `.env.local`) contain sensitive user-owned secrets, credentials, and API keys. These files are strictly excluded from version control (`.gitignore`).

## 2. Mandatory Safeguards
To ensure that environment variables are never accidentally destroyed, exposed, or leaked, the following policies apply to all developers, automated tools, and AI agents operating within this repository:

1. **No Automatic Overwrites:** Commands that automatically overwrite environment files (e.g., `copy .env.example .env`, `cp .env.example .env`, `mv .env.example .env`) are **strictly prohibited**.
2. **Read-Only Treatment:** If an environment file exists (`.env` or `.env.local`), it must be treated as **read-only** by automated systems. They must never be modified, replaced, or deleted automatically.
3. **Missing Files:** If a required environment file is missing, any automated build or test process must **stop immediately** and report the exact missing file. Placeholders must not be generated.
4. **Secret Exposure Prevention:** Before any build or deployment, scripts may verify the *presence* of required environment variables, but they must **never print, log, export, or expose the secret values**.
5. **Backups:** Before making manual modifications to project configuration, explicit timestamped backups must be created (e.g., `.env.backup.<timestamp>`), and only with explicit approval.

This policy is permanent and mandatory for all future maintenance, testing, and deployment workflows.
