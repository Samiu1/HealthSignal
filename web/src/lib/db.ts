import Database from 'better-sqlite3';
import path from 'path';

/* eslint-disable @typescript-eslint/no-explicit-any */

// If DB_PATH is explicitly set in env (e.g., in Docker), use it.
// Otherwise, default to ../data/health_data.db relative to the web directory.
const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), '../src/health_data.db');

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
  readiness_score: number;
  active_calories: number;
  created_at: string;
}

export interface AiExpertInsight {
  expert: string;
  analysis: string;
  recommendations: string[];
}

export interface AiInsight {
  id: number;
  date: string;
  summary: string;
  health_score: number;
  expert_insights: AiExpertInsight[];
  synthesis_report: string;
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
    } catch {}
    
    return {
      id: row.id,
      date: row.date,
      resting_heart_rate: dailyMetrics.resting_heart_rate || 0,
      avg_stress: dailyMetrics.stress_level || 0,
      sleep_score: sleepMetrics.sleep_score || 0,
      body_battery_drain: dailyMetrics.body_battery_drain || dailyMetrics.body_battery_low || 0,
      body_battery_charge: dailyMetrics.body_battery_charge || dailyMetrics.body_battery_high || 0,
      readiness_score: sleepMetrics.readiness_score || 85, // Fallback for UI
      active_calories: dailyMetrics.active_calories || 0,
      created_at: row.date,
    };
  });
}

export function getAiInsights(): AiInsight[] {
  const database = getDb();
  const rows = database.prepare("SELECT * FROM daily_health WHERE expert_insights IS NOT NULL AND expert_insights != '[]' ORDER BY date DESC LIMIT 10").all();
  
  return rows.map((row: any) => {
    let expertInsights: AiExpertInsight[] = [];
    let recs: string[] = [];
    try {
      if (row.expert_insights) expertInsights = JSON.parse(row.expert_insights);
      if (row.analysis_recommendations) recs = JSON.parse(row.analysis_recommendations);
    } catch(e) {
      console.error("Error parsing DB JSON:", e);
    }
    
    return {
      id: row.id,
      date: row.date,
      summary: row.analysis_summary || 'No summary generated',
      health_score: row.health_score || row.overall_score || 0,
      expert_insights: expertInsights,
      synthesis_report: row.synthesis_report || row.analysis_summary || '',
      recommendations: recs,
      created_at: row.date,
    };
  });
}
