import React from 'react';

import {
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from 'recharts';

export type RunsChartRow = {
  t: number;
  processed: number;
  failed: number;
  errors: number;
  warnings: number;
  status: string;
  statusDetail: string;
};

const formatDateTime = (v: number) => {
  const d = new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleString();
};

const formatShortDateTime = (ms: number) => {
  const d = new Date(ms);
  return d.toLocaleString(undefined, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const RunsHistoryChart: React.FC<{ rows: RunsChartRow[] }> = ({ rows }) => {
  const axisTickColor = 'var(--text-color)';
  const gridColor = 'var(--border-color)';
  const dotCommon = {
    r: 3.5,
    stroke: 'var(--sidebar-bg)',
    strokeWidth: 1.25
  } as const;
  const activeDotCommon = {
    r: 6,
    stroke: 'var(--sidebar-bg)',
    strokeWidth: 2
  } as const;

  if (!rows.length) {
    return (
      <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', background: 'var(--sidebar-bg)' }}>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>No history to chart yet.</div>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', background: 'var(--sidebar-bg)' }}>
      <div style={{ height: 220, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 12, bottom: 0, left: 6 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
            <Legend
              verticalAlign="top"
              align="left"
              iconType="circle"
              wrapperStyle={{
                paddingLeft: 6,
                paddingBottom: 6,
                fontSize: 11,
                color: 'var(--text-color)'
              }}
            />
            <XAxis
              dataKey="t"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(v: number | string) => formatShortDateTime(Number(v))}
              tick={{ fill: axisTickColor, fontSize: 11, opacity: 0.9 }}
              tickLine={{ stroke: gridColor }}
              axisLine={{ stroke: gridColor }}
              minTickGap={18}
            />
            <YAxis
              tick={{ fill: axisTickColor, fontSize: 11, opacity: 0.9 }}
              tickLine={{ stroke: gridColor }}
              axisLine={{ stroke: gridColor }}
              width={64}
              tickFormatter={(v: number | string) => (typeof v === 'number' ? v.toLocaleString() : String(v))}
            />
            <RechartsTooltip
              content={(props: unknown) => {
                const p = props as {
                  active?: boolean;
                  payload?: ReadonlyArray<{ payload?: RunsChartRow }>;
                  label?: number | string;
                };

                const active = p.active;
                const payload = p.payload;
                const label = p.label;
                if (!active || !payload || payload.length === 0) return null;
                const row = payload[0]?.payload;
                if (!row) return null;

                return (
                  <div
                    style={{
                      background: 'var(--sidebar-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '10px',
                      color: 'var(--text-color)',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
                      maxWidth: '420px'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>{formatDateTime(Number(label))}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 10px', fontSize: '12px' }}>
                      <div style={{ opacity: 0.75 }}>Processed</div>
                      <div style={{ fontFamily: 'var(--font-mono)' }}>{row.processed.toLocaleString()}</div>
                      <div style={{ opacity: 0.75 }}>Failed</div>
                      <div style={{ fontFamily: 'var(--font-mono)' }}>{row.failed.toLocaleString()}</div>
                      <div style={{ opacity: 0.75 }}>Errors</div>
                      <div style={{ fontFamily: 'var(--font-mono)' }}>{row.errors.toLocaleString()}</div>
                      <div style={{ opacity: 0.75 }}>Warnings</div>
                      <div style={{ fontFamily: 'var(--font-mono)' }}>{row.warnings.toLocaleString()}</div>
                      <div style={{ opacity: 0.75 }}>Status</div>
                      <div style={{ fontFamily: 'var(--font-mono)' }}>{row.status || '-'}</div>
                      {row.statusDetail ? (
                        <>
                          <div style={{ opacity: 0.75 }}>Detail</div>
                          <div style={{ fontFamily: 'var(--font-mono)' }}>{row.statusDetail}</div>
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              }}
            />

            <Line
              type="monotone"
              dataKey="processed"
              name="Processed"
              stroke="var(--accent-color)"
              strokeWidth={2}
              dot={{ ...dotCommon, fill: 'var(--accent-color)' }}
              activeDot={{ ...activeDotCommon, fill: 'var(--accent-color)' }}
            />
            <Line
              type="monotone"
              dataKey="failed"
              name="Failed"
              stroke="var(--status-error-text)"
              strokeWidth={2}
              dot={{ ...dotCommon, fill: 'var(--status-error-text)' }}
              activeDot={{ ...activeDotCommon, fill: 'var(--status-error-text)' }}
            />
            <Line
              type="monotone"
              dataKey="errors"
              name="Errors"
              stroke="var(--status-warn-text)"
              strokeWidth={2}
              dot={{ ...dotCommon, fill: 'var(--status-warn-text)' }}
              activeDot={{ ...activeDotCommon, fill: 'var(--status-warn-text)' }}
            />
            <Line
              type="monotone"
              dataKey="warnings"
              name="Warnings"
              stroke="var(--text-color)"
              strokeWidth={1.5}
              dot={{ ...dotCommon, fill: 'var(--text-color)' }}
              activeDot={{ ...activeDotCommon, fill: 'var(--text-color)' }}
              opacity={0.6}
            />

            <Brush
              dataKey="t"
              height={24}
              stroke="var(--accent-color)"
              travellerWidth={10}
              tickFormatter={(v: number | string) => formatShortDateTime(Number(v))}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '8px' }}>Tip: drag the handles to zoom into a time range.</div>
    </div>
  );
};

export default RunsHistoryChart;
