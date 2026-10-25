export interface BatteryTelemetryInput {
  cycle: number;
  voltage_mean: number;
  voltage_min?: number;
  current_mean: number;
  temperature_mean: number;
  temperature_max?: number;
  discharge_duration_s?: number;
  internal_resistance_est?: number;
  battery_id?: string;
}

export interface PredictionResult {
  battery_id: string;
  cycle: number;
  predicted_soh_percent: number;
  predicted_rul_cycles: number;
  predicted_capacity_ah: number;
  nominal_reference_capacity_ah: number;
  condition: string;
  health_score: number;
  risk_level: string;
  feature_summary: {
    cycle: number;
    voltage_mean: number;
    voltage_min: number;
    current_mean: number;
    temperature_mean: number;
    temperature_max: number;
    discharge_duration_s: number;
    internal_resistance_est: number;
  };
  recommendations: string[];
}

export interface HistoryRecord {
  id: number;
  timestamp: string;
  battery_id: string;
  cycle: number;
  voltage_mean: number;
  voltage_min: number;
  current_mean: number;
  temperature_mean: number;
  temperature_max: number;
  discharge_duration_s: number;
  internal_resistance_est: number;
  predicted_soh: number;
  predicted_rul: number;
  predicted_capacity: number;
  condition: string;
  health_score: number;
  notes?: string;
}

export interface DatasetInfo {
  dataset_name: string;
  source: string;
  license: string;
  is_synthetic: boolean;
  total_usable_samples: number;
  cells: string[];
  samples_per_cell: Record<string, number>;
  nominal_capacity_ah: number;
  eol_capacity_threshold_ah: number;
  eol_soh_threshold_percent: number;
  features: string[];
  targets: string[];
  statistics: {
    capacity_min: number;
    capacity_max: number;
    soh_min: number;
    soh_max: number;
    rul_max: number;
    cycle_max: number;
  };
  limitations: string[];
}

export interface ModelMetrics {
  soh: {
    [modelName: string]: {
      MAE: number;
      RMSE: number;
      R2: number;
    };
  };
  rul: {
    [modelName: string]: {
      MAE: number;
      RMSE: number;
      R2: number;
    };
  };
  cv_scores: {
    soh_5fold_rf_r2_mean: number;
    soh_5fold_rf_r2_std: number;
  };
  feature_importances_soh: Record<string, number>;
  selected_models: {
    soh_primary: string;
    rul_primary: string;
  };
}

export interface AnalyticsData {
  cell_trajectories: Record<
    string,
    Array<{
      cycle: number;
      capacity: number;
      soh: number;
      temp: number;
      voltage: number;
    }>
  >;
  test_eval_points: Array<{
    cycle: number;
    actual_soh: number;
    pred_soh: number;
    actual_rul: number;
    pred_rul: number;
    actual_capacity: number;
    temperature_mean: number;
  }>;
  reference_nominal_capacity: number;
  eol_capacity_threshold: number;
}
