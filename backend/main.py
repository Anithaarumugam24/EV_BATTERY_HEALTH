"""
FastAPI Backend Application for EV Battery Health & Remaining Life Prediction AI.
Tagline: Predict Battery Health. Estimate Remaining Life. Drive Smarter.
"""

import os
import json
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import csv

from database import init_db, save_prediction, get_predictions, clear_predictions
from predict import BatteryTelemetryInput, PredictionResponse, get_prediction_service

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_SUMMARY_JSON = os.path.join(BASE_DIR, "data", "processed", "dataset_summary.json")
BATTERY_FEATURES_CSV = os.path.join(BASE_DIR, "data", "processed", "battery_features.csv")
MODEL_METRICS_JSON = os.path.join(BASE_DIR, "reports", "model_metrics.json")
TEST_PREDICTIONS_JSON = os.path.join(BASE_DIR, "reports", "test_predictions.json")

# Initialize database
init_db()

app = FastAPI(
    title="EV Battery Health & Life Prediction AI API",
    description="Real ML API powered by NASA Ames Li-ion Battery Aging Dataset for State of Health (SOH) and Remaining Useful Life (RUL) estimation.",
    version="1.0.0"
)

# Enable CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")
SERVE_FRONTEND = os.path.isfile(os.path.join(FRONTEND_DIST, "index.html"))

@app.get("/")
def root():
    if SERVE_FRONTEND:
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
    return {
        "app": "EV Battery Health & Life Prediction AI",
        "tagline": "Predict Battery Health. Estimate Remaining Life. Drive Smarter.",
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    try:
        service = get_prediction_service()
        model_ready = service.soh_model is not None and service.rul_model is not None
    except Exception:
        model_ready = False

    dataset_ready = os.path.exists(BATTERY_FEATURES_CSV)

    return {
        "status": "healthy",
        "model_loaded": model_ready,
        "dataset_ready": dataset_ready,
        "models": ["GradientBoostingRegressor", "RandomForestRegressor"]
    }

@app.get("/api/dataset-info")
def get_dataset_info():
    if not os.path.exists(DATASET_SUMMARY_JSON):
        raise HTTPException(status_code=404, detail="Dataset summary not found. Run data_loader.py first.")
    with open(DATASET_SUMMARY_JSON, "r") as f:
        return json.load(f)

@app.get("/api/model-metrics")
def get_model_metrics():
    if not os.path.exists(MODEL_METRICS_JSON):
        raise HTTPException(status_code=404, detail="Model metrics report not found. Run train_model.py first.")
    with open(MODEL_METRICS_JSON, "r") as f:
        return json.load(f)

@app.get("/api/analytics")
def get_analytics():
    """Returns degradation series across all NASA battery cells and Actual vs Predicted test data."""
    if not os.path.exists(BATTERY_FEATURES_CSV):
        raise HTTPException(status_code=404, detail="Processed dataset not found.")

    with open(BATTERY_FEATURES_CSV, newline="") as f:
        all_rows = list(csv.DictReader(f))

    # 1. Capacity degradation trajectory by cell
    cells_data = {}
    for cell_id in ["B0005", "B0006", "B0007", "B0018"]:
        sub = sorted(
            (r for r in all_rows if r["battery_id"] == cell_id),
            key=lambda r: int(float(r["cycle"]))
        )
        # Subsample if too dense to keep API snappy
        step = max(1, len(sub) // 40)
        sub_sample = sub[::step]

        cells_data[cell_id] = [
            {
                "cycle": int(float(row["cycle"])),
                "capacity": round(float(row["capacity"]), 4),
                "soh": round(float(row["soh_percent"]), 2),
                "temp": round(float(row["temperature_mean"]), 1),
                "voltage": round(float(row["voltage_mean"]), 3)
            }
            for row in sub_sample
        ]

    # 2. Actual vs Predicted on held-out test cell B0018
    test_eval_points = []
    if os.path.exists(TEST_PREDICTIONS_JSON):
        with open(TEST_PREDICTIONS_JSON, "r") as f:
            test_eval_points = json.load(f)

    return {
        "cell_trajectories": cells_data,
        "test_eval_points": test_eval_points,
        "reference_nominal_capacity": 2.0,
        "eol_capacity_threshold": 1.40
    }

@app.post("/api/predict", response_model=PredictionResponse)
def run_prediction(telemetry: BatteryTelemetryInput):
    try:
        service = get_prediction_service()
        result = service.predict(telemetry)

        # Persist prediction in SQLite
        save_prediction({
            "battery_id": result.battery_id,
            "cycle": result.cycle,
            "voltage_mean": telemetry.voltage_mean,
            "voltage_min": result.feature_summary.get("voltage_min", 2.7),
            "current_mean": telemetry.current_mean,
            "temperature_mean": telemetry.temperature_mean,
            "temperature_max": result.feature_summary.get("temperature_max", 30.0),
            "discharge_duration_s": result.feature_summary.get("discharge_duration_s", 3000.0),
            "internal_resistance_est": result.feature_summary.get("internal_resistance_est", 0.05),
            "predicted_soh": result.predicted_soh_percent,
            "predicted_rul": result.predicted_rul_cycles,
            "predicted_capacity": result.predicted_capacity_ah,
            "condition": result.condition,
            "health_score": result.health_score,
            "notes": f"Predicted using {telemetry.cycle} cycles telemetry."
        })

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/api/prediction-history")
def get_history(limit: int = 50):
    records = get_predictions(limit=limit)
    return {"history": records, "count": len(records)}

@app.delete("/api/prediction-history")
def clear_history():
    clear_predictions()
    return {"status": "cleared", "message": "Prediction history successfully cleared."}

# Serve the built React app (only when frontend/dist exists, e.g. in the Docker/Render deployment)
if SERVE_FRONTEND:
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        candidate = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
