import logging
from datetime import datetime

from graph.state import HealthState
from utils.db import save_daily_record

logger = logging.getLogger(__name__)

def db_storage_node(state: HealthState) -> HealthState:
    """Save the health metrics and AI analysis to the local SQLite database."""
    logger.info("--- NODE: DB STORAGE ---")
    
    # Use the target_date from state, falling back to today if missing
    target_date = state.get("target_date") or datetime.now().strftime("%Y-%m-%d")
    
    save_daily_record(target_date, state)
    
    return state
