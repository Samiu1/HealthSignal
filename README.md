# Health Signal

Health Signal is an AI-powered health monitoring and correlation dashboard that ingests physiological data from Garmin, analyzes it using Anthropic's Claude 3.5 Sonnet via LangGraph, and visualizes the insights on a Japandi-themed Next.js dashboard.

The goal of the project is to convert raw wearable tracking data into deeply personal, actionable health insights.

---

## 📚 Documentation Suite (The Deep Wiki)

For a deep dive into the system's architecture, logic, and developer guidelines, refer to our comprehensive documentation suite in the `/docs` folder:

- **[The Mental Model](docs/index.md)**: Mission, logic flow, and architectural patterns.
- **[System Topography](docs/topography.md)**: Directory philosophy and dependency mapping.
- **[Logic Deep-Dives](docs/deep_dives.md)**: In-depth analysis of LangGraph nodes, database schema, and Garmin integration.
- **[The Developer Playbook](docs/developer_playbook.md)**: Onboarding, standards, and common recipes.

---

## Key Features

- **Automated Data Ingestion**: Securely fetches daily health metrics from Garmin Connect.
- **AI-Powered Analysis**: Uses LangGraph and LangChain (with Anthropic's Claude) to summarize health metrics, analyze trends, and generate personalized recommendations.
- **SQLite Persistence**: Stores raw telemetry and AI analysis results in a local SQLite database for historical tracking.
- **Japandi Dashboard**: Minimalist, warm, and highly readable web interface built with Next.js 15, Tailwind CSS 4, and Framer Motion.
- **Dark Mode Support**: Seamless dynamic dark/light mode following UI/UX best practices.

## Tech Stack

### Data Pipeline & AI (Backend)
- **Language**: Python 3.12+
- **Environment**: `uv` package manager
- **AI Framework**: LangGraph, LangChain (Anthropic Claude 3.5 Sonnet)
- **Data Integration**: `garminconnect`
- **Database**: SQLite3
- **Data Manipulation**: Pandas

### Web Dashboard (Frontend)
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Database Access**: `better-sqlite3`

## Prerequisites

- [Python 3.12+](https://www.python.org/downloads/)
- [uv](https://github.com/astral-sh/uv) (for fast Python package management)
- [Node.js 20+](https://nodejs.org/en/)
- [pnpm](https://pnpm.io/) or `npm`
- Anthropic API Key for LangChain/LangGraph
- Garmin Connect Account

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/health-signal.git
cd health-signal
```

### 2. Set Up the Data Pipeline
Navigate to the project root and install the Python dependencies using `uv`:
```bash
uv venv
source .venv/bin/activate
uv pip install -e .
```

Create a `.env` file in the root directory and configure your credentials (see `.env.example`):
- `GARMIN_EMAIL`
- `GARMIN_PASSWORD`
- `ANTHROPIC_API_KEY`

### 3. Run the AI Agent Pipeline
Execute the LangGraph agent to fetch and analyze your recent Garmin health data (default processes last 7 days):
```bash
python main.py
```
This will populate the `src/health_data.db` SQLite database.

### 4. Set Up the Web Dashboard
Navigate to the `web/` directory and install dependencies:
```bash
cd web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view your dashboard.

## Architecture

```text
├── docs/                     # Comprehensive "Deep Wiki" documentation
├── src/                      # Python Backend (Logic & Utilities)
│   ├── graph/                # LangGraph definition
│   │   ├── nodes/            # Pipeline execution steps
│   │   ├── main.py           # Graph builder
│   │   └── state.py          # State schema
│   ├── utils/                # Garmin, DB, and LLM utilities
│   ├── app.py                # Legacy Streamlit view (optional)
│   └── health_data.db        # SQLite database
├── web/                      # Next.js Frontend
│   ├── src/app/              # Next.js App Router (Japandi Dashboard)
│   └── src/components/       # UI Components & Charts
├── main.py                   # Root entry point for the data pipeline
└── pyproject.toml            # Build configuration
```

## Contributing
Please see the [Developer Playbook](docs/developer_playbook.md) for detailed contribution guidelines and coding standards.

## License
This project is licensed under the MIT License.
