import React, { useState } from 'react';
import { 
  Cpu, 
  Zap, 
  Activity, 
  Clock, 
  BatteryCharging, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { BatteryTelemetryInput, PredictionResult } from '../types';
import { predictBatteryHealth } from '../services/api';

interface PredictionFormProps {
  onPredictionSuccess?: (res: PredictionResult) => void;
  setActiveTab?: (tab: string) => void;
}

export const PredictionForm: React.FC<PredictionFormProps> = ({ 
  onPredictionSuccess,
  setActiveTab 
}) => {
  const [formData, setFormData] = useState<BatteryTelemetryInput>({
    cycle: 45,
    voltage_mean: 3.68,
    voltage_min: 2.70,
    current_mean: 2.00,
    temperature_mean: 25.5,
    temperature_max: 30.2,
    discharge_duration_s: 3150,
    internal_resistance_est: 0.055,
    battery_id: 'EV_Cell_Pack_01'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  // Quick Preset Handlers
  const applyPreset = (preset: 'fresh' | 'mid' | 'degraded' | 'eol') => {
    switch (preset) {
      case 'fresh':
        setFormData({
          cycle: 8,
          voltage_mean: 3.82,
          voltage_min: 2.75,
          current_mean: 2.0,
          temperature_mean: 24.2,
          temperature_max: 28.5,
          discharge_duration_s: 3450,
          internal_resistance_est: 0.046,
          battery_id: 'Fresh_Cell_Pack_A'
        });
        break;
      case 'mid':
        setFormData({
          cycle: 65,
          voltage_mean: 3.64,
          voltage_min: 2.70,
          current_mean: 2.0,
          temperature_mean: 25.8,
          temperature_max: 31.0,
          discharge_duration_s: 3100,
          internal_resistance_est: 0.065,
          battery_id: 'MidLife_Cell_Pack_B'
        });
        break;
      case 'degraded':
        setFormData({
          cycle: 115,
          voltage_mean: 3.48,
          voltage_min: 2.65,
          current_mean: 2.0,
          temperature_mean: 27.5,
          temperature_max: 34.0,
          discharge_duration_s: 2750,
          internal_resistance_est: 0.088,
          battery_id: 'Degraded_Cell_Pack_C'
        });
        break;
      case 'eol':
        setFormData({
          cycle: 155,
          voltage_mean: 3.32,
          voltage_min: 2.50,
          current_mean: 2.0,
          temperature_mean: 30.5,
          temperature_max: 38.0,
          discharge_duration_s: 2300,
          internal_resistance_est: 0.118,
          battery_id: 'NearEOL_Cell_Pack_D'
        });
        break;
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await predictBatteryHealth(formData);
      setPrediction(result);
      if (onPredictionSuccess) {
        onPredictionSuccess(result);
      }
    } catch (err: any) {
      setError(err.message || 'Prediction failed. Ensure the backend API is running.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for condition badge styling
  const getConditionColor = (cond: string) => {
    switch (cond) {
      case 'Excellent':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'Good':
        return 'bg-teal-950 text-teal-400 border-teal-800';
      case 'Moderate':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'Degraded':
        return 'bg-orange-950 text-orange-400 border-orange-800';
      default:
        return 'bg-rose-950 text-rose-400 border-rose-800';
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Cpu className="w-6 h-6 text-cyan-400" />
          AI Battery Health & Remaining Life Predictor
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Input your EV battery sensor telemetry to run real-time Gradient Boosting inference trained on NASA 18650 cycling data.
        </p>
      </div>

      {/* Presets Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-[#1F2E47] flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Quick Test Scenarios:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset('fresh')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#162032] hover:bg-[#1E2C44] text-emerald-300 border border-emerald-800/40 transition-colors cursor-pointer"
          >
            Fresh Cell (Cycle 8)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('mid')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#162032] hover:bg-[#1E2C44] text-cyan-300 border border-cyan-800/40 transition-colors cursor-pointer"
          >
            Mid-Life Cell (Cycle 65)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('degraded')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#162032] hover:bg-[#1E2C44] text-amber-300 border border-amber-800/40 transition-colors cursor-pointer"
          >
            Degraded Cell (Cycle 115)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('eol')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#162032] hover:bg-[#1E2C44] text-rose-300 border border-rose-800/40 transition-colors cursor-pointer"
          >
            Near EOL (Cycle 155)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Form Column */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-[#1F2E47] space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Battery Measurement Inputs
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Battery ID */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Battery Cell / Pack Label
              </label>
              <input
                type="text"
                value={formData.battery_id}
                onChange={(e) => setFormData({ ...formData, battery_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F17] border border-[#1F2E47] text-white text-sm focus:border-cyan-500 focus:outline-none"
                placeholder="e.g. EV_Cell_A1"
              />
            </div>

            {/* Cycle Count */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <label className="font-medium text-slate-300 flex items-center gap-1">
                  Discharge Cycle Number
                  <span className="text-slate-500">(1 - 200 cycles)</span>
                </label>
                <span className="font-mono text-cyan-400 font-bold">{formData.cycle}</span>
              </div>
              <input
                type="range"
                min={1}
                max={200}
                value={formData.cycle}
                onChange={(e) => setFormData({ ...formData, cycle: parseInt(e.target.value) || 1 })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Voltage Mean */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mean Terminal Voltage (V)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="2.5"
                  max="4.5"
                  value={formData.voltage_mean}
                  onChange={(e) => setFormData({ ...formData, voltage_mean: parseFloat(e.target.value) || 3.6 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F17] border border-[#1F2E47] text-white text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">NASA Nominal: ~3.6V - 3.8V</span>
              </div>

              {/* Voltage Min */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Cut-off Min Voltage (V)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="2.0"
                  max="3.5"
                  value={formData.voltage_min}
                  onChange={(e) => setFormData({ ...formData, voltage_min: parseFloat(e.target.value) || 2.7 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F17] border border-[#1F2E47] text-white text-sm font-mono focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Discharge cut-off standard: 2.70V</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Discharge Current */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Average Current Draw (Amps)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="10.0"
                  value={formData.current_mean}
                  onChange={(e) => setFormData({ ...formData, current_mean: parseFloat(e.target.value) || 2.0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F17] border border-[#1F2E47] text-white text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">NASA standard: 2.0A constant discharge</span>
              </div>

              {/* Mean Cell Temp */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Operating Cell Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="10.0"
                  max="60.0"
                  value={formData.temperature_mean}
                  onChange={(e) => setFormData({ ...formData, temperature_mean: parseFloat(e.target.value) || 25.0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F17] border border-[#1F2E47] text-white text-sm font-mono focus:border-cyan-500 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Ambient: 24.0°C</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Discharge Duration */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Discharge Duration (seconds)
                </label>
                <input
                  type="number"
                  step="10"
                  min="500"
                  max="5000"
                  value={formData.discharge_duration_s}
                  onChange={(e) => setFormData({ ...formData, discharge_duration_s: parseFloat(e.target.value) || 3000 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F17] border border-[#1F2E47] text-white text-sm font-mono focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Approx 3,000s (~50 min discharge)</span>
              </div>

              {/* Internal Resistance */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Internal Resistance (Ohms)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.01"
                  max="0.5"
                  value={formData.internal_resistance_est}
                  onChange={(e) => setFormData({ ...formData, internal_resistance_est: parseFloat(e.target.value) || 0.05 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F17] border border-[#1F2E47] text-white text-sm font-mono focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Healthy: &lt;0.07 Ω • Worn: &gt;0.10 Ω</span>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Running Gradient Boosting Inference...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Execute Battery Prognostics Inference
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Results Display Column */}
        <div className="lg:col-span-5 space-y-6">
          {prediction ? (
            <div className="glass-panel p-6 rounded-2xl border border-cyan-500/40 space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Prediction Output</span>
                  <h3 className="text-lg font-bold text-white">{prediction.battery_id}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getConditionColor(prediction.condition)}`}>
                  {prediction.condition}
                </span>
              </div>

              {/* Main Dual Gauges */}
              <div className="grid grid-cols-2 gap-4">
                {/* SOH */}
                <div className="bg-[#0B0F17] p-4 rounded-xl border border-[#1F2E47] text-center space-y-1">
                  <span className="text-xs text-slate-400 font-medium">State of Health</span>
                  <div className="text-3xl font-extrabold text-cyan-400 font-mono">
                    {prediction.predicted_soh_percent}%
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Capacity: {prediction.predicted_capacity_ah} Ah / 2.0 Ah
                  </span>
                </div>

                {/* RUL */}
                <div className="bg-[#0B0F17] p-4 rounded-xl border border-[#1F2E47] text-center space-y-1">
                  <span className="text-xs text-slate-400 font-medium">Remaining Life</span>
                  <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                    {prediction.predicted_rul_cycles}
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Cycles to 1.40 Ah EOL
                  </span>
                </div>
              </div>

              {/* Health Score Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Pack Electrochemical Health Score</span>
                  <span className="font-mono text-white font-bold">{prediction.health_score} / 100</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#1F2E47] overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      prediction.health_score >= 80 ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' :
                      prediction.health_score >= 70 ? 'bg-amber-400' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, prediction.health_score))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>EOL Threshold (70%)</span>
                  <span>Nominal Fresh (100%)</span>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="space-y-3 pt-2 border-t border-[#1F2E47]">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  AI Engineering Recommendations
                </h4>
                <ul className="space-y-2">
                  {prediction.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-xs text-slate-300 bg-[#0B0F17]/60 p-2.5 rounded-lg border border-[#1F2E47]/60 leading-relaxed">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Steps Buttons */}
              {setActiveTab && (
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg bg-[#162032] hover:bg-[#1E2C44] text-slate-200 border border-[#1F2E47] transition-colors"
                  >
                    View in Degradation Curve
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg bg-[#162032] hover:bg-[#1E2C44] text-slate-200 border border-[#1F2E47] transition-colors"
                  >
                    Inspect Prediction Log
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-2xl border border-[#1F2E47] text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#162032] flex items-center justify-center mx-auto text-cyan-400 border border-[#1F2E47]">
                <Activity className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white">Ready for Prognostic Inference</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Adjust telemetry sliders on the left or select a quick test scenario, then click 
                <span className="text-cyan-300 font-semibold"> Execute Battery Prognostics Inference</span>.
              </p>
              <div className="p-3 bg-[#0B0F17] rounded-xl border border-[#1F2E47] text-left text-xs space-y-1">
                <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider block">Real Model Formula:</span>
                <p className="text-slate-400 font-mono text-[11px]">
                  SOH (%) = (Discharge Capacity / 2.0 Ah) × 100
                </p>
                <p className="text-slate-400 font-mono text-[11px]">
                  RUL = Cycles remaining before capacity &lt; 1.40 Ah
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
