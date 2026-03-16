from typing import TypedDict, List, Optional, Any, Dict
from pydantic import BaseModel, Field

class DailyMetrics(BaseModel):
    steps: int = 0
    resting_heart_rate: int = 0
    active_calories: int = 0
    stress_level: int = 0
    body_battery_high: int = 0
    body_battery_low: int = 0
    body_battery_charge: int = 0
    body_battery_drain: int = 0
    respiration_bpm: Optional[float] = None
    spo2_percent: Optional[float] = None
    hrv_avg_ms: Optional[float] = None
    vo2_max: Optional[int] = None

class SleepMetrics(BaseModel):
    duration_hours: float = 0.0
    sleep_score: int = 0
    deep_sleep_hours: float = 0.0
    rem_sleep_hours: float = 0.0
    awake_time_hours: float = 0.0

class ActivityMetrics(BaseModel):
    type: str = "unknown"
    duration_minutes: float = 0.0
    distance_km: Optional[float] = None
    average_heart_rate: Optional[int] = None
    max_heart_rate: Optional[int] = None
    calories: Optional[int] = None

class ReadinessMetrics(BaseModel):
    readiness_score: int = 0
    recovery_time_hours: int = 0
    training_load: int = 0

class HealthState(TypedDict):
    """The state dictionary for our LangGraph workflow."""
    target_date: Optional[str]
    daily_metrics: Optional[DailyMetrics]
    sleep_metrics: Optional[SleepMetrics]
    activity_metrics: List[ActivityMetrics]
    readiness_metrics: Optional[ReadinessMetrics]
    raw_garmin_data: Dict[str, Any]
    
    # Agent Scratchpads
    sleep_analysis: str
    performance_analysis: str
    stress_analysis: str
    
    # Final Structured Output
    analysis: Dict[str, Any]
