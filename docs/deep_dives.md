# Logic Deep-Dives

## 1. The Processing Pipeline (LangGraph)

### `data_ingest_node`
- **One Job**: Fetch and clean.
- **State Interaction**: Populates the first half of `HealthState` (`daily_metrics`, `sleep_metrics`, etc.).
- **Gotchas**:
    - **Credential Decay**: Garmin Connect sessions expire. The node implements a "Refresh or Fallback" logic using local `TOKEN_DIR`.
    - **Missing Support**: Some Garmin devices don't support `ReadinessMetrics`. The ingest node must handle empty responses for these fields without crashing.

### `health_analysis_node`
- **One Job**: Data correlation & Insight generation.
- **State Interaction**: Reads all metrics and populates the `analysis` dictionary.
- **Gotchas**:
    - **Context Limits**: We avoid sending raw Garmin JSON (often 50kb+) to the LLM. We first map to structured Pydantic models to reduce token costs and noise.
    - **Prompt Fragility**: The LLM must return structured output (JSON). We use LangChain's `.with_structured_output` to enforce the schema.

---

## 2. Persistence Layer (SQLite)

### Schema Design
The database uses a single table `daily_health` with a `date` index.
- **Philosophy**: We store both the curated AI analysis AND the raw JSON payload.
- **Rationale**: If the AI model improves or the prompt changes, we can re-process historical data without needing to re-fetch from the Garmin API.

### State & Data Interaction
Frontends use **Read-Only Connections** by default to prevent accidental data corruption during dashboarding.

---

## 3. The "Gotchas" & Trade-offs

### Python vs. TypeScript Dualism
- **Trade-off**: Maintains two sets of DB logic (`utils/db.py` and `lib/db.ts`).
- **Rationale**: Better DX for both Streamlit developers and Next.js developers.
- **Risk**: Schema changes must be manually synced across both paradigms.

### Mock Data Strategy
- **Logic**: If the Garmin login fails or credentials are missing, the system injects `get_mock_data()`.
- **Warning**: This ensures the pipeline always "works" for demos, but developers must check logs to see if they are viewing real or synthetic data.
