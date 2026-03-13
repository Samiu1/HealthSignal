import streamlit as st
import sqlite3
import pandas as pd
import json

# DB path
DB_PATH = 'src/health_data.db'

def load_data():
    conn = sqlite3.connect(DB_PATH)
    query = "SELECT * FROM daily_health ORDER BY date DESC"
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

st.set_page_config(page_title="Health Signal Dashboard", layout="wide")
st.title("Health Signal: Garmin Health AI Insights")

df = load_data()

if df.empty:
    st.warning("No data found in the database. Run the pipeline first.")
else:
    # Sidebar
    st.sidebar.header("Select a Date")
    dates = df['date'].tolist()
    selected_date = st.sidebar.selectbox("Date", dates)

    # Filter data for selected date
    row = df[df['date'] == selected_date].iloc[0]

    # Quick Stats
    st.header(f"Health Snapshot: {selected_date}")
    
    col1, col2 = st.columns(2)
    with col1:
        st.metric(label="Overall Wellness Score", value=f"{row['overall_score']}/100")
    
    st.divider()

    # Analysis Section
    st.header("AI Analysis")
    st.subheader("Summary")
    st.write(row['analysis_summary'])

    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Insights")
        insights = json.loads(row['analysis_insights'])
        for insight in insights:
            st.markdown(f"- {insight}")

    with col2:
        st.subheader("Recommendations")
        recs = json.loads(row['analysis_recommendations'])
        for rec in recs:
            st.markdown(f"- {rec}")

    st.divider()
    
    # Raw Data Section
    if st.checkbox("Show Raw Data Payload"):
        st.json(json.loads(row['raw_data']))
