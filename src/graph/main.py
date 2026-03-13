import logging
from langgraph.graph import StateGraph, START, END

from graph.state import HealthState
from graph.nodes.data_ingest import data_ingest_node
from graph.nodes.health_analysis import health_analysis_node
from graph.nodes.db_storage import db_storage_node
from utils.db import init_db

logger = logging.getLogger(__name__)

def build_graph():
    """Constructs and compiles the overall LangGraph workflow."""
    
    # 1. Initialize DB so it's ready for storage node
    init_db()

    # 2. Define the graph with our state schema
    workflow = StateGraph(HealthState)

    # 3. Add Nodes
    workflow.add_node("data_ingest", data_ingest_node)
    workflow.add_node("health_analysis", health_analysis_node)
    workflow.add_node("db_storage", db_storage_node)

    # 4. Add Edges (Linear Flow)
    workflow.add_edge(START, "data_ingest")
    workflow.add_edge("data_ingest", "health_analysis")
    workflow.add_edge("health_analysis", "db_storage")
    workflow.add_edge("db_storage", END)

    # 5. Compile the app
    app = workflow.compile()
    logger.info("LangGraph pipeline compiled successfully.")
    
    return app
