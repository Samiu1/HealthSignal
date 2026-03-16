import logging
import sys
import os
from datetime import datetime
from dotenv import load_dotenv

# Ensure we can import from src
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))
from graph.main import build_graph

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

def fetch_live_data():
    load_dotenv()
    
    # Use current local time for live data
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    logger.info(f"🚀 Starting Live Garmin Data Sync for {today_str}...")
    
    try:
        app = build_graph()
        
        logger.info(f"🔗 Triggering data pipeline for {today_str}...")
        final_state = app.invoke({"target_date": today_str})
        
        analysis = final_state.get('analysis', {})
        score = analysis.get('overall_score', 'N/A')
        
        logger.info(f"✅ Live Sync Complete Profile for {today_str}:")
        logger.info(f"📈 Wellness Score: {score}/100")
        logger.info(f"📝 Summary: {analysis.get('summary', 'No summary generated')[:100]}...")
        
    except Exception as e:
        logger.error(f"❌ Error during live sync: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fetch_live_data()
