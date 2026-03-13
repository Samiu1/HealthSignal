import logging
import sys
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), "src"))
from graph.main import build_graph

# Configure logging to stdout
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

def main():
    load_dotenv()
    
    logger.info("Initializing Garmin Health Analysis AI Data Pipeline...")
    app = build_graph()
    
    # Calculate dates for the last 7 days
    today = datetime.now()
    dates_to_process = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]
    dates_to_process.reverse() # Process oldest to newest
    
    logger.info(f"Executing Pipeline for the following dates: {dates_to_process}")
    
    for date_str in dates_to_process:
        logger.info(f"\n>>> PROCESSING DATE: {date_str} <<<")
        # Invoke the graph with the specific target date
        final_state = app.invoke({"target_date": date_str})
        
        analysis = final_state.get('analysis', {})
        logger.info(f"Result for {date_str}: Wellness Score {analysis.get('overall_score', 'N/A')}/100")

    print("\n" + "="*50)
    print("=== MULTI-DAY PIPELINE EXECUTION COMPLETE ===")
    print("="*50)

if __name__ == "__main__":
    main()
