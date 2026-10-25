# EV Battery Health & Remaining Life Prediction - Model Card

## Summary
- **Primary Task**: State of Health (SOH %) & Remaining Useful Life (RUL Cycles) Regression
- **Architecture**: Ensembles of Decision Trees (Gradient Boosted Trees & Random Forest Regressor)
- **Dataset**: Real NASA Ames Li-ion Battery Aging Dataset (Cells B0005, B0006, B0007, B0018)
- **Reference Nominal Capacity**: 2.0 Ah
- **End-of-Life (EOL) Threshold**: 1.40 Ah (30% capacity fade)
- **Held-out Evaluation Cell**: Cell B0018 (completely unseen during training to prevent cell-level data leakage)

## Evaluation Metrics (Held-out Test Cell B0018)
### State of Health (SOH %)
- **Selected Model**: GradientBoosting
- **MAE**: 1.4865%
- **RMSE**: 1.8724%
- **R² Score**: 0.9411

### Remaining Useful Life (RUL in Cycles)
- **Selected Model**: GradientBoosting
- **MAE**: 16.1352 cycles
- **RMSE**: 18.8141 cycles
- **R² Score**: 0.6547

## Feature Importances (SOH Model)
{
  "cycle": 0.0671,
  "voltage_mean": 0.0015,
  "voltage_min": 0.0018,
  "current_mean": 0.161,
  "temperature_mean": 0.0002,
  "temperature_max": 0.0015,
  "discharge_duration_s": 0.7341,
  "internal_resistance_est": 0.0327
}

## Verification & Guardrails
- RUL predictions bounded at [0, inf)
- Input range checking against operational bounds
- Grouped split validation to ensure genuine generalization
