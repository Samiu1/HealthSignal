import logging
from langgraph.graph import StateGraph, START, END

from graph.state import HealthState
from graph.nodes.data_ingest import data_ingest_node
from graph.nodes.health_analysis import (
    sleep_agent_node,
    performance_agent_node,
    stress_agent_node,
    synthesizer_agent_node
)
from graph.nodes.db_storage import db_storage_node
from utils.db import init_db

logger = logging.getLogger(__name__)

def build_graph():
    """Constructs and compiles the overall LangGraph workflow with a Council of Experts."""
    
    # 1. Initialize DB so it's ready for storage node
    init_db()

    # 2. Define the graph with our state schema
    workflow = StateGraph(HealthState)

    # 3. Add Nodes
    workflow.add_node("data_ingest", data_ingest_node)
    
    # Council of Experts Nodes (Parallel)
    workflow.add_node("agent_sleep", sleep_agent_node)
    workflow.add_node("agent_performance", performance_agent_node)
    workflow.add_node("agent_stress", stress_agent_node)
    
    # Synthesis & Storage
    workflow.add_node("synthesizer", synthesizer_agent_node)
    workflow.add_node("db_storage", db_storage_node)

    # 4. Define Edges
    workflow.add_edge(START, "data_ingest")
    
    # Fan-out: Data ingest triggers all three experts in parallel
    workflow.add_edge("data_ingest", "agent_sleep")
    workflow.add_edge("data_ingest", "agent_performance")
    workflow.add_edge("data_ingest", "agent_stress")
    
    # Fan-in: Synthesizer waits for all three experts to finish
    workflow.add_edge("agent_sleep", "synthesizer")
    workflow.add_edge("agent_performance", "synthesizer")
    workflow.add_edge("agent_stress", "synthesizer")
    
    # Final steps
    workflow.add_edge("synthesizer", "db_storage")
    workflow.add_edge("db_storage", END)
    # 5. Compile the app
    app = workflow.compile()
    logger.info("LangGraph pipeline compiled successfully.")
    
    return app
