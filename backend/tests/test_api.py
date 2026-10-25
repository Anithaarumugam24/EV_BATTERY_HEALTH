"""
Automated Backend & API Tests for EV Battery Health & Remaining Life Prediction AI.
"""

import os
import sys
from fastapi.testclient import TestClient

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from main import app
from database import init_db, save_prediction, get_predictions, clear_predictions
from predict import BatteryTelemetryInput, get_prediction_service

client = TestClient(app)

def test_database_crud():
    init_db()
    clear_predictions()
    
    test_record = {
        "battery_id": "Test_Pack_A",
        "cycle": 42,
        "voltage_mean": 3.75,
        "voltage_min": 2.8,
        "current_mean": 2.0,
        "temperature_mean": 24.5,
        "temperature_max": 29.0,
        "discharge_duration_s": 3100.0,
        "internal_resistance_est": 0.05,
        "predicted_soh": 85.5,
        "predicted_rul": 65,
        "predicted_capacity": 1.71,
        "condition": "Good",
        "health_score": 85.5,
        "notes": "Unit test record"
    }
    
    rec_id = save_prediction(test_record)
    assert rec_id > 0
    
    history = get_predictions(limit=10)
    assert len(history) >= 1
    assert history[0]["battery_id"] == "Test_Pack_A"
    assert history[0]["cycle"] == 42
    
    clear_predictions()
    assert len(get_predictions()) == 0

def test_prediction_service():
    service = get_prediction_service()
    assert service.soh_model is not None
    assert service.rul_model is not None
    assert service.scaler is not None

    sample_input = BatteryTelemetryInput(
        cycle=20,
        voltage_mean=3.7,
        voltage_min=2.7,
        current_mean=2.0,
        temperature_mean=25.0,
        temperature_max=30.0,
        discharge_duration_s=3200.0,
        internal_resistance_est=0.052,
        battery_id="Test_Cell_01"
    )

    pred = service.predict(sample_input)
    assert 50.0 <= pred.predicted_soh_percent <= 105.0
    assert pred.predicted_rul_cycles >= 0
    assert pred.predicted_capacity_ah > 1.0
    assert pred.condition in ["Excellent", "Good", "Moderate", "Degraded", "End of Life (EOL)"]
    assert len(pred.recommendations) > 0

def test_api_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["dataset_ready"] is True

def test_api_dataset_info_endpoint():
    response = client.get("/api/dataset-info")
    assert response.status_code == 200
    data = response.json()
    assert data["is_synthetic"] is False
    assert "NASA" in data["dataset_name"]
    assert data["total_usable_samples"] == 636
    assert data["nominal_capacity_ah"] == 2.0
    assert data["eol_capacity_threshold_ah"] == 1.40

def test_api_model_metrics_endpoint():
    response = client.get("/api/model-metrics")
    assert response.status_code == 200
    data = response.json()
    assert "soh" in data
    assert "rul" in data
    assert "GradientBoosting" in data["soh"]
    assert data["soh"]["GradientBoosting"]["R2"] > 0.85

def test_api_analytics_endpoint():
    response = client.get("/api/analytics")
    assert response.status_code == 200
    data = response.json()
    assert "cell_trajectories" in data
    assert "B0005" in data["cell_trajectories"]
    assert len(data["cell_trajectories"]["B0005"]) > 0
    assert len(data["test_eval_points"]) > 0

def test_api_predict_endpoint_valid():
    payload = {
        "cycle": 35,
        "voltage_mean": 3.65,
        "voltage_min": 2.7,
        "current_mean": 2.0,
        "temperature_mean": 26.0,
        "temperature_max": 31.5,
        "discharge_duration_s": 3100.0,
        "internal_resistance_est": 0.055,
        "battery_id": "Fleet_EV_Cell_42"
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["battery_id"] == "Fleet_EV_Cell_42"
    assert "predicted_soh_percent" in data
    assert "predicted_rul_cycles" in data
    assert "condition" in data

def test_api_predict_endpoint_invalid_input():
    # Out of range cycle (negative) and extreme voltage
    payload = {
        "cycle": -5,
        "voltage_mean": 99.0,
        "current_mean": 2.0,
        "temperature_mean": 25.0
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 422  # Pydantic validation failure

def test_api_prediction_history():
    # Add a prediction
    client.post("/api/predict", json={
        "cycle": 10,
        "voltage_mean": 3.8,
        "current_mean": 2.0,
        "temperature_mean": 24.0
    })
    
    response = client.get("/api/prediction-history")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 1
    assert len(data["history"]) >= 1

if __name__ == "__main__":
    print("Running tests...")
    test_database_crud()
    test_prediction_service()
    test_api_health_endpoint()
    test_api_dataset_info_endpoint()
    test_api_model_metrics_endpoint()
    test_api_analytics_endpoint()
    test_api_predict_endpoint_valid()
    test_api_predict_endpoint_invalid_input()
    test_api_prediction_history()
    print("ALL TESTS PASSED SUCCESSFULLY!")
