# GridBricks — UK Wind Power Forecast & Day-Ahead Procurement Analytics

> **UK Wholesale Electricity Day-Ahead Market Decision Support System**  
> Tailored for Energy Utility Power Procurement Desks • Data sourced from Elexon BMRS (January 2026)

---

## 1. Executive Summary & Business Context

In Great Britain's liberalized wholesale electricity market, energy utilities must purchase power on the **Day-Ahead Market (DAM)** to satisfy customer demand for each half-hour settlement period of the subsequent delivery day.

Because physical electricity supply and demand must match continuously, utilities aim to minimize reliance on expensive, volatile imbalance pricing in the **Balancing Mechanism (BM)**. Renewable sources like wind provide zero-marginal-cost clean energy, but wind generation is inherently weather-dependent.

To determine how much additional conventional thermal power (e.g., CCGT gas plants) must be procured 24 hours prior to delivery, trading desks face two fundamental challenges:
1. **Decision Gate Information Availability**: Understanding the exact latest wind generation forecast available before the day-ahead auction gate closes (~11:00 UTC D-1).
2. **Empirical Error Quantification**: Quantifying forecast inaccuracy (MAE, RMSE, MAPE, Bias, Skewness, Diurnal Lags) to hedge volume risk with disciplined reserve margins rather than bidding blind point estimates.

**GridBricks** solves both challenges by combining Elexon BMRS stream ingestion with quantitative accuracy benchmarking and an automated day-ahead thermal purchase calculator.

---

## 2. Live Demo & Video Presentation Links

- **Live Web Application (Vercel)**: `https://grid.vercel.app`

> **Note on AI Tools**: As requested in the project brief, AI tools (Google DeepMind Antigravity) were actively utilized as programming assistants to accelerate research of Elexon BMRS stream schemas, prototype statistical pipelines, and assist with frontend development.

---

## 3. Directory & File Structure

```
GridBricks/
├── backend/                             # Python / FastAPI Backend Service
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── elexon.py               # Elexon BMRS API client (FUELHH & WINDFOR streams)
│   │   │   └── routes.py               # 10 REST API endpoints (metrics, daily, profile, csv)
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py              # Pydantic data models & response validation schemas
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── data_processor.py       # 30-min to 1-hour actuals aggregation & alignment
│   │   │   └── analytics.py            # MAE, RMSE, MAPE, Bias, Skewness & Diurnal analytics
│   │   ├── __init__.py
│   │   ├── config.py                   # Centralized environment configuration
│   │   └── main.py                     # FastAPI application entry point & CORS
│   ├── tests/
│   │   └── test_analytics.py           # Automated unit tests for metrics and data alignment
│   ├── Dockerfile                      # Backend container configuration
│   ├── .dockerignore
│   ├── requirements.txt                # High-performance portable dependencies
│   └── .env                            # Local environment variables
│
├── frontend/                            # React 19 + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx              # Top announcement bar, date picker & tab navigation
│   │   │   ├── HeroSection.tsx         # Editorial headline, value pillars & CTA triggers
│   │   │   ├── StatBand.tsx            # 88px display metric band (MAE, RMSE, MAPE, Bias)
│   │   │   ├── ComparisonChart.tsx     # Recharts actual vs forecast dual curve & error deltas
│   │   │   ├── DayAheadProcurement.tsx # Commercial bidding calculator & thermal gap model
│   │   │   ├── AccuracyDeepDive.tsx    # Histogram distribution & diurnal 24-hr error profile
│   │   │   ├── DailyBreakdownTable.tsx # 31-day audited performance register
│   │   │   └── Footer.tsx              # Elexon provenance links & technical compliance
│   │   ├── api.ts                      # Typed frontend REST client
│   │   ├── App.tsx                     # Main application controller & state orchestrator
│   │   ├── index.css                   # Editorial Ink on Cream Paper design system
│   │   └── main.tsx                    # React DOM root mounting
│   ├── index.html                      # Typography preconnects (Manrope & Newsreader)
│   ├── Dockerfile                      # Multi-stage container (Node 24 build -> Nginx Alpine)
│   ├── vercel.json                     # Vercel deployment & SPA routing configuration
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docker-compose.yml                   # Root container orchestration for backend & frontend
├── .gitignore
└── README.md                            # Comprehensive product & engineering documentation
```

---

## 4. How to Start the Application

### Option A: Running with Docker (Recommended)

Ensure Docker Desktop is installed and running:

```bash
# Clone the repository
git clone https://github.com/Vortex-16/grid.git
cd grid

# Build and run containers
docker-compose up --build
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API & Swagger Docs**: `http://localhost:8000/docs`

---

### Option B: Running Locally for Development

#### 1. Backend (FastAPI + Python)
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run unit tests
python tests/test_analytics.py

# Start development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend (React + Vite)
```bash
cd frontend

# Install packages
npm install --legacy-peer-deps

# Start Vite dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 5. Domain Knowledge & Elexon Data Engineering

### Data Sources (Elexon BMRS Insights API)
The platform integrates directly with the official Elexon Insights Solution REST endpoints:
1. **Actual Wind Generation (`FUELHH`)**:
   - `GET /datasets/FUELHH/stream?settlementDateFrom=2026-01-01&settlementDateTo=2026-01-31&fuelType=WIND`
   - Resolution: 30-minute intervals (48 settlement periods per day).
   - Metric: Delivered average MW.
2. **Wind Generation Forecasts (`WINDFOR`)**:
   - `GET /datasets/WINDFOR/stream?publishDateTimeFrom=...&publishDateTimeTo=...`
   - Resolution: Hourly intervals (24 forecast points per day).
   - Frequency: Continuously updated rolling forecast cycles with explicit `publishTime`.

### The Resolution Alignment Challenge
Because FUELHH reports in 30-minute periods while WINDFOR publishes at hourly intervals, raw joining is invalid. GridBricks executes an automated aggregation pipeline:
$$\text{Actual}_{\text{Hour } H} = \frac{\text{FUELHH}_{H:00} + \text{FUELHH}_{H:30}}{2}$$
This matches the hourly forecast timestamp directly, preserving statistical validity.

### Day-Ahead Market Gate Closure Logic
The UK Day-Ahead auction gates close at **11:00 UTC on D-1** (the day prior to physical delivery). Any forecast published *after* 11:00 UTC D-1 was unavailable to trading desks when bidding. 
GridBricks filters `publishTime <= (DeliveryDate - 1 day) 11:00:00 UTC`, selecting the latest available forecast vintage for each settlement block.

---

## 6. Mathematical Formulas for Accuracy Evaluation

GridBricks calculates empirical accuracy metrics across any selected date range:

| Metric | Formula | Procurement Interpretation |
|---|---|---|
| **Mean Absolute Error (MAE)** | $\frac{1}{N} \sum \|F_i - A_i\|$ | Average absolute volume deviation per hour. Directly sizes expected reserve buffer. |
| **Root Mean Squared Error (RMSE)** | $\sqrt{\frac{1}{N} \sum (F_i - A_i)^2}$ | Penalizes large prediction errors. Reflects tail risk of catastrophic ramping misses. |
| **Mean Absolute % Error (MAPE)** | $\frac{100\%}{N} \sum \frac{\|F_i - A_i\|}{A_i}$ | Relative fleet-wide error proportion across variable wind seasons. |
| **Net Forecast Bias** | $\frac{1}{N} \sum (F_i - A_i)$ | **Positive (+)** = Over-forecasting (causes deficit, forced spot buy). <br>**Negative (-)** = Under-forecasting (causes surplus, curtailment risk). |
| **Pearson Correlation ($r$)** | $\frac{\text{Cov}(A, F)}{\sigma_A \sigma_F}$ | Evaluates directional fidelity and curve shape synchronization. |
| **Fisher-Pearson Skewness ($g_1$)** | $\frac{\frac{1}{N} \sum (e_i - \bar{e})^3}{\sigma^3}$ | Gauges asymmetry in error distribution tails. |

---

## 7. Product Pitch & Review Guide (Video Walkthrough Blueprint)

### Part 1: Client Pitch (For Energy Utility Power Procurement Desk)
- **Problem**: Day-ahead procurement is high-stakes. Under-procuring leads to severe cash-out penalties in the Balancing Mechanism when wind falls short; over-procuring locks up capital in thermal contracts that must be dumped into spot markets.
- **Solution**: GridBricks provides an end-to-end command center:
  1. **Dual-Curve Monitoring**: High-contrast visual benchmarking of delivered outturn vs day-ahead predictions.
  2. **Thermal Gap Calculator**: Input your customer portfolio demand; the system calculates the net thermal procurement requirement hour-by-hour and applies empirical MAE buffers.
  3. **Order Export**: Generate clean CSV order schedules ready for EPEX SPOT or Nord Pool auction submission.

### Part 2: Technical Lead Knowledge Transfer
- **Software Architecture**: Clean decoupled architecture with FastAPI async backend and React 19 frontend.
- **SDLC Discipline**: Comprehensive requirements analysis, Elexon API streaming validation, zero-dependency data processing engine for high performance, automated unit tests, and production containerization.
- **Design System**: "Editorial ink on cream paper" theme with `#17150e` warm black ink, `#f0f7f6` mint cream tint, 88px display numbers, and restrained `#cccc25` solar yellow accents.
#   g i r d 
 
 #   g i r d  
 