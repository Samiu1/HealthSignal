import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), '../src/health_data.db');
const db = new Database(dbPath);

console.log('Seeding mock data to:', dbPath);

const mockDailyMetrics = [
  {
    date: '2024-05-20',
    daily_metrics: JSON.stringify({ resting_heart_rate: 58, stress_level: 22, body_battery_high: 95, body_battery_low: 45, active_calories: 450 }),
    sleep_metrics: JSON.stringify({ sleep_score: 88, readiness_score: 92 }),
    analysis_summary: 'Exceptional cardiovascular recovery and deep sleep architecture. Physiological readiness is peak.',
    health_score: 94,
    expert_insights: JSON.stringify([
      {
        expert: 'Cardiologist',
        analysis: 'Heart rate variability (HRV) shows high parasympathetic activity. Recovery is optimal.',
        recommendations: ['Vigorous intensity workout recommended']
      },
      {
        expert: 'Sleep Specialist',
        analysis: 'Deep sleep phase duration was 2.5 hours. Excellent growth hormone release potential.',
        recommendations: ['Maintain present sleep hygiene']
      },
      {
        expert: 'Nutritionist',
        analysis: 'Metabolic rate is trending high. Carbohydrate glycogen stores are depleted.',
        recommendations: ['Increase complex carb intake by 50g']
      }
    ]),
    analysis_recommendations: JSON.stringify(['High-intensity interval training', 'Complex clean carb loading', 'Evening meditation'])
  },
  {
    date: '2024-05-19',
    daily_metrics: JSON.stringify({ resting_heart_rate: 62, stress_level: 35, body_battery_high: 85, body_battery_low: 30, active_calories: 600 }),
    sleep_metrics: JSON.stringify({ sleep_score: 75, readiness_score: 82 }),
    analysis_summary: 'Moderate stress detected likely due to increased training volume. Recovery slightly compromised.',
    health_score: 82,
    expert_insights: JSON.stringify([
      {
        expert: 'Cardiologist',
        analysis: 'Slight elevation in resting heart rate. Accumulated fatigue is apparent.',
        recommendations: ['Monitor RHR for 48 hours']
      },
      {
        expert: 'Performance Coach',
        analysis: 'Training load peaked yesterday. CNS fatigue is moderate.',
        recommendations: ['Lower intensity session (Zone 2 only)']
      }
    ]),
    analysis_recommendations: JSON.stringify(['Active recovery session', 'Magnesium supplementation', 'Cold plunge'])
  }
];

const insert = db.prepare(`
  INSERT OR REPLACE INTO daily_health 
  (date, daily_metrics, sleep_metrics, analysis_summary, health_score, expert_insights, analysis_recommendations) 
  VALUES (@date, @daily_metrics, @sleep_metrics, @analysis_summary, @health_score, @expert_insights, @analysis_recommendations)
`);

db.transaction(() => {
  for (const row of mockDailyMetrics) {
    insert.run(row);
  }
})();

console.log('Seeding complete.');
db.close();
