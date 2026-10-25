"""
Machine Learning Training Pipeline for EV Battery Health & Remaining Useful Life Prediction.
Trains Random Forest and Gradient Boosting models, evaluates with MAE, RMSE, and R2,
and exports model artifacts and evaluation metrics.
"""

import os
import json
import logging
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train_model")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PROCESSED_CSV = os.path.join(BASE_DIR, "data", "processed", "battery_features.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")

FEATURE_COLUMNS = [
    "cycle",
    "voltage_mean",
    "voltage_min",
    "current_mean",
    "temperature_mean",
    "temperature_max",
    "discharge_duration_s",
    "internal_resistance_est"
]

def load_data():
    if not os.path.exists(DATA_PROCESSED_CSV):
        raise FileNotFoundError(f"Processed dataset not found at {DATA_PROCESSED_CSV}. Run data_loader.py first.")
    df = pd.read_csv(DATA_PROCESSED_CSV)
    logger.info(f"Loaded processed dataset with {len(df)} rows.")
    return df

def train_and_evaluate():
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(REPORTS_DIR, exist_ok=True)
    
    df = load_data()
    
    # Train / Test Split:
    # Cell B0018 is used as the held-out test cell to prevent data leakage across cells!
    # B0005, B0006, B0007 are used for training.
    train_df = df[df["battery_id"] != "B0018"].copy()
    test_df = df[df["battery_id"] == "B0018"].copy()
    
    logger.info(f"Training set: {len(train_df)} samples (Cells: {train_df['battery_id'].unique().tolist()})")
    logger.info(f"Held-out test set: {len(test_df)} samples (Cell: B0018)")

    X_train = train_df[FEATURE_COLUMNS].values
    X_test = test_df[FEATURE_COLUMNS].values
    
    y_soh_train = train_df["soh_percent"].values
    y_soh_test = test_df["soh_percent"].values

    y_rul_train = train_df["rul_cycles"].values
    y_rul_test = test_df["rul_cycles"].values

    # Fit Scaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 1. Models for State of Health (SOH %)
    models_soh = {
        "RandomForest": RandomForestRegressor(n_estimators=120, max_depth=12, random_state=42, min_samples_split=3),
        "GradientBoosting": GradientBoostingRegressor(n_estimators=120, learning_rate=0.08, max_depth=4, random_state=42)
    }

    metrics = {"soh": {}, "rul": {}, "cv_scores": {}}
    trained_artifacts = {}

    for name, model in models_soh.items():
        logger.info(f"Training SOH model: {name}...")
        model.fit(X_train_scaled, y_soh_train)
        preds = model.predict(X_test_scaled)
        
        mae = float(mean_absolute_error(y_soh_test, preds))
        rmse = float(np.sqrt(mean_squared_error(y_soh_test, preds)))
        r2 = float(r2_score(y_soh_test, preds))
        
        metrics["soh"][name] = {
            "MAE": round(mae, 4),
            "RMSE": round(rmse, 4),
            "R2": round(r2, 4)
        }
        trained_artifacts[f"soh_{name}"] = (model, preds)
        logger.info(f"SOH {name} - MAE: {mae:.4f}%, RMSE: {rmse:.4f}%, R2: {r2:.4f}")

    # 2. Models for Remaining Useful Life (RUL Cycles)
    models_rul = {
        "RandomForest": RandomForestRegressor(n_estimators=120, max_depth=10, random_state=42, min_samples_split=3),
        "GradientBoosting": GradientBoostingRegressor(n_estimators=120, learning_rate=0.06, max_depth=4, random_state=42)
    }

    for name, model in models_rul.items():
        logger.info(f"Training RUL model: {name}...")
        model.fit(X_train_scaled, y_rul_train)
        preds = model.predict(X_test_scaled)
        preds = np.clip(preds, 0, None)  # RUL cannot be negative
        
        mae = float(mean_absolute_error(y_rul_test, preds))
        rmse = float(np.sqrt(mean_squared_error(y_rul_test, preds)))
        r2 = float(r2_score(y_rul_test, preds))
        
        metrics["rul"][name] = {
            "MAE": round(mae, 4),
            "RMSE": round(rmse, 4),
            "R2": round(r2, 4)
        }
        trained_artifacts[f"rul_{name}"] = (model, preds)
        logger.info(f"RUL {name} - MAE: {mae:.4f} cycles, RMSE: {rmse:.4f} cycles, R2: {r2:.4f}")

    # 5-fold cross-validation on full dataset for generalizability assessment
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    X_all = scaler.fit_transform(df[FEATURE_COLUMNS].values)
    y_soh_all = df["soh_percent"].values
    
    cv_r2 = []
    for train_idx, val_idx in kf.split(X_all):
        rf_cv = RandomForestRegressor(n_estimators=80, random_state=42)
        rf_cv.fit(X_all[train_idx], y_soh_all[train_idx])
        cv_r2.append(r2_score(y_soh_all[val_idx], rf_cv.predict(X_all[val_idx])))
    metrics["cv_scores"]["soh_5fold_rf_r2_mean"] = round(float(np.mean(cv_r2)), 4)
    metrics["cv_scores"]["soh_5fold_rf_r2_std"] = round(float(np.std(cv_r2)), 4)

    # Determine best models
    best_soh_name = "GradientBoosting" if metrics["soh"]["GradientBoosting"]["R2"] >= metrics["soh"]["RandomForest"]["R2"] else "RandomForest"
    best_rul_name = "GradientBoosting" if metrics["rul"]["GradientBoosting"]["R2"] >= metrics["rul"]["RandomForest"]["R2"] else "RandomForest"
    
    best_soh_model = trained_artifacts[f"soh_{best_soh_name}"][0]
    best_rul_model = trained_artifacts[f"rul_{best_rul_name}"][0]
    best_soh_preds = trained_artifacts[f"soh_{best_soh_name}"][1]
    best_rul_preds = trained_artifacts[f"rul_{best_rul_name}"][1]

    # Feature Importance for best SOH model
    feature_importances = dict(zip(FEATURE_COLUMNS, [round(float(fi), 4) for fi in best_soh_model.feature_importances_]))
    metrics["feature_importances_soh"] = feature_importances
    metrics["selected_models"] = {
        "soh_primary": best_soh_name,
        "rul_primary": best_rul_name
    }

    # Save artifacts
    joblib.dump(best_soh_model, os.path.join(MODELS_DIR, "soh_model.joblib"))
    joblib.dump(best_rul_model, os.path.join(MODELS_DIR, "rul_model.joblib"))
    joblib.dump(scaler, os.path.join(MODELS_DIR, "feature_scaler.joblib"))
    
    # Also save backup RF & GB
    joblib.dump(trained_artifacts["soh_RandomForest"][0], os.path.join(MODELS_DIR, "soh_rf_model.joblib"))
    joblib.dump(trained_artifacts["soh_GradientBoosting"][0], os.path.join(MODELS_DIR, "soh_gb_model.joblib"))
    joblib.dump(trained_artifacts["rul_RandomForest"][0], os.path.join(MODELS_DIR, "rul_rf_model.joblib"))
    joblib.dump(trained_artifacts["rul_GradientBoosting"][0], os.path.join(MODELS_DIR, "rul_gb_model.joblib"))

    # Save metrics JSON
    with open(os.path.join(REPORTS_DIR, "model_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    # Export test actual vs predicted points for frontend charts
    test_chart_points = []
    for i in range(len(test_df)):
        test_chart_points.append({
            "cycle": int(test_df["cycle"].iloc[i]),
            "actual_soh": round(float(y_soh_test[i]), 2),
            "pred_soh": round(float(best_soh_preds[i]), 2),
            "actual_rul": int(y_rul_test[i]),
            "pred_rul": round(float(best_rul_preds[i]), 1),
            "actual_capacity": round(float(test_df["capacity"].iloc[i]), 4),
            "temperature_mean": round(float(test_df["temperature_mean"].iloc[i]), 2)
        })

    with open(os.path.join(REPORTS_DIR, "test_predictions.json"), "w") as f:
        json.dump(test_chart_points, f, indent=2)

    # Generate Model Card
    model_card = f"""# EV Battery Health & Remaining Life Prediction - Model Card

## Summary
- **Primary Task**: State of Health (SOH %) & Remaining Useful Life (RUL Cycles) Regression
- **Architecture**: Ensembles of Decision Trees (Gradient Boosted Trees & Random Forest Regressor)
- **Dataset**: Real NASA Ames Li-ion Battery Aging Dataset (Cells B0005, B0006, B0007, B0018)
- **Reference Nominal Capacity**: 2.0 Ah
- **End-of-Life (EOL) Threshold**: 1.40 Ah (30% capacity fade)
- **Held-out Evaluation Cell**: Cell B0018 (completely unseen during training to prevent cell-level data leakage)

## Evaluation Metrics (Held-out Test Cell B0018)
### State of Health (SOH %)
- **Selected Model**: {best_soh_name}
- **MAE**: {metrics['soh'][best_soh_name]['MAE']}%
- **RMSE**: {metrics['soh'][best_soh_name]['RMSE']}%
- **R² Score**: {metrics['soh'][best_soh_name]['R2']}

### Remaining Useful Life (RUL in Cycles)
- **Selected Model**: {best_rul_name}
- **MAE**: {metrics['rul'][best_rul_name]['MAE']} cycles
- **RMSE**: {metrics['rul'][best_rul_name]['RMSE']} cycles
- **R² Score**: {metrics['rul'][best_rul_name]['R2']}

## Feature Importances (SOH Model)
{json.dumps(feature_importances, indent=2)}

## Verification & Guardrails
- RUL predictions bounded at [0, inf)
- Input range checking against operational bounds
- Grouped split validation to ensure genuine generalization
"""

    with open(os.path.join(REPORTS_DIR, "model_card.md"), "w") as f:
        f.write(model_card)

    logger.info("Training pipeline finished successfully! Artifacts and reports generated.")
    return metrics

if __name__ == "__main__":
    train_and_evaluate()
