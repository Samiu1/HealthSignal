# Health Signal: The Mental Model

## Mission Statement
**Health Signal** exists to bridge the gap between raw wearable data and actionable lifestyle intelligence. The primary problem it solves is the "data fatigue" common in modern wearables: users have plenty of metrics (steps, heart rate, sleep) but lack a synthesized understanding of how these metrics correlate to overall readiness and recovery. By leveraging AI (DeepSeek) and structured workflows (LangGraph), Health Signal transforms Garmin Connect data into a clear, daily wellness signal.

## The "Golden Path"
The typical journey of health data follows a strict, linear pipeline ensuring reliability and traceability:

1.  **Ingestion**: The `data_ingest` node triggers a login to Garmin Connect, fetches raw metrics for a specific date, and maps them to structured Pydantic models.
2.  **Council of Experts**: Instead of a single analysis, data is processed in parallel by specialized AI agents:
    - **`agent_sleep`**: Analyzes cycles, REM, and deep sleep quality.
    - **`agent_performance`**: Correlates load, RHR, and activity levels.
    - **`agent_stress`**: Evaluates autonomic nervous system balance and HRV.
3.  **Synthesis**: The `synthesizer` node takes the multi-expert perspectives and builds a unified Wellness Report.
4.  **Storage**: The `db_storage` node records the raw data, structured metrics, and the synthesized report into a local SQLite database (`src/health_data.db`).
5.  **Presentation**: The user accesses these insights via a polished **Next.js Dashboard** built with a Japandi minimalist aesthetic.

## Architectural Patterns

### 1. LangGraph State Machines (Council of Experts)
The core engine is built on **LangGraph**.
- **Rationale**: Health data processing is complex and multi-faceted. We use a "Council of Experts" pattern where specialized agents analyze data in parallel before being synthesized by a master agent. This ensures deep, domain-specific insights for every health vertical.

### 2. Japandi Design Philosophy
The Next.js frontend follows a **Japandi** (Japanese + Scandinavian) aesthetic.
- **Rationale**: Health data can be stressful. We use a palette of warm neutrals, clean lines, and high-contrast typography to create a sense of calm and clarity. The UI prioritizes negative space and high-craft typography to prevent information overload.

### 3. Clean Data Layer
We use **Pydantic** for all internal data models.
- **Rationale**: By enforcing strict schemas at the entry point (`DailyMetrics`, `SleepMetrics`), we ensure that the LLM and DB layers never receive malformed data. This "Parse, Don't Validate" approach reduces runtime bugs significantly.
