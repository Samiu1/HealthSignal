# Verification and evaluations

What is checked, where, and - just as important - what is not checked yet.

## What CI checks today (`.github/workflows/ci.yml`)

| Check | Job | What it proves |
|-------|-----|----------------|
| `ruff check .` | backend-checks | Backend lints clean |
| `pytest test_llm.py` | backend-checks | The DeepSeek client can authenticate and complete a call |
| `npm run lint` | frontend-checks | Dashboard lints clean |
| `npm run build` | frontend-checks | Dashboard compiles for production |

A green CI on main triggers the CD deploy (Tailscale + SSH +
`docker compose up -d --build`), so lint/build health gates every release.

## Honest gaps

1. **`test_llm.py` cannot fail the build.** `test_deepseek()` catches every
   exception and returns `False`; pytest does not treat a returned `False`
   as a failure. It is a connectivity probe whose failures only appear in
   logs. Fix: assert on the response, or drop it in favor of a mocked
   client test.
2. **No behavioral evals on the analysis.** The product's core promise is
   judgment quality - did the sleep expert flag the sub-6h night, did the
   synthesizer prioritize recovery over the training streak. Nothing
   measures that today.
3. **No tests around normalization.** `data_ingest` maps Garmin's payload
   zoo into Pydantic models; a Garmin schema change would surface only as
   silently zeroed metrics.
4. **The dashboard's read path is untested.** JSON column parsing has
   fallbacks that can mask corruption.

## The eval layer worth building

Following the structural-first philosophy: before any LLM judge, pin the
behaviors a user actually depends on with deterministic checks against
recorded fixtures:

- Given a fixture day with 5.5h sleep and deep+REM under 3h, the sleep
  expert's JSON must flag insufficiency.
- Given readiness 85 but HRV trending down 3 days, the synthesizer must
  not recommend high intensity.
- Every `overall_score` must parse as an integer 1-100 (schema holds).
- A day where Garmin 403s must still produce a complete (mock-sourced)
  record, visibly marked.

Fixture days can be captured from `raw_data` already stored by
`db_storage` - no Garmin access needed to run the suite.

## Manual validation today

- `uv run python main.py` end-to-end against real Garmin data (owner-run).
- Dashboard review against seeded data:
  `node --experimental-strip-types src/lib/seed.ts` from `web/`
  (Node 22; plain `node` on 23.6+), then `npm run dev`.
