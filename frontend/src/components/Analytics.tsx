import React, { useMemo, useState } from 'react';
import {
  LineChart as LineChartIcon,
  Activity,
  ShieldCheck,
  TrendingDown,
  Database,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { AnalyticsData, ModelMetrics } from '../types';

interface AnalyticsProps {
  analyticsData: AnalyticsData | null;
  modelMetrics: ModelMetrics | null;
}

type AnyRecord = Record<string, any>;
type Metric = 'capacity' | 'soh';

const CELL_IDS = ['B0005', 'B0006', 'B0007', 'B0018'] as const;

const CELL_COLORS: Record<string, string> = {
  B0005: '#06B6D4',
  B0006: '#10B981',
  B0007: '#A855F7',
  B0018: '#F43F5E',
};

const firstValue = (obj: AnyRecord, keys: string[]) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key];
    }
  }
  return undefined;
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return undefined;
};

const getCellKey = (source: AnyRecord, cellId: string) => {
  const key = Object.keys(source || {}).find(
    (candidate) => candidate.toUpperCase() === cellId.toUpperCase()
  );
  return key ? source[key] : undefined;
};

/**
 * Accepts arrays and common API object formats without assuming
 * that every backend uses precisely the same field names.
 */
const normalizeCellPoints = (raw: unknown): AnyRecord[] => {
  let points: unknown[] = [];

  if (Array.isArray(raw)) {
    points = raw;
  } else if (raw && typeof raw === 'object') {
    const obj = raw as AnyRecord;

    const nested = firstValue(obj, [
      'points',
      'data',
      'trajectory',
      'cycles',
      'records',
      'measurements',
    ]);

    if (Array.isArray(nested)) {
      points = nested;
    } else {
      // Support APIs that return cycle numbers as object keys.
      points = Object.entries(obj)
        .filter(([, value]) => value && typeof value === 'object')
        .map(([cycle, value]) => ({
          cycle: Number(cycle),
          ...(value as AnyRecord),
        }));
    }
  }

  return points
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;

      const point = item as AnyRecord;

      const cycle = toNumber(
        firstValue(point, [
          'cycle',
          'cycle_number',
          'cycleNumber',
          'discharge_cycle',
          'dischargeCycle',
          'Cycle',
        ])
      ) ?? index + 1;

      const rawCapacity = toNumber(
        firstValue(point, [
          'capacity',
          'capacity_ah',
          'capacityAh',
          'discharge_capacity',
          'dischargeCapacity',
          'Capacity',
          'QDischarge',
        ])
      );

      let soh = toNumber(
        firstValue(point, [
          'soh',
          'SOH',
          'soh_percent',
          'soh_percentage',
          'state_of_health',
          'stateOfHealth',
          'health',
        ])
      );

      const capacity = rawCapacity;

      // Only derive SOH from capacity when the API gives capacity
      // and the nominal reference capacity is explicitly 2.0 Ah.
      if (
        soh === undefined &&
        capacity !== undefined &&
        capacity >= 0 &&
        capacity <= 2.5
      ) {
        soh = (capacity / 2.0) * 100;
      }

      // Some datasets store SOH as a fraction (0–1).
      if (soh !== undefined && soh > 0 && soh <= 1) {
        soh *= 100;
      }

      return {
        cycle,
        capacity,
        soh,
      };
    })
    .filter(
      (point): point is { cycle: number; capacity?: number; soh?: number } =>
        point !== null &&
        Number.isFinite(point.cycle) &&
        (point.capacity !== undefined || point.soh !== undefined)
    )
    .sort((a, b) => a.cycle - b.cycle);
};

const normalizeTestPoints = (raw: unknown): AnyRecord[] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;

      const point = item as AnyRecord;

      const cycle = toNumber(
        firstValue(point, ['cycle', 'cycle_number', 'cycleNumber'])
      ) ?? index + 1;

      const actual = toNumber(
        firstValue(point, [
          'actual_soh',
          'actualSOH',
          'ground_truth_soh',
          'groundTruthSOH',
          'true_soh',
          'actual',
        ])
      );

      const predicted = toNumber(
        firstValue(point, [
          'pred_soh',
          'predicted_soh',
          'predictedSOH',
          'prediction',
          'predicted',
        ])
      );

      return {
        cycle,
        actual_soh:
          actual !== undefined && actual <= 1 && actual > 0
            ? actual * 100
            : actual,
        pred_soh:
          predicted !== undefined && predicted <= 1 && predicted > 0
            ? predicted * 100
            : predicted,
      };
    })
    .filter(
      (point): point is { cycle: number; actual_soh?: number; pred_soh?: number } =>
        point !== null &&
        Number.isFinite(point.cycle) &&
        (point.actual_soh !== undefined || point.pred_soh !== undefined)
    )
    .sort((a, b) => a.cycle - b.cycle);
};

const formatMetric = (
  value: number | undefined,
  decimals = 4
): string => {
  if (value === undefined || !Number.isFinite(value)) return 'N/A';
  return value.toFixed(decimals);
};

const tooltipStyle = {
  backgroundColor: '#0F172A',
  borderColor: '#1F2E47',
  borderRadius: '0.75rem',
  color: '#F8FAFC',
  fontSize: '12px',
};

export const Analytics: React.FC<AnalyticsProps> = ({
  analyticsData,
  modelMetrics,
}) => {
  const [activeMetric, setActiveMetric] = useState<Metric>('capacity');

  const { combinedTrajectory, trajectoryCounts } = useMemo(() => {
    const root = (analyticsData ?? {}) as AnyRecord;

    const trajectorySource =
      root.cell_trajectories ??
      root.cellTrajectories ??
      root.trajectories ??
      root.degradation_trajectories ??
      root.degradationTrajectories ??
      {};

    const source =
      trajectorySource && typeof trajectorySource === 'object'
        ? (trajectorySource as AnyRecord)
        : {};

    const byCell: Record<string, AnyRecord[]> = {};
    const cycleMap: Record<number, AnyRecord> = {};
    const counts: Record<string, number> = {};

    CELL_IDS.forEach((cellId) => {
      const raw = getCellKey(source, cellId);
      const points = normalizeCellPoints(raw);

      byCell[cellId] = points;
      counts[cellId] = points.length;

      points.forEach((point) => {
        if (!cycleMap[point.cycle]) {
          cycleMap[point.cycle] = { cycle: point.cycle };
        }

        if (point.capacity !== undefined) {
          cycleMap[point.cycle][`${cellId}_capacity`] = point.capacity;
        }

        if (point.soh !== undefined) {
          cycleMap[point.cycle][`${cellId}_soh`] = point.soh;
        }
      });
    });

    const combined = Object.values(cycleMap).sort(
      (a, b) => a.cycle - b.cycle
    );

    return {
      combinedTrajectory: combined,
      trajectoryCounts: counts,
    };
  }, [analyticsData]);

  const testPoints = useMemo(() => {
    const root = (analyticsData ?? {}) as AnyRecord;

    return normalizeTestPoints(
      root.test_eval_points ??
        root.testEvalPoints ??
        root.test_points ??
        root.testPoints ??
        []
    );
  }, [analyticsData]);

  const hasCapacityData = combinedTrajectory.some((point) =>
    CELL_IDS.some((cellId) => point[`${cellId}_capacity`] !== undefined)
  );

  const hasSohData = combinedTrajectory.some((point) =>
    CELL_IDS.some((cellId) => point[`${cellId}_soh`] !== undefined)
  );

  const hasTrajectoryData =
    activeMetric === 'capacity' ? hasCapacityData : hasSohData;

  const sohMetrics = (modelMetrics as AnyRecord | null)?.soh
    ?.GradientBoosting;

  const mae = toNumber(sohMetrics?.MAE);
  const rmse = toNumber(sohMetrics?.RMSE);
  const r2 = toNumber(sohMetrics?.R2);

  return (
    <div className="space-y-8 py-4">
      <header>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
          <LineChartIcon className="h-6 w-6 text-cyan-400" />
          Degradation Analytics &amp; Benchmark Curves
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Explore battery degradation trajectories and held-out model evaluation.
        </p>
      </header>

      {/* Comparative degradation trajectory */}
      <section className="glass-panel space-y-4 rounded-2xl border border-[#1F2E47] p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-white">
              <TrendingDown className="h-4 w-4 text-cyan-400" />
              Four-Cell Comparative Aging Trajectory
            </h3>
            <p className="text-xs text-slate-400">
              NASA Li-ion cell trajectories. The EOL reference is 1.40 Ah.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#1F2E47] bg-[#0B0F17] p-1">
            <button
              type="button"
              onClick={() => setActiveMetric('capacity')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                activeMetric === 'capacity'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Capacity (Ah)
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('soh')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                activeMetric === 'soh'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              State of Health (%)
            </button>
          </div>
        </div>

        {hasTrajectoryData ? (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={combinedTrajectory}
                margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1F2E47"
                  vertical={false}
                />
                <XAxis
                  dataKey="cycle"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  label={{
                    value: 'Discharge cycle',
                    position: 'insideBottom',
                    offset: -2,
                    fill: '#94A3B8',
                    fontSize: 11,
                  }}
                />
                <YAxis
                  domain={
                    activeMetric === 'capacity'
                      ? [1.1, 2.1]
                      : [55, 105]
                  }
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  width={44}
                  label={{
                    value: activeMetric === 'capacity' ? 'Capacity (Ah)' : 'SOH (%)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94A3B8',
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(cycle) => `Discharge Cycle #${cycle}`}
                  formatter={(value: number, name: string) => [
                    `${Number(value).toFixed(3)} ${
                      activeMetric === 'capacity' ? 'Ah' : '%'
                    }`,
                    name,
                  ]}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />

                {activeMetric === 'capacity' && (
                  <ReferenceLine
                    y={1.4}
                    stroke="#F59E0B"
                    strokeDasharray="4 4"
                    label={{
                      value: '1.40 Ah EOL Threshold',
                      fill: '#F59E0B',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                )}

                {CELL_IDS.map((cellId) => {
                  const dataKey = `${cellId}_${activeMetric}`;

                  const hasCellData = combinedTrajectory.some(
                    (point) => point[dataKey] !== undefined
                  );

                  if (!hasCellData) return null;

                  return (
                    <Line
                      key={dataKey}
                      type="monotone"
                      dataKey={dataKey}
                      name={
                        activeMetric === 'capacity'
                          ? `Cell ${cellId} (${cellId === 'B0018' ? 'Held-out' : 'Training'})`
                          : `Cell ${cellId} SOH`
                      }
                      stroke={CELL_COLORS[cellId]}
                      strokeWidth={cellId === 'B0018' ? 2.5 : 2}
                      dot={false}
                      connectNulls
                      isAnimationActive={false}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#334155] bg-[#0B0F17]/70 p-6 text-center">
            <Database className="h-8 w-8 text-amber-400" />
            <h4 className="font-semibold text-white">
              Comparative trajectory data unavailable
            </h4>
            <p className="max-w-xl text-sm text-slate-400">
              The analytics API did not provide usable{' '}
              {activeMetric === 'capacity' ? 'capacity (Ah)' : 'SOH (%)'} points
              for B0005, B0006, B0007, or B0018. The chart is intentionally left
              empty rather than displaying invented measurements.
            </p>
            <p className="text-xs text-slate-500">
              Check the response from GET /api/analytics and the
              cell_trajectories field.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CELL_IDS.map((cellId) => (
            <div
              key={cellId}
              className="rounded-xl border border-[#1F2E47] bg-[#0B0F17] p-3"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CELL_COLORS[cellId] }}
                />
                {cellId}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {trajectoryCounts[cellId] ?? 0} usable points
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Held-out test chart and metrics */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <section className="glass-panel space-y-4 rounded-2xl border border-[#1F2E47] p-6 lg:col-span-8">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Actual vs Predicted SOH (Held-out Test Cell B0018)
            </h3>
            <p className="text-xs text-slate-400">
              Ground-truth and predicted SOH values supplied by the analytics API.
            </p>
          </div>

          {testPoints.length > 0 &&
          testPoints.some((point) => point.actual_soh !== undefined || point.pred_soh !== undefined) ? (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={testPoints}
                  margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1F2E47"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="cycle"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[55, 100]}
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [
                      `${Number(value).toFixed(2)}%`,
                      name,
                    ]}
                    labelFormatter={(cycle) => `Cycle #${cycle} (Cell B0018)`}
                  />
                  <Legend verticalAlign="top" height={32} />

                  <Line
                    type="monotone"
                    dataKey="actual_soh"
                    name="Ground Truth SOH %"
                    stroke="#E2E8F0"
                    strokeWidth={2}
                    dot={{ r: 2, fill: '#E2E8F0' }}
                    connectNulls
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="pred_soh"
                    name="AI Predicted SOH %"
                    stroke="#06B6D4"
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#334155] p-6 text-center">
              <AlertCircle className="h-7 w-7 text-amber-400" />
              <p className="font-semibold text-white">
                Held-out evaluation points unavailable
              </p>
              <p className="text-sm text-slate-400">
                No usable test_eval_points were returned by the analytics API.
              </p>
            </div>
          )}
        </section>

        <section className="glass-panel space-y-5 rounded-2xl border border-[#1F2E47] p-6 lg:col-span-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            <Activity className="h-4 w-4 text-cyan-400" />
            Held-out Test Performance
          </h3>

          {[
            {
              label: 'Mean Absolute Error (MAE)',
              value: mae,
              color: 'text-emerald-400',
              suffix: '%',
              description: 'Average absolute prediction error.',
            },
            {
              label: 'Root Mean Squared Error (RMSE)',
              value: rmse,
              color: 'text-cyan-400',
              suffix: '%',
              description: 'Penalizes larger prediction errors.',
            },
            {
              label: 'Coefficient of Determination (R²)',
              value: r2,
              color: 'text-white',
              suffix: '',
              description: 'Model fit score reported by the backend.',
            },
          ].map((metric) => (
            <div
              key={metric.label}
              className="space-y-1 rounded-xl border border-[#1F2E47] bg-[#0B0F17] p-4"
            >
              <span className="text-xs text-slate-400">{metric.label}</span>
              <div className={`font-mono text-2xl font-bold ${metric.color}`}>
                {formatMetric(metric.value)}
                {metric.value !== undefined ? metric.suffix : ''}
              </div>
              <p className="text-[11px] text-slate-500">
                {metric.description}
              </p>
            </div>
          ))}

          {!modelMetrics && (
            <p className="text-xs text-amber-300">
              Model metrics have not been loaded from the backend.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};