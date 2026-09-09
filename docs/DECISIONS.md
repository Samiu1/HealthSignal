# Decision log

The calls that shape Health Signal, with the tradeoff accepted for each and
the condition that should trigger a revisit.

## 1. Council of Experts instead of one big prompt

- **Decision:** three specialist agents (sleep, performance, stress)
  analyze in parallel; a separate synthesizer merges their reports.
- **Why:** a single prompt blends domains and anchors early conclusions;
  independent experts keep each vertical honest, and conflicts become
  visible instead of averaged away. The synthesizer is the one place
  cross-domain judgment lives, with an explicit rule: recovery over
  training streaks.
- **Tradeoff accepted:** 4+ LLM calls per day instead of one, and a
  synthesis step that can itself fail (it degrades to a marked fallback).
- **Revisit when:** per-call cost matters at the current daily cadence
  (unlikely), or expert outputs stop disagreeing usefully.

## 2. DeepSeek via the OpenAI-compatible API

- **Decision:** all agents call DeepSeek (`deepseek-chat`) through
  `langchain-openai`/the OpenAI client pointed at `api.deepseek.com`, using
  `json_object` response format for structured output.
- **Why:** capable reasoning at a fraction of frontier-model prices;
  structured output mode keeps downstream parsing deterministic.
- **Tradeoff accepted:** provider lock-in to DeepSeek's API shape and data
  handling - health metrics leave the machine to a third party, which is
  why [SECURITY.md](../SECURITY.md) restricts what may be sent.
- **Revisit when:** a privacy or quality requirement outgrows DeepSeek;
  the `get_llm` factory is the single swap point.

## 3. The database is the interface

- **Decision:** one SQLite file, one writer (the Python pipeline), one
  reader (the Next.js dashboard, opened read-only). No API server.
- **Why:** for a single-user system a service layer is pure overhead; the
  upsert-by-date table plus the raw payload column covers both display and
  reprocessing.
- **Tradeoff accepted:** pipeline and dashboard must share a filesystem;
  no remote dashboard, no multi-user.
- **Revisit when:** a second user or a remote client appears; that is when
  a real API earns its place.

## 4. Keep the raw Garmin payload next to the curated analysis

- **Decision:** every row stores both the structured metrics and the
  untouched Garmin JSON.
- **Why:** prompts improve over time; with the raw payload kept,
  reprocessing history costs zero Garmin calls and zero rate-limit risk.
- **Tradeoff accepted:** the database holds the most sensitive data twice;
  it is gitignored and host-local by rule ([SECURITY.md](../SECURITY.md)).
- **Revisit when:** storage or retention policy changes.

## 5. Mock data as a first-class fallback

- **Decision:** if Garmin auth fails or credentials are absent, the
  pipeline runs on realistic mock data; the dashboard has its own demo
  fallback too.
- **Why:** development, CI, and demos must never depend on Garmin's
  availability or on sharing credentials.
- **Tradeoff accepted:** a silently broken login can look like a healthy
  run; the log line is currently the only tell.
- **Revisit when:** the product gains users who don't read logs - the
  fallback should become visible in the UI.

## 6. Local-first, self-hosted, Tailscale-deployed

- **Decision:** the production target is the owner's own machine via Docker
  Compose; CD reaches it over a Tailscale network.
- **Why:** health data stays on owned hardware; no public ingress, no
  auth system to build or breach.
- **Tradeoff accepted:** no access away from the Tailnet, single point of
  failure, owner-operated updates.
- **Revisit when:** anyone besides the owner needs access.

## 7. Strict Pydantic models at the ingest boundary

- **Decision:** Garmin's payloads are normalized into typed models
  (`DailyMetrics`, `SleepMetrics`, `ActivityMetrics`, `ReadinessMetrics`)
  before any agent sees them ("parse, don't validate").
- **Why:** LLMs and storage never receive malformed shapes; field
  weirdness is resolved in exactly one file.
- **Tradeoff accepted:** Garmin schema drift zeroes fields silently (see
  the open testing gap in [EVALUATIONS.md](EVALUATIONS.md)).
- **Revisit when:** normalization tests exist; then drift fails loudly.
