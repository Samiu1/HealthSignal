import Database from 'better-sqlite3';
import path from 'path';

// The database is located at ../src/health_data.db relative to the web directory.
// When running in dev, process.cwd() is the web folder.
const dbPath = path.resolve(process.cwd(), '../src/health_data.db');

let db: ReturnType<typeof Database> | null = null;

export function getDb() {
  if (!db) {
    db = new Database(dbPath, { readonly: true });
  }
  return db;
}

export interface HealthMetric {
  id: number;
  date: string;
  resting_heart_rate: number;
  avg_stress: number;
  sleep_score: number;
  body_battery_drain: number;
  body_battery_charge: number;
  created_at: string;
}

export interface AiInsight {
  id: number;
  date: string;
  summary: string;
  insights: string[];
  recommendations: string[];
  created_at: string;
}

export function getHealthMetrics(): HealthMetric[] {
  const database = getDb();
  // Fetch the latest 30 days of metrics
  const rows = database.prepare('SELECT * FROM daily_health ORDER BY date DESC LIMIT 30').all();
  
  return rows.map((row: any) => {
    let dailyMetrics: any = {};
    let sleepMetrics: any = {};
    try {
      if (row.daily_metrics) dailyMetrics = JSON.parse(row.daily_metrics);
      if (row.sleep_metrics) sleepMetrics = JSON.parse(row.sleep_metrics);
    } catch(e) {}
    
    return {
      id: row.id,
      date: row.date,
      resting_heart_rate: dailyMetrics.resting_heart_rate || 0,
      avg_stress: dailyMetrics.stress_level || 0,
      sleep_score: sleepMetrics.sleep_score || 0,
      body_battery_drain: dailyMetrics.body_battery_low || 0,
      body_battery_charge: dailyMetrics.body_battery_high || 0,
      created_at: row.date,
    };
  });
}

export function getAiInsights(): AiInsight[] {
  const database = getDb();
  const rows = database.prepare("SELECT * FROM daily_health WHERE analysis_insights IS NOT NULL AND analysis_insights != '[]' ORDER BY date DESC LIMIT 10").all();
  
  return rows.map((row: any) => {
    let insights: string[] = [];
    let recs: string[] = [];
    try {
      if (row.analysis_insights) insights = JSON.parse(row.analysis_insights);
      if (row.analysis_recommendations) recs = JSON.parse(row.analysis_recommendations);
    } catch(e) {}
    
    return {
      id: row.id,
      date: row.date,
      summary: row.analysis_summary || 'No summary generated',
      insights: insights,
      recommendations: recs,
      created_at: row.date,
    };
  });
}
