import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, 
  Trash2, 
  RefreshCw, 
  Search, 
  Battery, 
  Clock, 
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { HistoryRecord } from '../types';
import { fetchPredictionHistory, clearPredictionHistory } from '../services/api';

interface HistoryProps {
  setActiveTab?: (tab: string) => void;
}

export const History: React.FC<HistoryProps> = ({ setActiveTab }) => {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchPredictionHistory();
      setRecords(data.history || []);
    } catch (err: any) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all stored prediction records from SQLite?')) {
      try {
        await clearPredictionHistory();
        setRecords([]);
        setMessage('Prediction history cleared successfully.');
        setTimeout(() => setMessage(null), 3000);
      } catch (err: any) {
        alert('Failed to clear history');
      }
    }
  };

  const filteredRecords = records.filter(r => 
    r.battery_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.condition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getConditionBadge = (condition: string) => {
    switch (condition) {
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
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-cyan-400" />
            Prediction Audit Log & History
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Persisted SQLite records of user-entered battery measurements and inference outcomes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadHistory}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#162032] hover:bg-[#1E2C44] text-slate-300 text-xs font-semibold border border-[#1F2E47] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {records.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-semibold border border-rose-800/60 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Log
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {message}
        </div>
      )}

      {/* Filter bar */}
      <div className="glass-panel p-4 rounded-2xl border border-[#1F2E47] flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by battery ID or condition (e.g. Good, Degraded)..."
          className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-500"
        />
        <span className="text-xs text-slate-400 whitespace-nowrap font-mono">
          {filteredRecords.length} records
        </span>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-[#1F2E47] overflow-hidden">
        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1F2E47] text-slate-400 uppercase tracking-wider font-mono bg-[#0B0F17]/50">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Battery Label</th>
                  <th className="py-3.5 px-4">Cycle</th>
                  <th className="py-3.5 px-4">Voltage</th>
                  <th className="py-3.5 px-4">Current</th>
                  <th className="py-3.5 px-4">Temp</th>
                  <th className="py-3.5 px-4">Predicted SOH</th>
                  <th className="py-3.5 px-4">Est. RUL</th>
                  <th className="py-3.5 px-4">Condition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2E47]/50 font-mono">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#162032]/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">{rec.timestamp}</td>
                    <td className="py-3 px-4 text-white font-semibold font-sans">{rec.battery_id}</td>
                    <td className="py-3 px-4 text-slate-300">#{rec.cycle}</td>
                    <td className="py-3 px-4 text-slate-300">{rec.voltage_mean} V</td>
                    <td className="py-3 px-4 text-slate-300">{rec.current_mean} A</td>
                    <td className="py-3 px-4 text-slate-300">{rec.temperature_mean} °C</td>
                    <td className="py-3 px-4 text-cyan-400 font-bold">{rec.predicted_soh}%</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">{rec.predicted_rul} cycles</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getConditionBadge(rec.condition)}`}>
                        {rec.condition}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#162032] flex items-center justify-center mx-auto text-slate-400 border border-[#1F2E47]">
              <HistoryIcon className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-white">No Prediction Records Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Run battery measurements through the AI Prediction simulator to log and store state-of-health assessments.
            </p>
            {setActiveTab && (
              <button
                onClick={() => setActiveTab('predict')}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Go to AI Predictor
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
