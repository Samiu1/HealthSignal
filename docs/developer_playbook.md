# The Developer Playbook

## 60-Second Onboarding

1.  **Clone & Install**:
    ```bash
    pip install -r requirements.txt
    cd web && npm install
    ```
2.  **Env Config**: Create a `.env` in the root with your Garmin credentials:
    ```env
    GARMIN_EMAIL="your@email.com"
    GARMIN_PASSWORD="yourpassword"
    ANTHROPIC_API_KEY="sk-ant-..."
    ```
3.  **Run Pipeline**:
    ```bash
    python src/main.py  # Ingests today's data and performs AI analysis
    ```
4.  **View UI**:
    ```bash
    streamlit run src/app.py  # Python internal view
    # OR
    cd web && npm run dev     # Polished Next.js view
    ```

---

## Coding Standards

### Python (The Backend)
- **Formatting**: Use Black/Ruff. 
- **Typing**: Every function in `src/` MUST have type hints. LangGraph nodes MUST follow the `(state: HealthState) -> HealthState` signature.
- **Errors**: Don't let processing nodes fail silently. Return a "Safe Error State" (documented in `graph/nodes/health_analysis.py`).

### TypeScript (The Frontend)
- **Components**: Use Radix-based primitives (configured in `web/components`).
- **Data Hooking**: Prefer Server Components for fetching health data to keep the client bundle light.

---

## Common Recipes

### Adding a New Node to the Pipeline
1.  **Define Logic**: Create a new file in `src/graph/nodes/my_new_node.py`.
2.  **Define Signature**: `def my_new_node(state: HealthState) -> HealthState`.
3.  **Register Work**: Update the `StateGraph` builder in `src/graph/builder.py` (or wherever the graph is constructed).

### Updating the Data Schema
1.  **Python**: Update `src/graph/state.py` (Pydantic models).
2.  **Database**: Update `src/utils/db.py` (`init_db` and `save_daily_record`).
3.  **Frontend**: Update `web/src/lib/db.ts` to match the new fields.

---

## Troubleshooting
- **Garmin 403**: Usually means MFA is required. The library should prompt for a code on the first run, or check if `TOKEN_DIR` has valid tokens.
- **LLM Output Mismatch**: If Claude starts returning weird JSON, check `src/graph/nodes/health_analysis.py` and update the `HealthAnalysisSchema` or the system prompt.
