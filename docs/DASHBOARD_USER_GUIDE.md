# VarshaPurvanumanAI (SIH26080) — Dashboard User & Evaluator Guide

**Ministry of Earth Sciences (MoES) / Smart India Hackathon 2024**  
**Audience**: SIH Jury Evaluators, IMD Operational Forecasters, State Disaster Management Authorities

---

## 1. Quick Start Instructions

### 1.1 Starting the Complete System
```bash
# Terminal 1: Start Backend API (FastAPI)
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000

# Terminal 2: Start Frontend Application (React + Vite)
cd frontend
npm run dev -- --port 3000
```
Open **`http://localhost:3000`** in your modern browser.

---

## 2. Key Dashboard Capabilities

### 2.1 Header & Operational Provenance
- **Project Identity**: `VarshaPurvanumanAI (SIH26080)`.
- **REAL DATA Badge**: Highlights that inputs are verified against the Zenodo IMD 0.25° Gridded Rainfall Benchmark & GFS 0.25° NWP inputs.
- **API Status**: Confirms live connectivity to the backend machine learning model registry.
- **Theme Toggle**: Switch between Light Mode and Dark Mode for high-contrast viewing.

### 2.2 Station-Level Benchmark Scope
- Top banner explicitly indicates:
  `Target Location: PUNE BENCHMARK STATION (18.50°N, 73.80°E)`
  `Station-level benchmark • Spatial district aggregate unavailable`
- The system prevents scientific error by clearly separating point observations from regional area averages.

### 2.3 Interactive Map & Layer Controls
- **Layer 1: AI Corrected**: Shows bias-corrected 24h cumulative rainfall.
- **Layer 2: Raw NWP**: Shows uncorrected Global Forecast System (GFS) surface precipitation.
- **Layer 3: Δ Bias**: Highlights where the AI model reduces or increases raw precipitation ($\Delta = \text{Corrected} - \text{Raw NWP}$).
- **Layer 4: Regime**: Color-coded synoptic weather regime classification.
- **Layer 5: P(≥15.6mm)**: Moderate rainfall probability of exceedance map.
- **Rainfall Scale Legend**: Clearly defines IMD standard thresholds from `< 2.5 mm` (Dry) to `≥ 115.6 mm` (Very Heavy Rain), demarcated into **Operational [OP]** and **Experimental [EXP]** categories.

### 2.4 Weather Regime Classification Panel
- **Operational Classification**: Displays the assigned regime (e.g., `OTHER`, `ACTIVE_MONSOON`, `BREAK_MONSOON`, `COASTAL_OROGRAPHIC`, `DEPRESSION`).
- **Class Posterior Distribution**: Real-time bar charts of $P(\text{Regime} \mid X)$ across all 5 classes.
- **Operational Submodel**: Displays the exact submodel routed by the hierarchical conditioning system (e.g., `dedicated_other` or `dedicated_break_monsoon`).

### 2.5 Heavy Rainfall Probability Suite
- Displays calibrated probabilities of exceedance across 5 verified thresholds:
  - $\ge 2.5\text{ mm}$ (Rainy Day - Operational)
  - $\ge 7.5\text{ mm}$ (Surge Proxy - Experimental)
  - $\ge 15.6\text{ mm}$ (Moderate Rain - Operational)
  - $\ge 64.5\text{ mm}$ (Heavy Rain - Operational)
  - $\ge 115.6\text{ mm}$ (Very Heavy Rain - Operational)
- **Risk Advisories**: Automatically triggers an `ELEVATED RISK` badge if $P \ge \tau^*$ (optimal decision threshold).
- **Official Warning Separation**: Prominently notes that model probabilities are scientific numerical estimates and that official government alerts are separate.
- **Validation Caveats**: Explicitly notes *"Limited validation data (0 test events)"* for $\ge 64.5\text{ mm}$ and $\ge 115.6\text{ mm}$ in the June 2024 test period.

### 2.6 Authoritative Verification Engine (Phase 8 Results)
- **3-Model Comparison**: Evaluates **Raw NWP** vs **Global ML** vs **Regime-Aware ML** on the held-out June 2024 test cohort:
  - Raw NWP RMSE: `11.62 mm`
  - Global ML RMSE: `9.03 mm` (22.3% error reduction)
  - Regime-Aware ML RMSE: `9.61 mm` (17.3% error reduction)
- **FSS Transparency**: Spatial Fractions Skill Score (FSS) is explicitly displayed as **`NOT COMPUTABLE`** because point-station observations do not provide the necessary 2-D spatial grid.
- **Tabs**: Switch between Threshold Skill (POD, FAR, CSI, ETS), Regime Breakdown, and Probability Calibration (Brier Score, ROC-AUC).

### 2.7 Interactive SIH Scenario Simulator (Demo Mode)
- Click **Demo Mode** in the header to open the simulator modal.
- Adjust sliders for Raw NWP Rainfall, Wind Speed, Humidity, CAPE, Temperature, and Surface Pressure.
- Click **Execute AI Model Pipeline** to run live inference against the trained backend models.
- When applied, the screen is clearly watermarked with **`DEMO DATA`** to ensure jury members understand it is a simulation.
- Click **Reset to Real Data** at any time to return to verified historical benchmark values.
