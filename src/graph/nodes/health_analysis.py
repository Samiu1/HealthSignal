import logging
from typing import Dict, Any, List

from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

from graph.state import HealthState
from utils.llm import get_llm

logger = logging.getLogger(__name__)

# Define the structured output schema we expect from Claude.
class HealthAnalysisSchema(BaseModel):
    summary: str = Field(description="A concise 2-3 sentence summary of the user's health metrics for the day.")
    insights: List[str] = Field(description="2-3 actionable insights derived from the data correlation.")
    recommendations: List[str] = Field(description="Specific, actionable recommendations to improve health or recovery.")
    overall_score: int = Field(description="A 1-100 score indicating overall daily wellness based on sleep, stress, and activity.")

def health_analysis_node(state: HealthState) -> HealthState:
    """Analyze health metrics using Claude 3.5 Sonnet to generate an insights payload."""
    logger.info("--- NODE: HEALTH ANALYSIS ---")
    
    # Extract metrics using their Pydantic dict representation or defaults if missing.
    daily_metrics = state.get("daily_metrics")
    sleep_metrics = state.get("sleep_metrics")
    activity_metrics = state.get("activity_metrics", [])
    readiness_metrics = state.get("readiness_metrics")
    
    # Format a human-readable summary for the LLM
    context_str = "User Health Data:\n"
    if daily_metrics:
        context_str += f"- Daily: {daily_metrics.steps} steps, {daily_metrics.resting_heart_rate} RHR, {daily_metrics.stress_level} avg stress\n"
        context_str += f"- Body Battery: Low {daily_metrics.body_battery_low}, High {daily_metrics.body_battery_high}\n"
    if sleep_metrics:
        context_str += f"- Sleep: {sleep_metrics.duration_hours:.1f} hrs (Score: {sleep_metrics.sleep_score}), Deep: {sleep_metrics.deep_sleep_hours:.1f} hrs, REM: {sleep_metrics.rem_sleep_hours:.1f} hrs\n"
    if activity_metrics:
        context_str += f"- Activities: {len(activity_metrics)} recorded.\n"
        for act in activity_metrics:
            context_str += f"  - {act.type}: {act.duration_minutes:.0f} mins, max HR {act.max_heart_rate}, {act.calories} kcals\n"
    if readiness_metrics:
        context_str += f"- Training Load: {readiness_metrics.training_load}, Recovery Time: {readiness_metrics.recovery_time_hours} hrs, Readiness Score: {readiness_metrics.readiness_score}\n"
        
    logger.debug(f"Prompt Context:\n{context_str}")

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert AI health and fitness coach. Your task is to analyze the user's wearable data and provide structured insights. Your responses should be encouraging, scientifically grounded, and highly actionable."),
        ("human", "Here is my health data for from the last 7 days:\n{context}\n\nPlease analyze this data carefully and extract the summary, insights, recommendations, and an overall wellness score (1-100).")
    ])

    try:
        llm = get_llm()
        # Bind the Pydantic schema for structured output extraction
        structured_llm = llm.with_structured_output(HealthAnalysisSchema)
        chain = prompt | structured_llm
        
        logger.info("Calling Claude 3.5 Sonnet structure LLM...")
        result: HealthAnalysisSchema = chain.invoke({"context": context_str})
        
        analysis_data = {
            "summary": result.summary,
            "insights": result.insights,
            "recommendations": result.recommendations,
            "overall_score": result.overall_score
        }
        
        logger.info(f"Health analysis generated successfully. Score: {result.overall_score}")
        return {**state, "analysis": analysis_data}
        
    except Exception as e:
        logger.error(f"Failed to perform health analysis: {e}")
        # Return fallback analysis
        fallback_analysis = {
            "summary": "Data ingestion successful, but the AI analysis failed.",
            "insights": ["Check API keys and LLM connection logs."],
            "recommendations": ["System error occurred."],
            "overall_score": 0
        }
        return {**state, "analysis": fallback_analysis}
