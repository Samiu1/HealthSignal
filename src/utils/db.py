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
        
        def parse_agent_output(output_str):
            if not output_str:
                return "", []
            try:
                if output_str.startswith("```json"):
                    output_str = output_str[7:-3]
                elif output_str.startswith("```"):
                    output_str = output_str[3:-3]
                res = json.loads(output_str.strip())
                return res.get("analysis", ""), res.get("recommendations", [])
            except Exception:
                return str(output_str), []

        sleep_ana_raw = state.get("sleep_analysis", "")
        perf_ana_raw = state.get("performance_analysis", "")
        stress_ana_raw = state.get("stress_analysis", "")

        sleep_ana, sleep_rec = parse_agent_output(sleep_ana_raw)
        perf_ana, perf_rec = parse_agent_output(perf_ana_raw)
        stress_ana, stress_rec = parse_agent_output(stress_ana_raw)

        expert_insights_list = [
            {"expert": "Sleep Navigator", "analysis": sleep_ana, "recommendations": sleep_rec},
            {"expert": "Cardio Guardian", "analysis": perf_ana, "recommendations": perf_rec},
            {"expert": "Metabolic Sage", "analysis": stress_ana, "recommendations": stress_rec},
        ]

        # Build the synthesis_report as an agent-by-agent narrative hub
        # (distinct from the executive summary — matches mock data format)
        synthesis_report_parts = ["#### Agent Synthesis Hub\n"]
        if sleep_ana:
            synthesis_report_parts.append(f"The **Sleep Navigator** reports: {sleep_ana}\n")
        if perf_ana:
            synthesis_report_parts.append(f"The **Cardio Guardian** reports: {perf_ana}\n")
        if stress_ana:
            synthesis_report_parts.append(f"The **Metabolic Sage** reports: {stress_ana}\n")
        synthesis_report = "\n".join(synthesis_report_parts)

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
            synthesis_report,
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
            synthesis_report,
            json.dumps(expert_insights_list),
            analysis.get('overall_score'),
            json.dumps(raw)
        ))
        
        conn.commit()
        conn.close()
        logger.info(f"Record for {date_str} successfully saved to DB.")
    except Exception as e:
        logger.error(f"Error saving record to DB: {e}")

def get_historical_records(target_date: str, days: int = 7) -> list:
    """Fetch the past `days` records ending on `target_date`."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        sql = '''
            SELECT date, daily_metrics, sleep_metrics, readiness_metrics
            FROM daily_health
            WHERE date <= ?
            ORDER BY date DESC
            LIMIT ?
        '''
        cursor.execute(sql, (target_date, days))
        rows = cursor.fetchall()
        
        history = []
        for row in rows:
            record = {"date": row["date"]}
            if row["daily_metrics"]:
                try:
                    record["daily_metrics"] = json.loads(row["daily_metrics"])
                except Exception:
                    pass
            if row["sleep_metrics"]:
                try:
                    record["sleep_metrics"] = json.loads(row["sleep_metrics"])
                except Exception:
                    pass
            if row["readiness_metrics"]:
                try:
                    record["readiness_metrics"] = json.loads(row["readiness_metrics"])
                except Exception:
                    pass
            history.append(record)
            
        conn.close()
        return history
    except Exception as e:
        logger.error(f"Error fetching historical records from DB: {e}")
        return []
