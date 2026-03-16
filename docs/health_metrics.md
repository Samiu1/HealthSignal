# Health Metrics Overview

This document outlines the expanded set of health metrics captured by the **Health Signal** application from Garmin devices.

## Direct Metrics

These metrics are fetched directly from Garmin Connect and mapped to the `DailyMetrics` state.

| Metric | Code Key | Unit | Description |
| :--- | :--- | :--- | :--- |
| **Respiration Rate** | `respiration_bpm` | BPM | Average breathing rate during waking hours. |
| **Blood Oxygen** | `spo2_percent` | % | Average peripheral oxygen saturation (Pulse Ox). |
| **HRV (Nightly)** | `hrv_avg_ms` | ms | Heart Rate Variability (avg from previous night). |
| **VO2 Max** | `vo2_max` | - | Maximal oxygen consumption (fitness level). |

## Existing Metrics

| Metric | Code Key | Unit | Description |
| :--- | :--- | :--- | :--- |
| **Steps** | `steps` | count | Daily step count. |
| **Resting HR** | `resting_heart_rate` | BPM | Lowest 30-minute average heart rate. |
| **Active Calories** | `active_calories` | kcal | Calories burned through activities. |
| **Stress Level** | `stress_level` | 0-100 | Average daily stress score. |
| **Body Battery** | `body_battery_high/low` | 0-100 | Energy levels throughout the day. |

## Data Pipeline Flow

1. **Ingest**: `src/graph/nodes/data_ingest.py` calls Garmin API endpoints for each specific metric.
2. **Transform**: Raw JSON payloads are parsed and normalized into the `DailyMetrics` Pydantic model.
3. **Analyze**: The "Council of Experts" LangGraph agents use these fields to assess recovery, stress, and lifestyle trends.
