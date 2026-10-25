
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Dashboard } from './components/Dashboard';
import { PredictionForm } from './components/PredictionForm';
import { Analytics } from './components/Analytics';
import { ModelInfo } from './components/ModelInfo';
import { History } from './components/History';
import {
  fetchHealth,
  fetchDatasetInfo,
  fetchModelMetrics,
  fetchAnalytics
} from './services/api';
import type {
  DatasetInfo,
  ModelMetrics,
  AnalyticsData,
  PredictionResult
} from './types';
import { Zap } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [apiOnline, setApiOnline] = useState<boolean>(false);
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [, setLoadingInitial] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const checkAndLoadData = async () => {
      try {
        const health = await fetchHealth();

        if (!mounted) return;

        setApiOnline(health.status === 'healthy' && health.model_loaded);

        const [dInfo, mMetrics, aData] = await Promise.all([
          fetchDatasetInfo().catch(() => null),
          fetchModelMetrics().catch(() => null),
          fetchAnalytics().catch(() => null)
        ]);

        if (!mounted) return;

        if (dInfo) setDatasetInfo(dInfo);
        if (mMetrics) setModelMetrics(mMetrics);
        if (aData) setAnalyticsData(aData);
      } catch (error) {
        console.warn('Backend not currently reachable:', error);
        if (mounted) setApiOnline(false);
      } finally {
        if (mounted) setLoadingInitial(false);
      }
    };

    void checkAndLoadData();
    const interval = window.setInterval(() => {
      void checkAndLoadData();
    }, 10000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const handlePredictionSuccess = (_result: PredictionResult) => {
    void fetchAnalytics()
      .then(setAnalyticsData)
      .catch((error) => console.warn('Analytics refresh failed:', error));
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          apiOnline={apiOnline}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {activeTab === 'home' && (
            <Home
              setActiveTab={setActiveTab}
              datasetSamples={datasetInfo?.total_usable_samples || 636}
            />
          )}

          {activeTab === 'dashboard' && (
            <Dashboard
              datasetInfo={datasetInfo}
              modelMetrics={modelMetrics}
              analyticsData={analyticsData}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'predict' && (
            <PredictionForm
              onPredictionSuccess={handlePredictionSuccess}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'analytics' && (
            <Analytics
              analyticsData={analyticsData}
              modelMetrics={modelMetrics}
            />
          )}

          {activeTab === 'info' && (
            <ModelInfo
              datasetInfo={datasetInfo}
              modelMetrics={modelMetrics}
            />
          )}

          {activeTab === 'history' && (
            <History setActiveTab={setActiveTab} />
          )}
        </main>
      </div>

      <footer className="border-t border-[#1F2E47] bg-[#080C14] py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">
              EV Battery Health &amp; Life Prediction AI
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              College Course Project &amp; Academic Prototype
            </span>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p>
              Trained on NASA Ames Li-ion Aging Dataset (Cells B0005, B0006,
              B0007, B0018)
            </p>
            <p className="text-slate-500 text-[11px]">
              FastAPI • scikit-learn Gradient Boosting • React • TypeScript •
              Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
