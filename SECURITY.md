# Security & Privacy Guidelines

This document outlines the security and privacy standards for the **Health Signal** project. Because this application handles sensitive personal health telemetry (Garmin data) and interacts with third-party AI APIs (DeepSeek), strict adherence to these guidelines is mandatory for all future code contributions.

## 1. Data Privacy & Git Tracking

- **Never Commit Personal Data:** The SQLite database (`src/health_data.db`) contains sensitive physiological data. It is explicitly ignored in `.gitignore`. **Do not track it or force add it.**
- **Never Commit Secrets:** API keys (DeepSeek) and credentials (Garmin) must strictly reside in the local `.env` file.
- **Use `.env.example`:** When adding new configuration variables, add placeholder values to `.env.example`. Do not put real credentials in `.env.example`.

## 2. Python Backend (Data Pipeline & LangGraph)

- **Environment Variables:** Always use `os.getenv('KEY')` to retrieve secrets. Do not hardcode any credentials, even temporarily for testing.
- **SQLite Injection Prevention:** 
  - Ensure any SQL queries executed via Python's `sqlite3` module use parameterized queries (e.g., `cursor.execute("SELECT * FROM table WHERE id = ?", (id,))`). 
  - Do not use f-strings or string concatenation to build raw SQL queries.
- **LLM Prompt Safety:**
  - The system sends health data to DeepSeek. Ensure no unintended PII (Personal Identifiable Information) outside of the explicitly required health metrics is ingested or sent to the LLM.
- **Dependency Management:** Use `uv` for package management. Periodically update your dependencies and check for vulnerabilities in your Python packages.

## 3. Next.js Frontend (Web Dashboard)

- **Secret Exposure Safety:** 
  - In Next.js, any environment variable prefixed with `NEXT_PUBLIC_` is bundled and exposed to the user's browser. **Never** prefix the DeepSeek API key, Garmin credentials, or database variables with `NEXT_PUBLIC_`.
- **Server Components & API Routes:**
  - Database reads using `better-sqlite3` must strictly happen in **Server Components** or **API Routes**. Never attempt to query or expose the direct database mechanism to Client Components (`"use client"`).
- **Path Traversal Protection:**
  - Ensure that the reading path to `src/health_data.db` is strictly defined on the server side and cannot be manipulated by user-provided inputs.
- **Dependency Management:** Run `npm audit` in the `web/` directory periodically to discover and mitigate vulnerable NPM packages.

## 4. Addressing Vulnerabilities

If you accidentally commit a sensitive database or an API key, **do not push to the remote repository**. Stop, use `git rm --cached <file>` to remove the tracking, and use `git commit --amend` to scrub the leak from your Git history before pushing.
