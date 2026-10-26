import { 
  BatteryTelemetryInput, 
  PredictionResult, 
  HistoryRecord, 
  DatasetInfo, 
  ModelMetrics, 
  AnalyticsData 
} from '../types';

const API_BASE_URL = '/api';

export async function fetchHealth(): Promise<{ status: string; model_loaded: boolean; dataset_ready: boolean }> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchDatasetInfo(): Promise<DatasetInfo> {
  const res = await fetch(`${API_BASE_URL}/dataset-info`);
  if (!res.ok) throw new Error('Failed to fetch dataset info');
  return res.json();
}

export async function fetchModelMetrics(): Promise<ModelMetrics> {
  const res = await fetch(`${API_BASE_URL}/model-metrics`);
  if (!res.ok) throw new Error('Failed to fetch model metrics');
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE_URL}/analytics`);
  if (!res.ok) throw new Error('Failed to fetch analytics data');
  return res.json();
}

export async function predictBatteryHealth(telemetry: BatteryTelemetryInput): Promise<PredictionResult> {
  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(telemetry)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Battery health prediction failed.');
  }
  return res.json();
}

export async function fetchPredictionHistory(limit: number = 50): Promise<{ history: HistoryRecord[]; count: number }> {
  const res = await fetch(`${API_BASE_URL}/prediction-history?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch prediction history');
  return res.json();
}

export async function clearPredictionHistory(): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE_URL}/prediction-history`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to clear prediction history');
  return res.json();
}
