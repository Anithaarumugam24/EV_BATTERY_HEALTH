"""
Prediction service for EV Battery Health & Remaining Life Prediction AI.
Loads trained models, performs inference, validates input telemetry, and provides actionable recommendations.
"""

import os
import joblib
import numpy as np
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

class BatteryTelemetryInput(BaseModel):
    cycle: int = Field(..., ge=1, le=5000, description="Cycle count / charge-discharge cycles")
    voltage_mean: float = Field(..., ge=2.0, le=5.0, description="Mean terminal voltage during discharge (Volts)")
    voltage_min: Optional[float] = Field(None, ge=1.5, le=4.5, description="End-of-discharge cut-off voltage (Volts)")
    current_mean: float = Field(..., ge=0.05, le=30.0, description="Average discharge current draw (Amps)")
    temperature_mean: float = Field(..., ge=-20.0, le=80.0, description="Average battery cell temperature (°C)")
    temperature_max: Optional[float] = Field(None, ge=-20.0, le=90.0, description="Peak battery cell temperature (°C)")
    discharge_duration_s: Optional[float] = Field(None, ge=100.0, le=36000.0, description="Discharge phase duration in seconds")
    internal_resistance_est: Optional[float] = Field(None, ge=0.005, le=1.5, description="Estimated internal resistance (Ohms)")
    battery_id: Optional[str] = Field("EV_Pack_Cell", description="Battery identifier or label")

class PredictionResponse(BaseModel):
    battery_id: str
    cycle: int
    predicted_soh_percent: float
    predicted_rul_cycles: int
    predicted_capacity_ah: float
    nominal_reference_capacity_ah: float
    condition: str
    health_score: float
    risk_level: str
    feature_summary: Dict[str, float]
    recommendations: List[str]

class PredictionService:
    def __init__(self):
        self.soh_model = None
        self.rul_model = None
        self.scaler = None
        self.load_models()

    def load_models(self):
        soh_path = os.path.join(MODELS_DIR, "soh_model.joblib")
        rul_path = os.path.join(MODELS_DIR, "rul_model.joblib")
        scaler_path = os.path.join(MODELS_DIR, "feature_scaler.joblib")

        if os.path.exists(soh_path) and os.path.exists(rul_path) and os.path.exists(scaler_path):
            self.soh_model = joblib.load(soh_path)
            self.rul_model = joblib.load(rul_path)
            self.scaler = joblib.load(scaler_path)
        else:
            raise FileNotFoundError("Model artifacts not found. Please run train_model.py first.")

    def predict(self, telemetry: BatteryTelemetryInput) -> PredictionResponse:
        # Impute sensible defaults for optional features if omitted
        v_min = telemetry.voltage_min if telemetry.voltage_min is not None else max(2.5, telemetry.voltage_mean - 0.8)
        t_max = telemetry.temperature_max if telemetry.temperature_max is not None else telemetry.temperature_mean + 4.5
        duration = telemetry.discharge_duration_s if telemetry.discharge_duration_s is not None else 3200.0
        
        # Estimate internal resistance if not provided: higher as cycle increases
        if telemetry.internal_resistance_est is not None:
            ir_est = telemetry.internal_resistance_est
        else:
            ir_est = round(0.045 + (telemetry.cycle * 0.00035), 4)

        features = [
            telemetry.cycle,
            telemetry.voltage_mean,
            v_min,
            telemetry.current_mean,
            telemetry.temperature_mean,
            t_max,
            duration,
            ir_est
        ]

        # Scale features
        X = np.array([features])
        X_scaled = self.scaler.transform(X)

        # Predict
        raw_soh = float(self.soh_model.predict(X_scaled)[0])
        raw_rul = float(self.rul_model.predict(X_scaled)[0])

        # Post-process bounds
        predicted_soh = round(float(np.clip(raw_soh, 40.0, 105.0)), 2)
        predicted_rul = int(max(0, round(raw_rul)))
        predicted_capacity = round((predicted_soh / 100.0) * 2.0, 4)

        # Health condition & Risk Level
        if predicted_soh >= 90.0:
            condition = "Excellent"
            risk_level = "Low Risk"
            health_score = min(100.0, round(predicted_soh, 1))
        elif predicted_soh >= 80.0:
            condition = "Good"
            risk_level = "Normal"
            health_score = round(predicted_soh, 1)
        elif predicted_soh >= 75.0:
            condition = "Moderate"
            risk_level = "Moderate Wear"
            health_score = round(predicted_soh, 1)
        elif predicted_soh >= 70.0:
            condition = "Degraded"
            risk_level = "High Degradation"
            health_score = round(predicted_soh, 1)
        else:
            condition = "End of Life (EOL)"
            risk_level = "Critical / Replacement Required"
            health_score = max(0.0, round(predicted_soh, 1))

        # Recommendations based on battery telemetry
        recommendations = []
        if telemetry.temperature_mean > 38.0 or t_max > 45.0:
            recommendations.append("High cell operating temperature detected. Ensure active thermal management / liquid cooling is functioning.")
        if ir_est > 0.12:
            recommendations.append("Elevated internal resistance detected. Limit high-power fast charging (DCFC) to reduce thermal stress.")
        if predicted_soh < 75.0:
            recommendations.append("Capacity fade exceeds 25%. Plan for battery pack re-balancing or warranty health inspection.")
        if predicted_rul <= 25:
            recommendations.append(f"Critical remaining useful life ({predicted_rul} cycles to EOL threshold). Schedule cell diagnostics.")
        if not recommendations:
            recommendations.append("Battery operating well within optimal safety and electrochemical limits. Maintain standard 20%-80% charging habits.")

        return PredictionResponse(
            battery_id=telemetry.battery_id or "EV_Pack_Cell",
            cycle=telemetry.cycle,
            predicted_soh_percent=predicted_soh,
            predicted_rul_cycles=predicted_rul,
            predicted_capacity_ah=predicted_capacity,
            nominal_reference_capacity_ah=2.0,
            condition=condition,
            health_score=health_score,
            risk_level=risk_level,
            feature_summary={
                "cycle": telemetry.cycle,
                "voltage_mean": telemetry.voltage_mean,
                "voltage_min": v_min,
                "current_mean": telemetry.current_mean,
                "temperature_mean": telemetry.temperature_mean,
                "temperature_max": t_max,
                "discharge_duration_s": duration,
                "internal_resistance_est": ir_est
            },
            recommendations=recommendations
        )

# Global service instance
prediction_service = None

def get_prediction_service() -> PredictionService:
    global prediction_service
    if prediction_service is None:
        prediction_service = PredictionService()
    return prediction_service
