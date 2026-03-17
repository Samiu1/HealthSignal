import { HealthMetric, AiInsight } from "./db";

export const MOCK_METRICS: HealthMetric[] = [
  {
    id: 1,
    date: "2024-05-20",
    resting_heart_rate: 58,
    avg_stress: 22,
    sleep_score: 88,
    body_battery_drain: 45,
    body_battery_charge: 95,
    readiness_score: 92,
    active_calories: 450,
    created_at: "2024-05-20",
  },
  {
    id: 2,
    date: "2024-05-19",
    resting_heart_rate: 62,
    avg_stress: 35,
    sleep_score: 75,
    body_battery_drain: 60,
    body_battery_charge: 85,
    readiness_score: 82,
    active_calories: 600,
    created_at: "2024-05-19",
  },
  {
    id: 3,
    date: "2024-05-18",
    resting_heart_rate: 60,
    avg_stress: 28,
    sleep_score: 82,
    body_battery_drain: 50,
    body_battery_charge: 90,
    readiness_score: 88,
    active_calories: 520,
    created_at: "2024-05-18",
  },
  {
    id: 4,
    date: "2024-05-17",
    resting_heart_rate: 65,
    avg_stress: 45,
    sleep_score: 68,
    body_battery_drain: 22,
    body_battery_charge: 70,
    readiness_score: 72,
    active_calories: 800,
    created_at: "2024-05-17",
  },
  {
    id: 5,
    date: "2024-05-16",
    resting_heart_rate: 61,
    avg_stress: 30,
    sleep_score: 80,
    body_battery_drain: 55,
    body_battery_charge: 88,
    readiness_score: 85,
    active_calories: 400,
    created_at: "2024-05-16",
  },
  {
    id: 6,
    date: "2024-05-15",
    resting_heart_rate: 59,
    avg_stress: 25,
    sleep_score: 85,
    body_battery_drain: 22,
    body_battery_charge: 92,
    readiness_score: 90,
    active_calories: 350,
    created_at: "2024-05-15",
  },
  {
    id: 7,
    date: "2024-05-14",
    resting_heart_rate: 63,
    avg_stress: 38,
    sleep_score: 72,
    body_battery_drain: 31,
    body_battery_charge: 80,
    readiness_score: 78,
    active_calories: 550,
    created_at: "2024-05-14",
  },
];

export const MOCK_INSIGHTS: AiInsight[] = [
  {
    id: 1,
    date: "2024-05-20",
    health_score: 94,
    summary:
      "### Exceptional Physiological Alignment\nYour body is currently in an optimal state of recovery and readiness. The synergy between your sleep architecture and cardiovascular response suggests peak performance capacity.",
    synthesis_report:
      "#### Agent Synthesis Hub\n\nThe **Recovery Architect** notes a +15% improvement in Body Battery charge efficiency. \n\nThe **Cardio Guardian** reports a stable Resting Heart Rate of 58 BPM, which is in the optimal range for your demographic.\n\nThe **Sleep Navigator** identified a significant increase in deep sleep duration, contributing to higher cognitive readiness.",
    expert_insights: [
      {
        expert: "Cardio Guardian",
        analysis:
          "Heart rate variability (HRV) shows high parasympathetic activity. Your cardiovascular system is primed for high-intensity exertion if desired.",
        recommendations: [
          "Vigorous intensity workout recommended",
          "Focus on explosive power today",
        ],
      },
      {
        expert: "Sleep Navigator",
        analysis:
          "Deep sleep phase duration was 2.5 hours. This is 40% above your 30-day average, indicating superior physical repair.",
        recommendations: [
          "Maintain current 10 PM wind-down routine",
          "Continue using magnesium before bed",
        ],
      },
      {
        expert: "Metabolic Sage",
        analysis:
          "Metabolic rate is trending high. Glycogen stores are significantly depleted despite low active calories, suggesting high basal efficiency.",
        recommendations: [
          "Increase complex carb intake by 50g",
          "Prioritize protein at dinner for muscle protein synthesis",
        ],
      },
    ],
    recommendations: [
      "High-intensity interval training (HIIT)",
      "Complex clean carb loading (Sweet potato/Quinoa)",
      "15-minute guided meditation for CNS maintenance",
    ],
    created_at: "2024-05-20",
  },
];
