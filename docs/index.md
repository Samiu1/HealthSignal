# Health Signal: The Mental Model

## Mission Statement
**Health Signal** exists to bridge the gap between raw wearable data and actionable lifestyle intelligence. The primary problem it solves is the "data fatigue" common in modern wearables: users have plenty of metrics (steps, heart rate, sleep) but lack a synthesized understanding of how these metrics correlate to overall readiness and recovery. By leveraging AI (Claude 3.5 Sonnet) and structured workflows (LangGraph), Health Signal transforms Garmin Connect data into a clear, daily wellness signal.

## The "Golden Path"
The typical journey of health data follows a strict, linear pipeline ensuring reliability and traceability:

1.  **Ingestion**: The `data_ingest_node` triggers a login to Garmin Connect, fetches raw metrics for a specific date, and maps them to structured Pydantic models.
2.  **Analysis**: The `health_analysis_node` takes these structured models and pipes them through Claude 3.5 Sonnet. The LLM correlates sleep, stress, and activity to generate a synthesized "wellness payload."
3.  **Storage**: The `db_storage_node` records the raw data, the structured metrics, and the AI's insights into a local SQLite database (`health_data.db`).
4.  **Presentation**: The user accesses these insights via a **Streamlit Dashboard** (internal/analysis focus) or a **Next.js Web Interface** (presentation/consumer focus).

## Architectural Patterns

### 1. LangGraph State Machines
The core engine is built on **LangGraph**.
- **Rationale**: Health data processing is inherently sequential but requires complex "checkpoints." LangGraph allows us to define the pipeline as a series of nodes with a shared, persistent state (`HealthState`). This makes the system resilient, traceable, and easily extensible (e.g., adding a "Notification" node).

### 2. Clean Data Layer
We use **Pydantic** for all internal data models.
- **Rationale**: By enforcing strict schemas at the entry point (`DailyMetrics`, `SleepMetrics`), we ensure that the LLM and DB layers never receive malformed data. This "Parse, Don't Validate" approach reduces runtime bugs significantly.

### 3. Dual-Stack Presentation
The project maintains both **Streamlit** (Python) and **Next.js** (TypeScript/React) frontends.
- **Rationale**:
    - **Streamlit**: Provides a rapid-prototyping environment for data exploration and internal debugging.
    - **Next.js**: Serves as the high-performance, polished interface for the end-user.
    - Both share the same SQLite source of truth, decoupled via simple internal libraries.
