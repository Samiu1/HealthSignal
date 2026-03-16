import sqlite3
import json
import logging
import os

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "health_data.db")

def init_db():
    """Initialize the SQLite database schema."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS daily_health (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT UNIQUE NOT NULL,
                daily_metrics TEXT,
                sleep_metrics TEXT,
                activity_metrics TEXT,
                readiness_metrics TEXT,
                analysis_summary TEXT,
                analysis_insights TEXT,
                analysis_recommendations TEXT,
                health_score INTEGER,
                synthesis_report TEXT,
                expert_insights TEXT,
                overall_score INTEGER,
                raw_data TEXT
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS health_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                daily_metrics TEXT,
                sleep_metrics TEXT,
                activity_metrics TEXT,
                readiness_metrics TEXT,
                analysis_summary TEXT,
                analysis_insights TEXT,
                analysis_recommendations TEXT,
                health_score INTEGER,
                synthesis_report TEXT,
                expert_insights TEXT,
                overall_score INTEGER,
                raw_data TEXT
            )
        ''')
        conn.commit()
        conn.close()
        logger.info(f"Database initialized successfully at {DB_PATH}.")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

def save_daily_record(date_str: str, state: dict):
    """Upsert a daily health record into the SQLite database."""
    daily = state.get('daily_metrics')
    sleep = state.get('sleep_metrics')
    acts = state.get('activity_metrics')
    readiness = state.get('readiness_metrics')
    analysis = state.get('analysis', {})
    raw = state.get('raw_garmin_data', {})
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        sql = '''
            INSERT INTO daily_health (
                date, daily_metrics, sleep_metrics, activity_metrics, readiness_metrics,
                analysis_summary, analysis_insights, analysis_recommendations, 
                health_score, synthesis_report, expert_insights, overall_score, raw_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
                daily_metrics=excluded.daily_metrics,
                sleep_metrics=excluded.sleep_metrics,
                activity_metrics=excluded.activity_metrics,
                readiness_metrics=excluded.readiness_metrics,
                analysis_summary=excluded.analysis_summary,
                analysis_insights=excluded.analysis_insights,
                analysis_recommendations=excluded.analysis_recommendations,
                health_score=excluded.health_score,
                synthesis_report=excluded.synthesis_report,
                expert_insights=excluded.expert_insights,
                overall_score=excluded.overall_score,
                raw_data=excluded.raw_data
        '''
        
        expert_insights_list = [
            {"expert": "Sleep", "analysis": state.get("sleep_analysis", ""), "recommendations": []},
            {"expert": "Performance", "analysis": state.get("performance_analysis", ""), "recommendations": []},
            {"expert": "Stress", "analysis": state.get("stress_analysis", ""), "recommendations": []},
        ]

        cursor.execute(sql, (
            date_str,
            daily.model_dump_json() if daily else None,
            sleep.model_dump_json() if sleep else None,
            json.dumps([a.model_dump() for a in acts]) if acts else None,
            readiness.model_dump_json() if readiness else None,
            analysis.get('summary'),
            json.dumps(analysis.get('insights', [])),
            json.dumps(analysis.get('recommendations', [])),
            analysis.get('overall_score'),
            analysis.get('summary'), # Using summary for synthesis_report for now
            json.dumps(expert_insights_list),
            analysis.get('overall_score'),
            json.dumps(raw)
        ))
        
        sql_events = '''
            INSERT INTO health_events (
                date, daily_metrics, sleep_metrics, activity_metrics, readiness_metrics,
                analysis_summary, analysis_insights, analysis_recommendations, 
                health_score, synthesis_report, expert_insights, overall_score, raw_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        '''
        cursor.execute(sql_events, (
            date_str,
            daily.model_dump_json() if daily else None,
            sleep.model_dump_json() if sleep else None,
            json.dumps([a.model_dump() for a in acts]) if acts else None,
            readiness.model_dump_json() if readiness else None,
            analysis.get('summary'),
            json.dumps(analysis.get('insights', [])),
            json.dumps(analysis.get('recommendations', [])),
            analysis.get('overall_score'),
            analysis.get('summary'), # Using summary for synthesis_report for now
            json.dumps(expert_insights_list),
            analysis.get('overall_score'),
            json.dumps(raw)
        ))
        
        conn.commit()
        conn.close()
        logger.info(f"Record for {date_str} successfully saved to DB.")
    except Exception as e:
        logger.error(f"Error saving record to DB: {e}")
