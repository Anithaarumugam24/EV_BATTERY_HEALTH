# EV Battery Health & Life Prediction AI

> **Predict Battery Health. Estimate Remaining Life. Drive Smarter.**

An end-to-end, physics-informed machine learning web application for Lithium-ion electric vehicle battery State of Health (SOH) and Remaining Useful Life (RUL) estimation. Developed as an academic prototype for college coursework and prognostic research.

---

## 1. Key Features

- **Genuine NASA Ames Dataset Pipeline**: Automates downloading and parsing raw MATLAB `.mat` files from the NASA Ames Prognostics Center of Excellence Li-ion Battery Aging ARC dataset (Cells B0005, B0006, B0007, and B0018).
- **Zero Cross-Cell Data Leakage**: Cell B0018 is completely held out during model training as an unseen test benchmark.
- **Ensemble Machine Learning**: Trains and evaluates **Gradient Boosted Trees** and **Random Forest Regressors** for SOH (%) and RUL (Cycles).
- **Defensible SOH Formulation**: Formulated as measured capacity relative to rated 2.0 Ah nominal cell capacity:
  $$\text{SOH } (\%) = \frac{\text{Measured Discharge Capacity (Ah)}}{2.00 \text{ Ah}} \times 100$$
- **Physically Grounded End-of-Life (EOL)**: Calibrated at 30% capacity fade (1.40 Ah threshold) following NASA published prognostic standards.
- **Interactive Full-Stack Web Application**:
  - **Overview / Landing Page**: Core highlights, interactive stats, architecture overview, and academic prototype disclaimer.
  - **Live Dashboard**: SOH condition badge, capacity degradation trajectory, active model metrics, and telemetry status.
  - **Interactive AI Predictor**: Quick preset scenarios (Fresh Cell, Mid-Life, Degraded, Near EOL), input sliders for cycle, voltage, current, temperature, and duration, returning real-time predictions and engineering recommendations.
  - **Degradation Analytics**: Multi-cell aging comparison across all 4 NASA cells, plus Actual vs Predicted SOH curves on held-out test data.
  - **Model Card & Dataset Specification**: Feature importance breakdowns, error metrics (MAE, RMSE, R²), dataset provenance, and physical assumptions.
  - **Prediction Audit Log**: Persistent SQLite database storing past user predictions with filtering and clear controls.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide React
- **Backend API**: Python 3.13, FastAPI, Uvicorn, Pydantic v2
- **Data & Machine Learning**: NumPy, pandas, SciPy (`scipy.io`), scikit-learn, joblib
- **Persistent Storage**: SQLite (`data/predictions.db`)

---

## 3. Measured Evaluation Metrics (Held-out Test Cell B0018)

Evaluated on 132 completely held-out cycles of Cell B0018:

| Model | Target | MAE | RMSE | $R^2$ Score | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Gradient Boosting** | **State of Health (SOH %)** | **1.4865%** | **1.8724%** | **0.9411** | **Primary Active** |
| Random Forest | State of Health (SOH %) | 2.2061% | 2.6727% | 0.8800 | Baseline |
| **Gradient Boosting** | **Remaining Life (RUL Cycles)**| **16.14 Cycles** | **18.81 Cycles** | **0.6547** | **Primary Active** |
| Random Forest | Remaining Life (RUL Cycles) | 18.00 Cycles | 22.02 Cycles | 0.5269 | Baseline |

*5-fold cross-validation mean $R^2$ across all cells: 0.95+.*

---

## 4. Project Directory Structure

```text
ev-battery-health-ai/
├── backend/
│   ├── data_loader.py          # NASA dataset downloader, extractor & preprocessor
│   ├── train_model.py          # ML training pipeline, cross-validation & evaluation
│   ├── predict.py              # Inference service, bounds checking & recommendations
│   ├── database.py             # SQLite prediction history storage
│   ├── main.py                 # FastAPI application & REST endpoints
│   └── tests/
│       └── test_api.py         # Automated API, database, and prediction test suite
├── data/
│   ├── raw/                    # Raw NASA ZIP archives and extracted MAT files
│   ├── processed/
│   │   ├── battery_features.csv    # Standardized 636-sample dataset
│   │   └── dataset_summary.json    # Metadata and statistics
│   └── predictions.db          # SQLite prediction log database
├── models/
│   ├── soh_model.joblib        # Trained SOH Gradient Boosting model
│   ├── rul_model.joblib        # Trained RUL Gradient Boosting model
│   └── feature_scaler.joblib   # StandardScaler pipeline
├── reports/
│   ├── model_metrics.json      # Evaluation metrics (MAE, RMSE, R2)
│   ├── test_predictions.json   # Actual vs Predicted points for charts
│   └── model_card.md           # Model transparency card
├── frontend/
│   ├── src/
│   │   ├── components/         # Home, Dashboard, PredictionForm, Analytics, ModelInfo, History, Navbar
│   │   ├── services/api.ts     # FastAPI client
│   │   ├── types/index.ts      # TypeScript interfaces
│   │   ├── App.tsx             # Root application
│   │   ├── main.tsx            # Entry point
│   │   └── index.css           # Styling
│   ├── package.json
│   └── vite.config.ts
├── requirements.txt            # Python dependencies
└── README.md
```

---

## 5. Quickstart & Execution Guide (Windows PowerShell)

### Step 1: Install Python Dependencies
```powershell
py -3.13 -m pip install -r requirements.txt
```

### Step 2: Download & Process NASA Dataset
```powershell
py -3.13 backend/data_loader.py
```
*Downloads the NASA Li-ion battery dataset from the PHM S3 repository mirror, extracts `B0005.mat`, `B0006.mat`, `B0007.mat`, and `B0018.mat`, cleans records, and generates `data/processed/battery_features.csv`.*

### Step 3: Train & Evaluate ML Models
```powershell
py -3.13 backend/train_model.py
```
*Trains Gradient Boosting and Random Forest regressor ensembles, tests on held-out Cell B0018, and writes artifacts to `models/` and `reports/`.*

### Step 4: Run Automated Backend Tests
```powershell
py -3.13 backend/tests/test_api.py
```

### Step 5: Start the Backend API Server
```powershell
cd backend
py -3.13 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`

### Step 6: Start the Frontend Application
In a second PowerShell window:
```powershell
cd frontend
npm run dev
```
- Frontend Web App: `http://127.0.0.1:5173`

---

## 6. Academic Prototype Disclaimer

This application is an academic prototype built for lithium-ion battery prognostics research. The machine learning models are trained on laboratory-controlled constant current discharge tests from the NASA Ames Prognostics Center of Excellence. In real electric vehicle applications, battery packs experience variable regenerative braking spikes, ambient temperature swings from winter freezing to summer heat, and multi-cell imbalance.
