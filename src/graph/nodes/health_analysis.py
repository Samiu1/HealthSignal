import logging
from typing import Dict, Any, List

from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from graph.state import HealthState
from utils.llm import get_llm

logger = logging.getLogger(__name__)

# Structured output schema for the Synthesizer
class HealthAnalysisSchema(BaseModel):
    summary: str = Field(description="A concise 2-3 sentence summary of the user's health metrics for the day.")
    insights: List[str] = Field(description="2-3 actionable insights derived from the data correlation.")
    recommendations: List[str] = Field(description="Specific, actionable recommendations to improve health or recovery.")
    overall_score: int = Field(description="A 1-100 score indicating overall daily wellness based on sleep, stress, and activity.")

def sleep_agent_node(state: HealthState) -> Dict[str, Any]:
    logger.info("--- NODE: SLEEP AGENT ---")
    sleep_metrics = state.get("sleep_metrics")
    
    if not sleep_metrics:
        return {"sleep_analysis": "No sleep data available."}
        
    context_str = f"Sleep: {sleep_metrics.duration_hours:.1f} hrs (Score: {sleep_metrics.sleep_score}), " \
                  f"Deep: {sleep_metrics.deep_sleep_hours:.1f} hrs, REM: {sleep_metrics.rem_sleep_hours:.1f} hrs"
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a chronobiology and recovery expert. Look at the balance of REM (mental recovery) vs Deep Sleep (physical recovery). Is the user recovered enough for intense activity today?"),
        ("human", "Here is the user's sleep data:\n{context}\nProvide your analysis.")
    ])
    
    llm = get_llm()
    chain = prompt | llm | StrOutputParser()
    result = chain.invoke({"context": context_str})
    
    return {"sleep_analysis": result}

def performance_agent_node(state: HealthState) -> Dict[str, Any]:
    logger.info("--- NODE: PERFORMANCE AGENT ---")
    activity_metrics = state.get("activity_metrics", [])
    readiness_metrics = state.get("readiness_metrics")
    
    context_str = ""
    if activity_metrics:
        context_str += f"Activities: {len(activity_metrics)} recorded.\n"
        for act in activity_metrics:
            context_str += f"  - {act.type}: {act.duration_minutes:.0f} mins, max HR {act.max_heart_rate}, {act.calories} kcals\n"
    if readiness_metrics:
        context_str += f"Training Load: {readiness_metrics.training_load}, Recovery Time: {readiness_metrics.recovery_time_hours} hrs, Readiness Score: {readiness_metrics.readiness_score}\n"
        
    if not context_str:
        return {"performance_analysis": "No activity or readiness data available."}
        
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an elite athletic coach. Critique recent workouts and training load. Provide a recommendation for today's activity level (e.g., Take a rest day, or Do a Zone 2 run)."),
        ("human", "Here is the user's performance data:\n{context}\nProvide your analysis.")
    ])
    
    llm = get_llm()
    chain = prompt | llm | StrOutputParser()
    result = chain.invoke({"context": context_str})
    
    return {"performance_analysis": result}

def stress_agent_node(state: HealthState) -> Dict[str, Any]:
    logger.info("--- NODE: STRESS AGENT ---")
    daily_metrics = state.get("daily_metrics")
    
    if not daily_metrics:
        return {"stress_analysis": "No daily stress/body battery data available."}
        
    context_str = f"Daily Steps: {daily_metrics.steps}, Resting HR: {daily_metrics.resting_heart_rate}, Avg Stress: {daily_metrics.stress_level}\n"
    context_str += f"Body Battery: High {daily_metrics.body_battery_high}, Low {daily_metrics.body_battery_low}"
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a physiological load analyst. Look at the Body Battery depletion, stress levels, and resting HR. Identify hidden stressors and non-exercise fatigue."),
        ("human", "Here is the user's daily stress data:\n{context}\nProvide your analysis.")
    ])
    
    llm = get_llm()
    chain = prompt | llm | StrOutputParser()
    result = chain.invoke({"context": context_str})
    
    return {"stress_analysis": result}

def synthesizer_agent_node(state: HealthState) -> Dict[str, Any]:
    logger.info("--- NODE: SYNTHESIZER AGENT ---")
    
    sleep_ana = state.get("sleep_analysis", "")
    perf_ana = state.get("performance_analysis", "")
    stress_ana = state.get("stress_analysis", "")
    
    context_str = f"--- SLEEP EXPERT ANALYSIS ---\n{sleep_ana}\n\n"
    context_str += f"--- PERFORMANCE COACH ANALYSIS ---\n{perf_ana}\n\n"
    context_str += f"--- STRESS ANALYST ANALYSIS ---\n{stress_ana}\n"
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are the Lead Health Synthesizer. You receive reports from the Sleep Specialist, Performance Coach, and Stress Analyst. Your job is to resolve conflicting advice, prioritize the user's overall health and recovery over simple training streaks, and formulate a unified daily wellness briefing.\n\nYou MUST output your response as a valid JSON object with the following keys:\n- summary: A concise 2-3 sentence summary.\n- insights: A list of 2-3 actionable insights.\n- recommendations: A list of specific actionable recommendations.\n- overall_score: An integer from 1-100.\n\nOnly output the JSON object, do not include any other text."),
        ("human", "Here are the reports from your experts:\n{context}\n\nPlease synthesize them into the final structured wellness briefing.")
    ])
    
    try:
        llm = get_llm(model_name="deepseek-chat")
        chain = prompt | llm | StrOutputParser()
        
        logger.info("Calling Synthesizer LLM...")
        raw_result = chain.invoke({"context": context_str})
        
        # Clean up the string if needed (some models add markdown blocks)
        if "```json" in raw_result:
            raw_result = raw_result.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_result:
            raw_result = raw_result.split("```")[1].split("```")[0].strip()
        
        import json
        result = json.loads(raw_result)
        
        analysis_data = {
            "summary": result.get("summary", ""),
            "insights": result.get("insights", []),
            "recommendations": result.get("recommendations", []),
            "overall_score": result.get("overall_score", 0)
        }
        
        logger.info(f"Synthesis generated successfully. Score: {result.get('overall_score')}")
        return {"analysis": analysis_data}
        
    except Exception as e:
        logger.error(f"Failed to perform health synthesis: {e}")
        fallback_analysis = {
            "summary": "Agent pipeline completed, but the final Synthesizer failed to format.",
            "insights": ["Check API logs for Synthesis step."],
            "recommendations": ["System error occurred."],
            "overall_score": 0
        }
        return {"analysis": fallback_analysis}
