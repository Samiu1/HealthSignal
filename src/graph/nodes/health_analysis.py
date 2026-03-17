import json
import logging
import os
from typing import Dict, Any, List

from openai import OpenAI
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
    daily_metrics = state.get("daily_metrics")
    
    if not sleep_metrics:
        return {"sleep_analysis": "No sleep data available."}
        
    context_str = f"Sleep: {sleep_metrics.duration_hours:.1f} hrs (Score: {sleep_metrics.sleep_score})\n"
    context_str += f"Deep: {sleep_metrics.deep_sleep_hours:.1f} hrs, REM: {sleep_metrics.rem_sleep_hours:.1f} hrs, Awake: {sleep_metrics.awake_time_hours:.1f} hrs\n"
    
    if daily_metrics:
        context_str += f"Overnight HRV: {daily_metrics.hrv_avg_ms} ms, SpO2: {daily_metrics.spo2_percent}%\n"
        context_str += f"Respiration: {daily_metrics.respiration_bpm} bpm, Resting HR: {daily_metrics.resting_heart_rate} bpm\n"
    
    historical_metrics = state.get("historical_metrics", [])
    if historical_metrics:
        context_str += "\nHistorical Sleep Context (Last 7 Days):\n"
        for h in historical_metrics[:7]:
            sm = h.get("sleep_metrics", {})
            score = sm.get("sleep_score", "N/A") if sm else "N/A"
            dur = f"{sm.get('duration_hours', 0):.1f}h" if sm else "N/A"
            context_str += f"- {h['date']}: Score {score}, Duration {dur}\n"
            
    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are a chronobiology and recovery expert. Analyse sleep quality using the following clinical reference ranges:\n"
         "  - Total sleep: <6h = insufficient, 6–7h = borderline, 7–9h = optimal, >9h = excessive.\n"
         "  - Deep sleep (physical recovery): optimal is 1.5–2h (20–25% of total). <1h is a red flag.\n"
         "  - REM sleep (cognitive/emotional recovery): optimal is 1.5–2h (20–25% of total). <1h is a red flag.\n"
         "  - Combined deep + REM < 3h total warrants a flag regardless of total sleep duration.\n"
         "  - Sleep score: <60 = very poor, 60–69 = poor, 70–79 = fair, 80–89 = good, 90+ = excellent.\n"
         "  - HRV (overnight avg): >60ms = well recovered, 40–60ms = moderate, <40ms = high fatigue/stress.\n"
         "  - Resting HR: a value >5 bpm above personal baseline indicates inadequate recovery.\n"
         "  - SpO2: 95–100% is normal; <94% suggests respiratory disruption (flag for sleep apnea risk).\n"
         "  - Respiration rate during sleep: 12–20 bpm is normal. Outside this range is notable.\n"
         "Use these ranges explicitly in your analysis. Note any metric that falls outside a healthy range. "
         "Look at multi-day trends if available: is the user accumulating sleep debt or recovering well across the week? "
         "Conclude with a clear statement: is the user recovered enough for intense activity today?\n\n"
         "You MUST output ONLY valid JSON matching exactly this schema:\n"
         "{{\n"
         '  "analysis": "<Max 2 concise sentences of analysis explicitly citing key numbers>",\n'
         '  "recommendations": ["<Short actionable recommendation 1>", "<Short actionable recommendation 2>"]\n'
         "}}"
         ),
        ("human", "Here is the user's sleep data:\n{context}\nProvide your analysis in JSON.")
    ])
    
    llm = get_llm(model_name="deepseek-chat").bind(response_format={"type": "json_object"})
    chain = prompt | llm | StrOutputParser()
    result = chain.invoke({"context": context_str})
    
    return {"sleep_analysis": result}

def performance_agent_node(state: HealthState) -> Dict[str, Any]:
    logger.info("--- NODE: PERFORMANCE AGENT ---")
    activity_metrics = state.get("activity_metrics", [])
    readiness_metrics = state.get("readiness_metrics")
    daily_metrics = state.get("daily_metrics")
    
    context_str = ""
    if activity_metrics:
        context_str += f"Activities: {len(activity_metrics)} recorded.\n"
        for act in activity_metrics:
            dist_str = f", distance: {act.distance_km:.1f}km" if act.distance_km else ""
            context_str += f"  - {act.type}: {act.duration_minutes:.0f} mins{dist_str}, avg HR: {act.average_heart_rate}, max HR: {act.max_heart_rate}, {act.calories} kcals\n"
            
    if readiness_metrics:
        context_str += f"Training Load: {readiness_metrics.training_load}, Recovery Time: {readiness_metrics.recovery_time_hours} hrs, Readiness Score: {readiness_metrics.readiness_score}\n"
        
    if daily_metrics:
        context_str += f"Resting HR: {daily_metrics.resting_heart_rate} bpm, HRV: {daily_metrics.hrv_avg_ms} ms\n"
        
    if not context_str:
        return {"performance_analysis": "No activity or readiness data available."}
        
    historical_metrics = state.get("historical_metrics", [])
    if historical_metrics:
        context_str += "\nHistorical Readiness Context (Last 7 Days):\n"
        for h in historical_metrics[:7]:
            rm = h.get("readiness_metrics", {})
            dm = h.get("daily_metrics", {})
            r_score = rm.get("readiness_score", "N/A") if rm else "N/A"
            t_load = rm.get("training_load", "N/A") if rm else "N/A"
            rhr = dm.get("resting_heart_rate", "N/A") if dm else "N/A"
            context_str += f"- {h['date']}: Readiness {r_score}, Training Load {t_load}, Resting HR {rhr}\n"

    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are an elite athletic coach and sports scientist. Analyse performance and recovery using these reference ranges:\n"
         "  - Readiness score: <50 = avoid high-intensity, 50–69 = light activity only, 70–84 = moderate training OK, 85+ = full training/push day.\n"
         "  - Training load: assess relative to the 7-day trend. A spike >20% above the 7-day average risks overtraining.\n"
         "  - Recovery time: >48h recommended recovery time means no high-intensity session today.\n"
         "  - Resting HR: >5 bpm above personal norm = under-recovered. Rising trend over 3+ days = overtraining signal.\n"
         "  - HRV: <40ms = significant fatigue. Declining trend over 3 days = accumulated stress/overtraining.\n"
         "  - Zone 2 HR target: ~60–70% of max HR (rough estimate: 220 minus age). Good for aerobic base-building on recovery days.\n"
         "  - Calories burned: evaluate against workout duration for intensity estimation.\n"
         "Use these thresholds explicitly when assessing workout intensity and recovery capacity. "
         "Check for overtraining signals (elevated resting HR + low readiness + high training load). "
         "End with a specific, actionable recommendation: e.g., 'Rest day', 'Zone 2 run for 30–45 min', or 'High-intensity session OK'.\n\n"
         "You MUST output ONLY valid JSON matching exactly this schema:\n"
         "{{\n"
         '  "analysis": "<Max 2 concise sentences of analysis explicitly citing key numbers>",\n'
         '  "recommendations": ["<Short actionable recommendation 1>", "<Short actionable recommendation 2>"]\n'
         "}}"
         ),
        ("human", "Here is the user's performance data:\n{context}\nProvide your analysis in JSON.")
    ])
    
    llm = get_llm(model_name="deepseek-chat").bind(response_format={"type": "json_object"})
    chain = prompt | llm | StrOutputParser()
    result = chain.invoke({"context": context_str})
    
    return {"performance_analysis": result}

def stress_agent_node(state: HealthState) -> Dict[str, Any]:
    logger.info("--- NODE: STRESS AGENT ---")
    daily_metrics = state.get("daily_metrics")
    
    if not daily_metrics:
        return {"stress_analysis": "No daily stress/body battery data available."}
        
    context_str = (
        f"Daily Steps: {daily_metrics.steps}\n"
        f"Resting HR: {daily_metrics.resting_heart_rate} bpm\n"
        f"Avg Stress: {daily_metrics.stress_level}\n"
        f"Body Battery — High: {daily_metrics.body_battery_high}, Low: {daily_metrics.body_battery_low}, "
        f"Charge: {daily_metrics.body_battery_charge}, Drain: {daily_metrics.body_battery_drain}\n"
        f"HRV (overnight avg): {daily_metrics.hrv_avg_ms} ms\n"
        f"SpO2: {daily_metrics.spo2_percent}%\n"
        f"Respiration: {daily_metrics.respiration_bpm} bpm\n"
    )
    
    historical_metrics = state.get("historical_metrics", [])
    if historical_metrics:
        context_str += "\nHistorical Stress Context (Last 7 Days):\n"
        for h in historical_metrics[:7]:
            dm = h.get("daily_metrics", {})
            stress = dm.get("stress_level", "N/A") if dm else "N/A"
            bb_charge = dm.get("body_battery_charge", "N/A") if dm else "N/A"
            context_str += f"- {h['date']}: Avg Stress {stress}, BB Charge {bb_charge}\n"

    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are a physiological load and autonomic nervous system analyst. Evaluate stress and recovery using these clinical reference ranges:\n"
         "  - Garmin stress score (0–100): 0–25 = resting/low, 26–50 = low stress, 51–75 = medium stress, 76–100 = high stress. Daily average >50 is a concern.\n"
         "  - Body Battery (0–100): End-of-day battery <20 = critically depleted, 20–40 = low, 40–60 = moderate, 60+ = good reserve.\n"
         "  - Body Battery charge vs drain: charge < drain indicates the body is not recovering as fast as it's being depleted. Flag if this trend persists multiple days.\n"
         "  - HRV: >60ms = strong parasympathetic (recovery) tone, 40–60ms = moderate, <40ms = high sympathetic (stress) dominance.\n"
         "  - Resting HR: elevated above personal baseline by >5 bpm indicates physiological stress load.\n"
         "  - SpO2: <95% may indicate physiological stress or altitude-related effects.\n"
         "  - Respiration rate (resting): 12–20 bpm normal; elevated rate (>20) at rest may indicate anxiety or physiological load.\n"
         "  - Step count: <4,000 steps = largely sedentary day, 4,000–7,500 = low active, 7,500–10,000 = moderately active, 10,000+ = active.\n"
         "Use these ranges explicitly. Identify hidden stressors beyond exercise (poor sleep, illness, psychological stress) using HRV, resting HR, and stress score together. "
         "Look at 7-day stress trends to distinguish acute vs chronic stress. "
         "Flag any day where body battery ends critically low (<20) or HRV drops below 40ms.\n\n"
         "You MUST output ONLY valid JSON matching exactly this schema:\n"
         "{{\n"
         '  "analysis": "<Max 2 concise sentences of analysis explicitly citing key numbers>",\n'
         '  "recommendations": ["<Short actionable recommendation 1>", "<Short actionable recommendation 2>"]\n'
         "}}"
         ),
        ("human", "Here is the user's daily stress data:\n{context}\nProvide your analysis in JSON.")
    ])
    
    llm = get_llm(model_name="deepseek-chat").bind(response_format={"type": "json_object"})
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

    system_prompt = (
        "You are the Lead Health Synthesizer. You receive reports from the Sleep Specialist, Performance Coach, and Stress Analyst"
        " — each of whom has already applied clinical reference ranges in their analysis.\n"
        "Your job:\n"
        "  1. Identify where the three reports AGREE (e.g., all indicate poor recovery) and where they CONFLICT"
        " (e.g., readiness score says train, but HRV says rest).\n"
        "  2. When conflicts exist, prioritize physiological safety over performance targets. Recovery > training streak.\n"
        "  3. Produce a unified summary (Max 2 sentences), 2–3 prioritized short actionable insights, and 1-2 specific recommendations.\n"
        "  4. Assign an overall_score (1–100) using this rubric:\n"
        "       90–100: Excellent — all systems green, ideal day to push hard.\n"
        "       75–89:  Good — minor flags, moderate activity is fine.\n"
        "       55–74:  Fair — some recovery needed, light activity only.\n"
        "       40–54:  Poor — significant stress or fatigue; prioritise rest and recovery.\n"
        "       <40:    Critical — rest mandated; do not train. Flag for user attention.\n"
        "Be concise. Do not repeat the expert reports verbatim — synthesise and prioritise.\n\n"
        "You MUST respond with a valid JSON object matching EXACTLY this schema:\n"
        "{\n"
        '  "summary": "<2-3 sentence summary of the day\'s health>",\n'
        '  "insights": ["<insight 1>", "<insight 2>", "<insight 3>"],\n'
        '  "recommendations": ["<recommendation 1>", "<recommendation 2>"],\n'
        '  "overall_score": <integer 1-100>\n'
        "}"
    )

    fallback_analysis = {
        "summary": "Agent pipeline completed, but the final Synthesizer failed to format.",
        "insights": ["Check API logs for Synthesis step."],
        "recommendations": ["System error occurred — re-run pipeline."],
        "overall_score": 0,
    }

    try:

        client = OpenAI(
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url="https://api.deepseek.com",
        )

        logger.info("Calling Synthesizer LLM (json_object mode)...")
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Here are the reports from your experts:\n{context_str}\n\nPlease synthesize them into the final structured wellness briefing in JSON."},
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
        )

        raw_json = response.choices[0].message.content
        parsed = json.loads(raw_json)

        # Validate and coerce via Pydantic
        result = HealthAnalysisSchema(**parsed)
        analysis_data = result.model_dump()

        logger.info(f"Synthesis generated successfully. Score: {result.overall_score}")
        return {"analysis": analysis_data}

    except Exception as e:
        logger.error(f"Failed to perform health synthesis: {e}")
        return {"analysis": fallback_analysis}
