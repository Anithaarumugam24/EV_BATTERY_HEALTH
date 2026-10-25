
import React from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BatteryCharging,
  CheckCircle2,
  Clock3,
  Cpu,
  Database,
  Gauge,
  Radio,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DatasetInfo, ModelMetrics, AnalyticsData } from '../types';

interface DashboardProps {
  datasetInfo: DatasetInfo | null;
  modelMetrics: ModelMetrics | null;
  analyticsData: AnalyticsData | null;
  setActiveTab: (tab: string) => void;
}

const referenceData = [
  { cycle: 1, soh: 92.8 },
  { cycle: 20, soh: 90.7 },
  { cycle: 40, soh: 88.2 },
  { cycle: 60, soh: 85.2 },
  { cycle: 80, soh: 81.6 },
  { cycle: 100, soh: 77.1 },
  { cycle: 120, soh: 72.6 },
  { cycle: 140, soh: 69.1 },
  { cycle: 160, soh: 66.2 },
];

const safeNumber = (value: unknown, fallback: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const formatNumber = (value: unknown, digits = 2) =>
  safeNumber(value, 0).toFixed(digits);

export const Dashboard: React.FC<DashboardProps> = ({
  datasetInfo,
  modelMetrics,
  analyticsData,
  setActiveTab,
}) => {
  const trajectory =
    analyticsData?.cell_trajectories?.['B0005'] || referenceData;

  const primaryModel =
    modelMetrics?.selected_models?.soh_primary || 'GradientBoosting';

  const sohMetrics = modelMetrics?.soh?.[primaryModel] || {
    MAE: 1.4865,
    RMSE: 1.8724,
    R2: 0.9411,
  };

  const rulModel =
    modelMetrics?.selected_models?.rul_primary || primaryModel;

  const rulMetrics = modelMetrics?.rul?.[rulModel] || {
    MAE: 16.14,
    RMSE: 18.81,
    R2: 0.6547,
  };

  const sampleCount = datasetInfo?.total_usable_samples || 636;
  const accuracy = safeNumber(sohMetrics.R2, 0.9411) * 100;
  const latestPoint = trajectory[trajectory.length - 1];
  const soh = safeNumber(latestPoint?.soh, 66.2);

  const metrics = [
    {
      label: 'State of Health',
      value: `${formatNumber(soh, 1)}%`,
      note: 'Reference trajectory',
      icon: BatteryCharging,
      color: 'cyan',
      percent: Math.max(0, Math.min(100, soh)),
    },
    {
      label: 'Model R² Score',
      value: `${formatNumber(accuracy, 1)}%`,
      note: 'SOH model evaluation',
      icon: Gauge,
      color: 'emerald',
      percent: Math.max(0, Math.min(100, accuracy)),
    },
    {
      label: 'RUL Model MAE',
      value: formatNumber(rulMetrics.MAE, 1),
      note: 'Mean error · cycles',
      icon: Clock3,
      color: 'violet',
      percent: Math.max(0, Math.min(100, 100 - safeNumber(rulMetrics.MAE, 16.14))),
    },
    {
      label: 'Dataset Samples',
      value: String(sampleCount),
      note: 'Reported usable samples',
      icon: Database,
      color: 'amber',
      percent: Math.max(0, Math.min(100, (sampleCount / 636) * 100)),
    },
  ];

  return (
    <div className="ev-cosmos relative isolate min-h-screen overflow-hidden py-7 text-white sm:py-9">
      <style>{`
        .ev-cosmos {
          --cyan: #67e8f9;
          --teal: #5eead4;
          --violet: #a78bfa;
          --line: rgba(103,232,249,.19);
          background:
            radial-gradient(ellipse at 50% 4%, rgba(8,145,178,.14), transparent 42%),
            radial-gradient(ellipse at 100% 38%, rgba(124,58,237,.10), transparent 38%),
            radial-gradient(ellipse at 0% 65%, rgba(13,148,136,.09), transparent 38%);
        }

        .ev-cosmos-scene {
          position: fixed;
          z-index: -2;
          pointer-events: none;
          inset: 0;
          overflow: hidden;
          background:
            radial-gradient(ellipse at 50% 48%, rgba(8,47,73,.17), transparent 60%);
        }

        .ev-cosmos-grid {
          position: absolute;
          inset: 0;
          opacity: .25;
          background-image:
            linear-gradient(rgba(103,232,249,.075) 1px, transparent 1px),
            linear-gradient(90deg, rgba(103,232,249,.075) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse at 50% 40%, black, transparent 80%);
        }

        .ev-cosmos-halo {
          position: absolute;
          width: min(76vw, 850px);
          aspect-ratio: 1;
          top: 5%;
          left: 50%;
          border: 1px solid rgba(34,211,238,.10);
          border-radius: 50%;
          transform: translateX(-50%);
          box-shadow:
            0 0 100px rgba(8,145,178,.055),
            inset 0 0 90px rgba(8,145,178,.035);
          animation: cosmosBreathe 9s ease-in-out infinite alternate;
        }

        .ev-cosmos-halo::before,
        .ev-cosmos-halo::after {
          content: "";
          position: absolute;
          border: 1px solid rgba(167,139,250,.13);
          border-radius: 50%;
          inset: 9%;
          animation: cosmosRotate 48s linear infinite;
        }

        .ev-cosmos-halo::after {
          inset: 19%;
          border-color: rgba(94,234,212,.16);
          animation-direction: reverse;
          animation-duration: 32s;
        }

        .ev-cosmos-beam {
          position: absolute;
          left: -25%;
          width: 150%;
          height: 2px;
          opacity: .65;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(34,211,238,.04) 15%,
            rgba(34,211,238,.9) 48%,
            rgba(167,139,250,.6) 68%,
            transparent 100%
          );
          box-shadow: 0 0 18px rgba(34,211,238,.36);
          transform: rotate(-17deg);
          animation: cosmosBeam 11s ease-in-out infinite alternate;
        }

        .ev-cosmos-beam.beam-two {
          top: 48%;
          opacity: .42;
          transform: rotate(13deg);
          animation-delay: -4s;
          animation-duration: 15s;
        }

        .ev-cosmos-beam.beam-three {
          top: 75%;
          opacity: .3;
          transform: rotate(-8deg);
          animation-delay: -7s;
          animation-duration: 17s;
        }

        .ev-cosmos-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #a5f3fc;
          box-shadow: 0 0 8px #22d3ee, 0 0 22px rgba(34,211,238,.6);
          animation: cosmosFloat 8s ease-in-out infinite;
        }

        .ev-cosmos-glass {
          position: relative;
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 22px;
          background: linear-gradient(
            145deg,
            rgba(15,30,54,.80),
            rgba(5,12,28,.76) 65%,
            rgba(25,20,51,.70)
          );
          box-shadow:
            inset 0 1px rgba(255,255,255,.045),
            0 18px 60px rgba(0,0,0,.13);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          transition: border-color .35s ease, box-shadow .35s ease, transform .35s ease;
        }

        .ev-cosmos-glass::before {
          content: "";
          position: absolute;
          pointer-events: none;
          top: 0;
          left: -100%;
          width: 55%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(103,232,249,.8), transparent);
          animation: cosmosShimmer 8s ease-in-out infinite;
        }

        .ev-cosmos-glass:hover {
          border-color: rgba(103,232,249,.38);
          box-shadow: 0 18px 55px rgba(8,145,178,.11);
        }

        .ev-cosmos-metric {
          animation: cosmosAppear .7s both;
        }

        .ev-cosmos-metric:hover {
          transform: translateY(-4px);
        }

        .ev-cosmos-icon {
          display: flex;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(103,232,249,.22);
          border-radius: 14px;
          background: rgba(34,211,238,.08);
          color: #67e8f9;
          transition: transform .3s ease, box-shadow .3s ease;
        }

        .ev-cosmos-metric:hover .ev-cosmos-icon {
          transform: rotate(-8deg) scale(1.08);
          box-shadow: 0 0 25px rgba(34,211,238,.18);
        }

        .ev-cosmos-progress {
          height: 5px;
          overflow: hidden;
          border-radius: 20px;
          background: rgba(148,163,184,.12);
        }

        .ev-cosmos-progress span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #0891b2, #67e8f9, #5eead4);
          box-shadow: 0 0 15px rgba(34,211,238,.4);
          transition: width 1s ease;
        }

        .ev-cosmos-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 1px solid rgba(103,232,249,.24);
          border-radius: 13px;
          padding: 12px 16px;
          background: linear-gradient(110deg, rgba(8,145,178,.95), rgba(13,148,136,.92));
          color: #ecfeff;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          transition: transform .25s ease, box-shadow .25s ease, filter .25s ease;
          box-shadow: 0 0 25px rgba(34,211,238,.08);
        }

        .ev-cosmos-button:hover {
          transform: translateY(-2px);
          filter: brightness(1.12);
          box-shadow: 0 8px 30px rgba(34,211,238,.17);
        }

        .ev-cosmos-button:active {
          transform: scale(.98);
        }

        .ev-cosmos-secondary {
          background: rgba(15,23,42,.68);
          color: #dbeafe;
        }

        .ev-cosmos-orbit-card {
          position: relative;
          display: grid;
          min-height: 250px;
          place-items: center;
          overflow: hidden;
          border: 1px solid rgba(103,232,249,.17);
          border-radius: 20px;
          background: radial-gradient(ellipse at center, rgba(8,145,178,.12), transparent 65%);
        }

        .ev-cosmos-orbit {
          position: absolute;
          width: 190px;
          height: 190px;
          border: 1px solid rgba(34,211,238,.34);
          border-radius: 50%;
          animation: cosmosRotate 18s linear infinite;
        }

        .ev-cosmos-orbit.orbit-two {
          width: 230px;
          height: 230px;
          border-color: rgba(167,139,250,.28);
          border-style: dashed;
          animation-duration: 27s;
          animation-direction: reverse;
        }

        .ev-cosmos-orbit.orbit-three {
          width: 275px;
          height: 275px;
          border-color: rgba(94,234,212,.16);
          animation-duration: 38s;
        }

        .ev-cosmos-orbit::after {
          content: "";
          position: absolute;
          top: 12%;
          left: 12%;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #67e8f9;
          box-shadow: 0 0 14px #22d3ee;
        }

        .ev-cosmos-core {
          position: relative;
          z-index: 2;
          display: grid;
          width: 118px;
          height: 118px;
          place-items: center;
          border: 1px solid rgba(103,232,249,.46);
          border-radius: 28px;
          background: linear-gradient(145deg, rgba(8,47,73,.97), rgba(15,23,42,.95));
          color: #a5f3fc;
          box-shadow:
            0 0 35px rgba(34,211,238,.16),
            inset 0 0 28px rgba(34,211,238,.09);
          animation: cosmosCore 4s ease-in-out infinite;
        }

        .ev-cosmos-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid rgba(148,163,184,.10);
          padding: 13px 0;
          font-size: 12px;
        }

        .ev-cosmos-row:last-child { border-bottom: 0; }

        .ev-cosmos-value {
          max-width: 60%;
          overflow-wrap: anywhere;
          text-align: right;
          color: #e2e8f0;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
        }

        @keyframes cosmosRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes cosmosBreathe {
          from { opacity: .45; scale: .96; }
          to { opacity: 1; scale: 1.04; }
        }

        @keyframes cosmosBeam {
          from { translate: -5% -15px; opacity: .18; }
          to { translate: 5% 15px; opacity: .75; }
        }

        @keyframes cosmosFloat {
          0%, 100% { transform: translate3d(0,0,0); opacity: .2; }
          50% { transform: translate3d(18px,-30px,0); opacity: 1; }
        }

        @keyframes cosmosShimmer {
          0%, 20% { left: -100%; opacity: 0; }
          50% { opacity: 1; }
          80%, 100% { left: 150%; opacity: 0; }
        }

        @keyframes cosmosAppear {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes cosmosCore {
          0%, 100% { box-shadow: 0 0 28px rgba(34,211,238,.13), inset 0 0 25px rgba(34,211,238,.06); }
          50% { box-shadow: 0 0 52px rgba(34,211,238,.27), inset 0 0 32px rgba(34,211,238,.12); }
        }

        @media (max-width: 640px) {
          .ev-cosmos-glass { border-radius: 17px; }
          .ev-cosmos-halo { width: 110vw; top: 12%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ev-cosmos *,
          .ev-cosmos *::before,
          .ev-cosmos *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      {/* Full-screen animated energy universe */}
      <div className="ev-cosmos-scene" aria-hidden="true">
        <div className="ev-cosmos-grid" />
        <div className="ev-cosmos-halo" />
        <div className="ev-cosmos-beam" style={{ top: '29%' }} />
        <div className="ev-cosmos-beam beam-two" />
        <div className="ev-cosmos-beam beam-three" />
        {Array.from({ length: 22 }, (_, index) => (
          <span
            key={index}
            className="ev-cosmos-particle"
            style={{
              left: `${(index * 47 + 11) % 97}%`,
              top: `${(index * 31 + 9) % 94}%`,
              animationDelay: `${-(index % 8)}s`,
              animationDuration: `${6 + (index % 6)}s`,
              opacity: 0.3 + (index % 5) * 0.14,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <section className="ev-cosmos-glass mb-7 p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Energy Intelligence Center
              </span>
              <span className="rounded-full border border-violet-300/20 bg-violet-300/[0.06] px-3 py-1.5 text-[10px] text-violet-200">
                Research dashboard
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Battery <span className="text-cyan-300">Diagnostics</span>
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-400 sm:text-sm">
              Explore battery health, remaining useful life, degradation
              patterns, and machine learning evaluation.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('predict')}
              className="ev-cosmos-button"
            >
              <Zap className="h-4 w-4" />
              Run Prediction
              <ArrowUpRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className="ev-cosmos-button ev-cosmos-secondary"
            >
              <Activity className="h-4 w-4 text-cyan-300" />
              Explore Analytics
            </button>
          </div>
        </div>

        <div className="mt-6 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-cyan-300" />
            {sampleCount} reported samples
          </span>
          <span className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-violet-300" />
            {primaryModel}
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            Academic prototype
          </span>
        </div>
      </section>

      {/* Metrics */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-cyan-300 shadow-[0_0_15px_rgba(34,211,238,.5)]" />
          <div>
            <h2 className="text-sm font-bold">Key Performance Indicators</h2>
            <p className="mt-1 text-[10px] text-slate-500">
              Model evaluation and reference data
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const accent =
              metric.color === 'emerald'
                ? '#5eead4'
                : metric.color === 'violet'
                  ? '#c4b5fd'
                  : metric.color === 'amber'
                    ? '#fcd34d'
                    : '#67e8f9';

            return (
              <article
                key={metric.label}
                className="ev-cosmos-glass ev-cosmos-metric p-5"
                style={{ animationDelay: `${index * 110}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-400">
                      {metric.label}
                    </p>
                    <p className="mt-4 break-words font-mono text-3xl font-black tracking-tight">
                      {metric.value}
                    </p>
                  </div>
                  <div
                    className="ev-cosmos-icon"
                    style={{
                      color: accent,
                      borderColor: `${accent}44`,
                      background: `${accent}12`,
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-2 min-h-4 text-[10px] text-slate-400">
                  {metric.note}
                </p>
                <div className="ev-cosmos-progress mt-5">
                  <span
                    style={{
                      width: `${metric.percent}%`,
                      background: `linear-gradient(90deg, ${accent}75, ${accent})`,
                    }}
                  />
                </div>
                <p className="mt-3 text-[9px] uppercase tracking-wider text-slate-500">
                  {metric.label === 'State of Health'
                    ? 'Trajectory reference'
                    : metric.label === 'Dataset Samples'
                      ? 'Dataset metadata'
                      : 'Evaluation metric'}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Chart and animated energy core */}
      <section className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-[1.65fr_1fr]">
        <article className="ev-cosmos-glass p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="ev-cosmos-icon">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold sm:text-base">
                  Battery Degradation Trajectory
                </h2>
                <p className="mt-1 text-[10px] text-slate-400">
                  Cell B0005 reference · SOH across cycles
                </p>
              </div>
            </div>
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-2 text-[10px] text-cyan-100">
              {analyticsData?.cell_trajectories?.['B0005']
                ? 'Backend trajectory'
                : 'Illustrative reference'}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.07] bg-black/10 p-3">
              <p className="text-[10px] text-slate-400">Displayed SOH</p>
              <p className="mt-2 font-mono text-xl font-bold text-cyan-200">
                {formatNumber(soh, 1)}%
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-black/10 p-3">
              <p className="text-[10px] text-slate-400">Data points</p>
              <p className="mt-2 font-mono text-xl font-bold">
                {trajectory.length}
              </p>
            </div>
          </div>

          <div className="mt-5 h-[270px] w-full sm:h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trajectory}
                margin={{ top: 12, right: 12, left: -15, bottom: 2 }}
              >
                <defs>
                  <linearGradient id="cosmosSohFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={0.015} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(148,163,184,.13)"
                  strokeDasharray="4 5"
                  vertical={false}
                />
                <XAxis
                  dataKey="cycle"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(148,163,184,.2)' }}
                />
                <YAxis
                  domain={[50, 100]}
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <ReferenceLine
                  y={70}
                  stroke="#fbbf24"
                  strokeDasharray="5 5"
                  label={{
                    value: '70% reference',
                    fill: '#fbbf24',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(5,13,30,.96)',
                    border: '1px solid rgba(103,232,249,.25)',
                    borderRadius: 12,
                    color: '#f8fafc',
                    fontSize: 12,
                  }}
                  formatter={(value: number | string) => [
                    `${formatNumber(value, 1)}%`,
                    'SOH',
                  ]}
                  labelFormatter={(cycle) => `Cycle ${cycle}`}
                />
                <Area
                  type="monotone"
                  dataKey="soh"
                  stroke="#67e8f9"
                  strokeWidth={3}
                  fill="url(#cosmosSohFill)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: '#67e8f9',
                    stroke: '#082f49',
                    strokeWidth: 3,
                  }}
                  isAnimationActive
                  animationDuration={1600}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4 text-[10px] text-slate-400">
            <span className="flex items-center gap-2">
              <span className="h-2 w-5 rounded-full bg-cyan-300" />
              State of Health (%)
            </span>
            <span>Reference curve, not live vehicle telemetry</span>
          </div>
        </article>

        <article className="ev-cosmos-glass p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <h2 className="text-sm font-bold">Energy Intelligence Core</h2>
          </div>
          <p className="mt-2 text-[10px] leading-5 text-slate-400">
            Animated visual representing the battery analysis system.
          </p>

          <div className="ev-cosmos-orbit-card mt-5">
            <div className="ev-cosmos-orbit orbit-three" />
            <div className="ev-cosmos-orbit orbit-two" />
            <div className="ev-cosmos-orbit" />
            <div className="ev-cosmos-core">
              <div className="text-center">
                <BatteryCharging className="mx-auto h-10 w-10" />
                <p className="mt-3 text-xl font-black tracking-widest">
                  EV<span className="text-cyan-300">AI</span>
                </p>
                <p className="mt-1 text-[8px] font-bold uppercase tracking-[.2em] text-slate-400">
                  Energy intelligence
                </p>
              </div>
            </div>
            <span className="absolute left-[12%] top-[25%] rounded-full border border-cyan-300/20 bg-slate-950/80 px-3 py-2 text-[9px] text-cyan-100">
              <Zap className="mr-1 inline h-3 w-3" />
              Energy
            </span>
            <span className="absolute bottom-[18%] right-[7%] rounded-full border border-violet-300/20 bg-slate-950/80 px-3 py-2 text-[9px] text-violet-100">
              <Activity className="mr-1 inline h-3 w-3" />
              Analytics
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <span className="flex items-center gap-2 text-[11px] text-slate-300">
                <Cpu className="h-4 w-4 text-cyan-300" />
                SOH model
              </span>
              <span className="max-w-[55%] truncate text-right font-mono text-[10px] text-cyan-200">
                {primaryModel}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <span className="flex items-center gap-2 text-[11px] text-slate-300">
                <Database className="h-4 w-4 text-emerald-300" />
                Dataset samples
              </span>
              <span className="font-mono text-[11px] text-emerald-200">
                {sampleCount}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <span className="flex items-center gap-2 text-[11px] text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-violet-300" />
                Project status
              </span>
              <span className="text-[10px] text-violet-200">
                Academic prototype
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('predict')}
            className="ev-cosmos-button mt-5 w-full"
          >
            Open Battery Predictor
            <ArrowRight className="h-4 w-4" />
          </button>
        </article>
      </section>

      {/* Model details */}
      <section className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <article className="ev-cosmos-glass p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="ev-cosmos-icon">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Machine Learning Evaluation</h2>
              <p className="mt-1 text-[10px] text-slate-400">
                Reported model metrics
              </p>
            </div>
          </div>

          <div className="mt-5">
            {[
              ['SOH primary model', primaryModel],
              ['SOH MAE', `${formatNumber(sohMetrics.MAE, 4)}%`],
              ['SOH RMSE', formatNumber(sohMetrics.RMSE, 4)],
              ['SOH R²', formatNumber(sohMetrics.R2, 4)],
              ['RUL primary model', rulModel],
              ['RUL MAE', `${formatNumber(rulMetrics.MAE, 2)} cycles`],
              ['RUL RMSE', `${formatNumber(rulMetrics.RMSE, 2)} cycles`],
            ].map(([label, value]) => (
              <div className="ev-cosmos-row" key={label}>
                <span className="text-slate-400">{label}</span>
                <span className="ev-cosmos-value">{value}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className="ev-cosmos-button ev-cosmos-secondary mt-6 w-full"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            View Model Card
            <ArrowRight className="h-4 w-4" />
          </button>
        </article>

        <article className="ev-cosmos-glass p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="ev-cosmos-icon">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Dataset &amp; Battery Reference</h2>
              <p className="mt-1 text-[10px] text-slate-400">
                Laboratory dataset information
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="ev-cosmos-row">
              <span className="text-slate-400">Reported samples</span>
              <span className="ev-cosmos-value">{sampleCount}</span>
            </div>
            <div className="ev-cosmos-row">
              <span className="text-slate-400">Reference cell</span>
              <span className="ev-cosmos-value">18650 Li-ion</span>
            </div>
            <div className="ev-cosmos-row">
              <span className="text-slate-400">Nominal capacity</span>
              <span className="ev-cosmos-value">2.00 Ah</span>
            </div>
            <div className="ev-cosmos-row">
              <span className="text-slate-400">EOL capacity reference</span>
              <span className="ev-cosmos-value text-amber-200">1.40 Ah</span>
            </div>
            <div className="ev-cosmos-row">
              <span className="text-slate-400">Trajectory cell</span>
              <span className="ev-cosmos-value">B0005</span>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4">
            <p className="text-[11px] leading-6 text-slate-300">
              <Radio className="mr-2 inline h-4 w-4 text-cyan-300" />
              Dataset values describe laboratory research. They are not
              measurements from a connected vehicle.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className="ev-cosmos-button mt-5 w-full"
          >
            Explore Degradation Analytics
            <ArrowRight className="h-4 w-4" />
          </button>
        </article>
      </section>

      {/* Quick access */}
      <section>
        <div className="mb-4">
          <h2 className="text-sm font-bold">Explore Platform</h2>
          <p className="mt-1 text-[10px] text-slate-500">
            Quick access to other modules
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              title: 'Battery Prediction',
              description: 'Enter battery measurements and request an inference.',
              icon: BatteryCharging,
              tab: 'predict',
              color: 'text-cyan-200',
            },
            {
              title: 'Degradation Analytics',
              description: 'Explore aging curves and model evaluation.',
              icon: Activity,
              tab: 'analytics',
              color: 'text-violet-200',
            },
            {
              title: 'Prediction History',
              description: 'Review saved prediction records when available.',
              icon: Clock3,
              tab: 'history',
              color: 'text-emerald-200',
            },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => setActiveTab(item.tab)}
                className="ev-cosmos-glass group flex items-start gap-4 p-5 text-left"
                style={{ animation: `cosmosAppear .6s ${index * 120}ms both` }}
              >
                <div className="ev-cosmos-icon shrink-0">
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold">{item.title}</h3>
                  <p className="mt-2 text-[11px] leading-5 text-slate-400">
                    {item.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold text-cyan-200">
                    Open module
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-cyan-200/10 pt-5 text-[10px] text-slate-500">
        <span className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-cyan-300" />
          EV Battery Health &amp; Life Prediction AI
        </span>
        <span className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
          Academic prototype
        </span>
      </footer>
    </div>
  );
};

export default Dashboard;
