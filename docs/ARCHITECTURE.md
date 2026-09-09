# Architecture

Health Signal is two programs sharing one SQLite file: a Python LangGraph
pipeline that produces the analysis, and a Next.js dashboard that presents
it. There is no API server between them - the database is the interface.

```
.
  main.py               Pipeline entry: runs the graph for the last 7 days
  fetch_live.py         Single-day run (called by the dashboard sync button)
  auth_garmin.py        Interactive Garmin login incl. MFA (Docker-friendly)
  check_garmin_status.py  Session validity probe for the dashboard
  src/
    graph/
      main.py           Graph builder: edges, fan-out/fan-in, compile
      state.py          HealthState TypedDict + Pydantic metric models
      nodes/
        data_ingest.py    Garmin auth, fetch, normalization, mock fallback
        health_analysis.py  The three experts + synthesizer (prompts live here)
        db_storage.py     Persist node
    utils/
      db.py             Schema, upsert, historical reads
      llm.py            DeepSeek client factory (OpenAI-compatible)
  web/                  Next.js 16 dashboard (App Router, React 19, Tailwind 4)
    src/lib/db.ts       Read-only better-sqlite3 access (server components only)
    src/lib/seed.ts     Sample-data seeder
    src/lib/mockData.ts Client-side demo fallback
    src/app/api/        Garmin login / status / sync routes (drive the Python side)
  Dockerfile, docker-compose.yml  Self-hosted deployment (:3067)
```

## The pipeline (LangGraph)

`START -> data_ingest -> {agent_sleep, agent_performance, agent_stress} ->
synthesizer -> db_storage -> END`

- **data_ingest** authenticates to Garmin Connect (cached OAuth tokens in
  `~/.garminconnect` first, email/password fallback, China accounts via
  `GARMINCONNECT_IS_CN`), fetches eight endpoint families for the target
  date - each wrapped so one failing endpoint degrades to an empty payload
  instead of failing the run - and normalizes everything into the Pydantic
  models in `state.py`. If login is impossible, it substitutes realistic
  mock data so the rest of the system is always exercisable.
- **The experts** run in parallel (LangGraph fan-out). Each builds a compact
  text context from its own metrics plus the last 7 days of history (read
  back from SQLite), applies a system prompt encoding clinical reference
  ranges (sleep architecture, readiness/HRV thresholds, stress and Body
  Battery bands), and returns strict JSON: `analysis` +
  `recommendations`. DeepSeek's `response_format: json_object` mode is
  enforced via `.bind()`.
- **synthesizer** receives only the three expert reports - not the raw
  metrics - finds agreement and conflict, prioritizes physiological safety
  over training targets, and emits a `HealthAnalysisSchema`
  (`summary`, `insights`, `recommendations`, `overall_score`), validated
  and coerced by Pydantic. A parse failure degrades to a marked fallback
  object rather than a crash.
- **db_storage** upserts by date: curated columns plus the raw Garmin
  payload as JSON. The raw copy is what makes prompt iteration cheap -
  reprocess history without touching Garmin. An append-only
  `health_events` table captures run history alongside the upserted
  current state.

## The council pattern, briefly

The point of the split is independence: each expert sees only its vertical,
so the stress analyst cannot anchor on the sleep score. Cross-domain
judgment belongs to one place - the synthesizer - which is the only node
that sees all three perspectives. Parallel execution also keeps wall time
at one expert round-trip instead of three.

## The dashboard

- Server components read SQLite through `better-sqlite3` opened
  **read-only**; the client never sees a connection or a query. The latest
  30 days of metrics and 10 days of insights are passed down as props.
- If the database is missing or empty, the UI offers a demo mode backed by
  `mockData.ts` so the design is always reviewable.
- Three API routes shell out to the Python side: Garmin login (with MFA
  flow), session status, and live sync (`fetch_live.py` via the project
  virtualenv). This keeps one writer (Python) and one reader (Next.js) for
  the database.

## Deployment

CI green on main triggers CD: Tailscale joins the runner to the private
network, SSH pulls the repo on the host and rebuilds the Docker service.
The compose service maps host port 3067 to the dashboard and mounts `.env`
and `./data` (the database) from the host. Health data never leaves the
owner's machine and Garmin's/DeepSeek's APIs.
