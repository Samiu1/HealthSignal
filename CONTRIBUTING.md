# Contributing

Read [SECURITY.md](SECURITY.md) first. It is short and mandatory: health
data and credentials never enter git, and database access rules are not
negotiable.

## Dev setup

```bash
cp .env.example .env        # DEEPSEEK_API_KEY required; Garmin optional
uv sync                     # backend deps
uv run python main.py       # run the pipeline (last 7 days)
cd web && npm ci && npm run dev   # dashboard on :3000
```

No Garmin account? The pipeline falls back to mock data automatically. To
preview the dashboard without running the pipeline, seed sample rows from
`web/`: `node --experimental-strip-types src/lib/seed.ts` (Node 22; plain
`node` on 23.6+).

## Project structure

```
main.py, fetch_live.py    Pipeline entry points (7-day backfill / today)
auth_garmin.py            Interactive Garmin login incl. MFA
src/graph/                LangGraph: state, nodes (ingest, experts, synth, storage)
src/utils/                db.py (schema + upsert), llm.py (DeepSeek factory)
web/                      Next.js 16 dashboard (read-only DB access)
docs/                     Architecture, evaluations, decisions, deep wiki
```

## Conventions

- **One writer, one reader.** Only Python writes to SQLite; the dashboard
  opens it read-only, in server components only. Never query the DB from a
  client component.
- **Prompts live in the nodes.** Expert and synthesizer prompts are in
  `src/graph/nodes/health_analysis.py`; clinical reference ranges belong in
  the prompts, not in post-processing.
- **Endpoints fail independently.** A failing Garmin endpoint degrades to
  an empty payload; it must not fail the run.
- **Secrets via `os.getenv` only**; placeholders go in `.env.example`.
- **Parameterized SQL only** (see SECURITY.md).
- `uv` for Python deps, `npm` (with `package-lock.json`) for the web app.

## Verification checklist

- `uv run ruff check .` passes
- `cd web && npm run lint && npm run build` passes
- `uv run python main.py` completes a full 7-day run (mock data is fine)
- Dashboard renders the run's output
