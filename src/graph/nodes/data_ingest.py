import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from garminconnect import (
    Garmin,
    GarminConnectAuthenticationError,
)
from garth.exc import GarthHTTPError
from dotenv import load_dotenv

from graph.state import HealthState, DailyMetrics, SleepMetrics, ActivityMetrics, ReadinessMetrics
from utils.db import get_historical_records

logger = logging.getLogger(__name__)

# Ensure env vars are loaded
load_dotenv()

def garmin_login() -> Optional[Garmin]:
    """Authenticate with Garmin Connect."""
    token_dir = os.getenv("TOKEN_DIR", os.path.expanduser("~/.garminconnect"))
    user_email = os.getenv("GARMIN_EMAIL")  # matching the name in usual setups or .env
    user_password = os.getenv("GARMIN_PASSWORD")
    
    # Fallback to GARMINCONNECT_EMAIL from the reference script if needed
    if not user_email:
        user_email = os.getenv("GARMINCONNECT_EMAIL")
    if not user_password:
        user_password = os.getenv("GARMINCONNECT_PASSWORD")

    is_cn = os.getenv("GARMINCONNECT_IS_CN", "False").lower() in ['true', '1', 't', 'yes']

    try:
        if os.path.exists(token_dir):
            garmin = Garmin()
            garmin.login(token_dir)
            logger.info("Garmin Connect login successful using session tokens.")
            return garmin
    except (FileNotFoundError, GarthHTTPError, GarminConnectAuthenticationError):
        logger.info("Session tokens invalid or expired.")
        
    if not user_email or not user_password:
        logger.warning("Garmin credentials (GARMIN_EMAIL, GARMIN_PASSWORD) not found in env.")
        return None
        
    try:
        logger.info("Attempting Garmin Connect login with email/password...")
        garmin = Garmin(email=user_email, password=user_password, is_cn=is_cn)
        garmin.login()
        
        # Save tokens for future
        os.makedirs(token_dir, exist_ok=True)
        garmin.garth.dump(token_dir)
        logger.info(f"Oauth tokens stored in '{token_dir}' for future use.")
        return garmin
    except Exception as err:
        logger.error(f"Error logging in to Garmin Connect: {err}")
        return None

def fetch_garmin_data(garmin: Garmin, target_date: datetime) -> Dict[str, Any]:
    """Fetch all relevant health metrics for a given date."""
    date_str = target_date.strftime("%Y-%m-%d")
    data = {}
    
    try:
        logger.info(f"Fetching Daily Stats for {date_str}...")
        data['stats'] = garmin.get_stats(date_str) or {}
    except Exception as e:
        logger.error(f"Failed to fetch stats: {e}")
        data['stats'] = {}

    try:
        logger.info(f"Fetching Sleep Data for {date_str}...")
        data['sleep'] = garmin.get_sleep_data(date_str) or {}
    except Exception as e:
        logger.error(f"Failed to fetch sleep: {e}")
        data['sleep'] = {}

    try:
        logger.info(f"Fetching Activities for {date_str}...")
        data['activities'] = garmin.get_activities_by_date(date_str, date_str) or []
    except Exception as e:
        logger.error(f"Failed to fetch activities: {e}")
        data['activities'] = []

    try:
        logger.info(f"Fetching Training Readiness for {date_str}...")
        data['readiness'] = garmin.get_training_readiness(date_str) or {}
    except Exception as e:
        logger.debug(f"Failed to fetch training readiness: {e}")
        data['readiness'] = {}

    try:
        logger.info(f"Fetching Respiration Data for {date_str}...")
        data['respiration'] = garmin.get_respiration_data(date_str) or {}
    except Exception as e:
        logger.debug(f"Failed to fetch respiration: {e}")
        data['respiration'] = {}

    try:
        logger.info(f"Fetching SpO2 Data for {date_str}...")
        data['spo2'] = garmin.get_spo2_data(date_str) or {}
    except Exception as e:
        logger.debug(f"Failed to fetch SpO2: {e}")
        data['spo2'] = {}

    try:
        logger.info(f"Fetching HRV Data for {date_str}...")
        data['hrv'] = garmin.get_hrv_data(date_str) or {}
    except Exception as e:
        logger.debug(f"Failed to fetch HRV: {e}")
        data['hrv'] = {}

    try:
        logger.info(f"Fetching Max Metrics (VO2 Max) for {date_str}...")
        data['max_metrics'] = garmin.get_max_metrics(date_str) or []
    except Exception as e:
        logger.debug(f"Failed to fetch max metrics: {e}")
        data['max_metrics'] = []

    return data

def get_mock_data() -> Dict[str, Any]:
    """Provide realistic mock data if Garmin API is unavailable"""
    return {
        "daily_metrics": DailyMetrics(
            steps=8540,
            resting_heart_rate=52,
            active_calories=640,
            stress_level=35,
            body_battery_high=95,
            body_battery_low=20,
            body_battery_charge=75,
            body_battery_drain=70,
            respiration_bpm=14.5,
            spo2_percent=98.0,
            hrv_avg_ms=65.0,
            vo2_max=48
        ),
        "sleep_metrics": SleepMetrics(
            duration_hours=7.5,
            sleep_score=82,
            deep_sleep_hours=1.8,
            rem_sleep_hours=1.5,
            awake_time_hours=0.3
        ),
        "activity_metrics": [
            ActivityMetrics(
                type="running",
                duration_minutes=45.0,
                distance_km=8.2,
                average_heart_rate=145,
                max_heart_rate=172,
                calories=420
            )
        ],
        "readiness_metrics": ReadinessMetrics(
            readiness_score=78,
            recovery_time_hours=12,
            training_load=540
        ),
        "raw_garmin_data": {}
    }

def process_garmin_data(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """Transform raw Garmin API payload into our state schema."""
    stats = raw_data.get('stats', {})
    sleep_data = raw_data.get('sleep', {})
    activities = raw_data.get('activities', [])
    readiness = raw_data.get('readiness', {})

    # Process daily stats
    # Different fields exist in Garmin response, capturing standard ones
    # Process DAILY metrics
    steps = stats.get('totalSteps', 0)
    resting_hr = stats.get('restingHeartRate', 0)
    active_calories = stats.get('activeKilocalories', 0)
    stress_level = stats.get('averageStressLevel', 0) 
    bb_high = stats.get('bodyBatteryHighestValue', 0)
    bb_low = stats.get('bodyBatteryLowestValue', 0)
    bb_charge = stats.get('bodyBatteryChargeValue', 0)
    bb_drain = stats.get('bodyBatteryDrainValue', 0)

    # Expanded metrics
    respiration = raw_data.get('respiration', {})
    spo2 = raw_data.get('spo2', {})
    hrv = raw_data.get('hrv', {})
    max_metrics = raw_data.get('max_metrics', [])

    resp_bpm = respiration.get('avgWakingRespiration') or respiration.get('avgRespiration')
    spo2_val = spo2.get('averageSpo2') or spo2.get('avgSpo2')
    hrv_val = hrv.get('lastNightAvg') or hrv.get('weeklyAvg')
    
    vo2_max_val = None
    if isinstance(max_metrics, list):
        for m in max_metrics:
            if m.get('vo2Max') and m.get('genericValue'):
                vo2_max_val = m.get('genericValue')

    daily_metrics = DailyMetrics(
        steps=steps if steps is not None else 0,
        resting_heart_rate=resting_hr if resting_hr is not None else 0,
        active_calories=active_calories if active_calories is not None else 0,
        stress_level=stress_level if stress_level is not None else 0,
        body_battery_high=bb_high if bb_high is not None else 0,
        body_battery_low=bb_low if bb_low is not None else 0,
        body_battery_charge=bb_charge if bb_charge is not None else 0,
        body_battery_drain=bb_drain if bb_drain is not None else 0,
        respiration_bpm=resp_bpm,
        spo2_percent=spo2_val,
        hrv_avg_ms=hrv_val,
        vo2_max=vo2_max_val
    )
    
    # Process sleep
    daily_sleep_dto = sleep_data.get('dailySleepDTO', {})
    sleep_scores = sleep_data.get('sleepScores', {}) or daily_sleep_dto.get('sleepScores', {})
    sleep_score_val = sleep_scores.get('overall', {}).get('value', 0) if sleep_scores else 0

    sleep_metrics = SleepMetrics(
        duration_hours=(daily_sleep_dto.get('sleepTimeSeconds') or 0) / 3600.0,
        sleep_score=sleep_score_val,
        deep_sleep_hours=(daily_sleep_dto.get('deepSleepSeconds') or 0) / 3600.0,
        rem_sleep_hours=(daily_sleep_dto.get('remSleepSeconds') or 0) / 3600.0,
        awake_time_hours=(daily_sleep_dto.get('awakeSleepSeconds') or 0) / 3600.0,
    )

    # Process activities
    activity_metrics = []
    for act in activities:
        act_type = act.get('activityType', {}).get('typeKey', 'unknown')
        duration = (act.get('duration') or act.get('elapsedDuration') or 0) / 60.0
        distance = (act.get('distance') or 0) / 1000.0 if act.get('distance') else None
        
        activity_metrics.append(ActivityMetrics(
            type=act_type,
            duration_minutes=duration,
            distance_km=distance,
            average_heart_rate=act.get('averageHR'),
            max_heart_rate=act.get('maxHR'),
            calories=act.get('calories')
        ))

    # Process readiness
    r_score = readiness.get('readinessScore', 0) if isinstance(readiness, dict) else 0
    
    readiness_metrics = ReadinessMetrics(
        readiness_score=r_score,
        recovery_time_hours=stats.get('recoveryTime', 0), # recovery time often comes in stats or activities
        training_load=stats.get('trainingLoad', 0)
    )

    return {
        "daily_metrics": daily_metrics,
        "sleep_metrics": sleep_metrics,
        "activity_metrics": activity_metrics,
        "readiness_metrics": readiness_metrics,
        "raw_garmin_data": raw_data
    }

def data_ingest_node(state: HealthState) -> HealthState:
    """Ingest data from Garmin or use mock data."""
    logger.info("--- NODE: DATA INGEST ---")
    
    # Check if a target date was provided in the state, otherwise use today
    target_date_str = state.get("target_date")
    if target_date_str:
        try:
            target_date = datetime.strptime(target_date_str, "%Y-%m-%d")
        except ValueError:
            logger.error(f"Invalid target_date format: {target_date_str}. Expected YYYY-MM-DD. Falling back to today.")
            target_date = datetime.now()
    else:
        target_date = datetime.now()
    
    garmin = garmin_login()
    if garmin:
        logger.info(f"Fetching Garmin data for {target_date.strftime('%Y-%m-%d')}")
        raw_data = fetch_garmin_data(garmin, target_date)
        processed_data = process_garmin_data(raw_data)
        historical = get_historical_records(target_date.strftime('%Y-%m-%d'), days=7)
        return {**state, **processed_data, "historical_metrics": historical, "target_date": target_date.strftime('%Y-%m-%d')}
    else:
        logger.info("Using mock data as Garmin credentials missing or login failed.")
        mock_data = get_mock_data()
        historical = get_historical_records(target_date.strftime('%Y-%m-%d'), days=7)
        return {**state, **mock_data, "historical_metrics": historical, "target_date": target_date.strftime('%Y-%m-%d')}
