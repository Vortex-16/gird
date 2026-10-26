import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { ComparisonPoint } from '../api';

interface ComparisonChartProps {
  data: ComparisonPoint[];
  loading: boolean;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ data, loading }) => {
  const [viewMode, setViewMode] = useState<'both' | 'error'>('both');

  if (loading) {
    return (
      <div className="card-tint" style={{ padding: '60px', textAlign: 'center' }}>
        <p className="caption">Loading time-series data from Elexon BMRS...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card-tint" style={{ padding: '60px', textAlign: 'center' }}>
        <p className="caption">No data points available for the selected date range.</p>
      </div>
    );
  }

  // Format timestamp for X-axis: "Jan 1, 14:00"
  const formattedData = data.map((d) => {
    const dt = new Date(d.start_time);
    const dateStr = dt.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    const timeStr = `${String(dt.getUTCHours()).padStart(2, '0')}:00`;
    return {
      ...d,
      displayTime: `${dateStr} ${timeStr}`,
      overforecast: d.error_mw > 0 ? d.error_mw : 0,
      underforecast: d.error_mw < 0 ? d.error_mw : 0,
    };
  });

  // Calculate summary stats
  const peakActual = Math.max(...data.map((d) => d.actual_mw));
  const peakForecast = Math.max(...data.map((d) => d.forecast_mw));
  const avgActual = data.reduce((acc, d) => acc + d.actual_mw, 0) / data.length;

  return (
    <div className="card-white" style={{ padding: '32px' }}>
      {/* ── Chart Header & Controls ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '28px' }}>
        <div>
          <div className="badge-ghost" style={{ marginBottom: '8px' }}>Hourly Outturn vs Day-Ahead Forecast</div>
          <h3 className="heading-md" style={{ fontSize: '32px' }}>Wind Fleet Delivery Profile</h3>
          <p className="caption" style={{ marginTop: '4px' }}>
            National UK wind outturn (FUELHH 30-min aggregated to hourly) vs latest available forecast prior to day-ahead gate closure.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-mid-grey)' }}>View:</span>
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--color-gloss-white)',
            borderRadius: 'var(--radius-buttons)',
            border: 'var(--border-hairline)',
            padding: '3px',
          }}>
            <button
              onClick={() => setViewMode('both')}
              style={{
                borderRadius: 'var(--radius-buttons)',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'both' ? 'var(--color-gloss-black)' : 'transparent',
                color: viewMode === 'both' ? 'var(--color-gloss-white)' : 'var(--color-gloss-black)',
              }}
            >
              Dual Curve
            </button>
            <button
              onClick={() => setViewMode('error')}
              style={{
                borderRadius: 'var(--radius-buttons)',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'error' ? 'var(--color-gloss-black)' : 'transparent',
                color: viewMode === 'error' ? 'var(--color-gloss-white)' : 'var(--color-gloss-black)',
              }}
            >
              Error Delta (MW)
            </button>
          </div>
        </div>
      </div>

      {/* ── Metric Snapshot Pills ── */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div className="badge-filled" style={{ gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-gloss-black)' }} />
          <span>Peak Delivered: <strong>{Math.round(peakActual).toLocaleString()} MW</strong></span>
        </div>
        <div className="badge-filled" style={{ gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-solar-yellow)', border: '1px solid #17150e' }} />
          <span>Peak Forecast: <strong>{Math.round(peakForecast).toLocaleString()} MW</strong></span>
        </div>
        <div className="badge-filled">
          <span>Average Delivery: <strong>{Math.round(avgActual).toLocaleString()} MW</strong></span>
        </div>
      </div>

      {/* ── Recharts Canvas ── */}
      <div style={{ width: '100%', height: '420px', marginTop: '16px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid stroke="#eceae4" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="displayTime"
              tick={{ fill: '#949494', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#17150e', strokeWidth: 1.5 }}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: '#949494', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#17150e', strokeWidth: 1.5 }}
              tickFormatter={(val) => `${Math.round(val / 1000)}k`}
              unit=" MW"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const point = payload[0].payload as ComparisonPoint & { displayTime: string };
                return (
                  <div style={{
                    backgroundColor: 'var(--color-gloss-white)',
                    border: 'var(--border-hairline)',
                    borderRadius: 'var(--radius-cards)',
                    padding: '14px 18px',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '13px',
                    boxShadow: 'none',
                    minWidth: '220px',
                  }}>
                    <div style={{ fontWeight: 600, borderBottom: '1px solid rgba(23,21,14,0.15)', paddingBottom: '6px', marginBottom: '8px' }}>
                      {point.displayTime} UTC
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--color-gloss-black)', fontWeight: 500 }}>Actual Generation:</span>
                      <strong>{Math.round(point.actual_mw).toLocaleString()} MW</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#686a1a', fontWeight: 500 }}>Forecasted Wind:</span>
                      <strong>{Math.round(point.forecast_mw).toLocaleString()} MW</strong>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '6px',
                      paddingTop: '6px',
                      borderTop: '1px dashed rgba(23,21,14,0.15)',
                      color: point.error_mw > 0 ? '#17150e' : '#b23b3b',
                    }}>
                      <span>Deviation:</span>
                      <strong>{point.error_mw > 0 ? `+${Math.round(point.error_mw)}` : Math.round(point.error_mw)} MW</strong>
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="plainline"
              wrapperStyle={{ paddingBottom: '16px', fontSize: '13px' }}
            />

            {viewMode === 'both' && (
              <>
                <Line
                  type="monotone"
                  dataKey="actual_mw"
                  name="Delivered Actual (MW)"
                  stroke="#17150e"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#17150e' }}
                />
                <Line
                  type="monotone"
                  dataKey="forecast_mw"
                  name="Latest Forecast (MW)"
                  stroke="#cccc25"
                  strokeWidth={2.2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 5, fill: '#cccc25', stroke: '#17150e', strokeWidth: 1.5 }}
                />
              </>
            )}

            {viewMode === 'error' && (
              <>
                <Bar
                  dataKey="overforecast"
                  name="Overforecast Risk (+MW)"
                  fill="#cccc25"
                  stroke="#17150e"
                  strokeWidth={1}
                />
                <Bar
                  dataKey="underforecast"
                  name="Underforecast Deficit (-MW)"
                  fill="#ff7780"
                  stroke="#17150e"
                  strokeWidth={1}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Chart Legend Notes ── */}
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--color-mid-grey)', borderTop: '1px solid rgba(23,21,14,0.1)', paddingTop: '12px' }}>
        <span>Solid line: Metered national wind generation (FUELHH). Dashed yellow: Central forecast available before Day-Ahead market gate closure.</span>
        <span>Resolution: 1 Hour (60 mins)</span>
      </div>
    </div>
  );
};
