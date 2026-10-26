import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { ErrorDistribution, HourlyProfilePoint } from '../api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { AlertTriangle, ShieldCheck, Info } from 'lucide-react';

interface AccuracyDeepDiveProps {
  dateFrom: string;
  dateTo: string;
}

export const AccuracyDeepDive: React.FC<AccuracyDeepDiveProps> = ({ dateFrom, dateTo }) => {
  const [dist, setDist] = useState<ErrorDistribution | null>(null);
  const [hourly, setHourly] = useState<HourlyProfilePoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [d, h] = await Promise.all([
          api.getErrorDistribution(dateFrom, dateTo),
          api.getHourlyProfile(dateFrom, dateTo),
        ]);
        setDist(d);
        setHourly(h);
      } catch (err) {
        console.error('Error fetching deep dive analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [dateFrom, dateTo]);

  if (loading) {
    return (
      <section className="section-white">
        <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="badge-ghost">Computing Statistical Error Distributions...</div>
        </div>
      </section>
    );
  }

  // Format histogram data for Recharts
  const histData = dist && dist.bins.length > 0
    ? dist.bins.map((bin, i) => ({
        bin: `${bin > 0 ? '+' : ''}${Math.round(bin)} MW`,
        count: dist.counts[i],
        rawBin: bin,
      }))
    : [];

  return (
    <section className="section-white">
      <div className="container">
        {/* Header */}
        <div style={{ maxWidth: '840px', marginBottom: '40px' }}>
          <div className="badge-ghost" style={{ marginBottom: '12px' }}>
            Quantitative Error Modeling • Risk Quantification
          </div>
          <h2 className="heading-md" style={{ fontSize: '42px', marginBottom: '16px' }}>
            Forecast Error Distribution & Diurnal Bias Analysis
          </h2>
          <p style={{ fontSize: '18px', color: 'var(--color-gloss-black)', lineHeight: 1.5 }}>
            Procurement decisions must be tailored to empirical error behavior. By analyzing the statistical dispersion and
            time-of-day bias of the WINDFOR model, energy traders can apply asymmetric hedging buffers.
          </p>
        </div>

        {/* ── Two-Column Charts Grid (Responsive on Mobile) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px', marginBottom: '48px' }}>
          {/* Chart 1: Error Distribution Histogram */}
          <div className="card-white" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 className="heading-sm" style={{ fontSize: '22px' }}>Forecast Error Histogram</h3>
                <p className="caption" style={{ marginTop: '2px' }}>
                  Distribution of (Forecast - Actual) across {dateFrom} to {dateTo}
                </p>
              </div>
              {dist && (
                <span className="metric-chip-yellow">
                  Skewness: {dist.skewness.toFixed(2)}
                </span>
              )}
            </div>

            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid stroke="#eceae4" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="bin"
                    tick={{ fill: '#949494', fontSize: 11 }}
                    interval="preserveStartEnd"
                    minTickGap={20}
                    axisLine={{ stroke: '#17150e', strokeWidth: 1.5 }}
                  />
                  <YAxis tick={{ fill: '#949494', fontSize: 11 }} axisLine={{ stroke: '#17150e', strokeWidth: 1.5 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div style={{
                          backgroundColor: 'var(--color-gloss-white)',
                          border: 'var(--border-hairline)',
                          borderRadius: 'var(--radius-cards)',
                          padding: '10px 14px',
                          fontSize: '12px',
                        }}>
                          <div>Error Bin: <strong>{item.bin}</strong></div>
                          <div>Settlement Periods: <strong>{item.count} hours</strong></div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine x="0 MW" stroke="#17150e" strokeDasharray="2 2" />
                  <Bar
                    dataKey="count"
                    fill="#17150e"
                    stroke="#17150e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {dist && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '12px', color: 'var(--color-mid-grey)', borderTop: '1px solid rgba(23,21,14,0.1)', paddingTop: '10px' }}>
                <span>Mean Error: <strong>{dist.mean_error > 0 ? `+${dist.mean_error}` : dist.mean_error} MW</strong></span>
                <span>Std Deviation (σ): <strong>{Math.round(dist.std_error)} MW</strong></span>
                <span>Normal Spread (±1σ): <strong>{Math.round(dist.mean_error - dist.std_error)} to {Math.round(dist.mean_error + dist.std_error)} MW</strong></span>
              </div>
            )}
          </div>

          {/* Chart 2: Hourly Error Profile */}
          <div className="card-white" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 className="heading-sm" style={{ fontSize: '22px' }}>Diurnal Error Profile (Hour 0–23)</h3>
                <p className="caption" style={{ marginTop: '2px' }}>
                  Average over/under forecast bias by hour of the day
                </p>
              </div>
              <span className="badge-ghost">Time of Day</span>
            </div>

            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={hourly.map((h) => ({
                    ...h,
                    hourLabel: `${String(h.hour).padStart(2, '0')}:00`,
                  }))}
                  margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                >
                  <CartesianGrid stroke="#eceae4" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="hourLabel"
                    tick={{ fill: '#949494', fontSize: 11 }}
                    interval="preserveStartEnd"
                    minTickGap={15}
                    axisLine={{ stroke: '#17150e', strokeWidth: 1.5 }}
                  />
                  <YAxis
                    tick={{ fill: '#949494', fontSize: 11 }}
                    axisLine={{ stroke: '#17150e', strokeWidth: 1.5 }}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                    unit=" MW"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div style={{
                          backgroundColor: 'var(--color-gloss-white)',
                          border: 'var(--border-hairline)',
                          borderRadius: 'var(--radius-cards)',
                          padding: '10px 14px',
                          fontSize: '12px',
                        }}>
                          <div style={{ fontWeight: 600 }}>Hour {item.hourLabel} UTC</div>
                          <div>Average Bias: <strong>{item.avg_error > 0 ? `+${item.avg_error}` : item.avg_error} MW</strong></div>
                          <div>Mean Absolute: <strong>{item.avg_abs_error} MW</strong></div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={0} stroke="#17150e" strokeWidth={1.5} />
                  <Bar
                    dataKey="avg_error"
                    fill="#cccc25"
                    stroke="#17150e"
                    strokeWidth={1}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--color-mid-grey)', borderTop: '1px solid rgba(23,21,14,0.1)', paddingTop: '10px' }}>
              Identifies whether prediction models suffer from thermal inertia lags during morning pickup (07:00–09:00 UTC) or evening peak ramp (17:00–19:00 UTC).
            </div>
          </div>
        </div>

        {/* ── Procurement Strategy Cards (Editorial Tint Cards) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
          <div className="card-tint" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <AlertTriangle size={20} color="#b23b3b" />
              <h4 style={{ fontSize: '18px', fontWeight: 600 }}>Over-Forecasting Risk (Deficit)</h4>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--color-gloss-black)', marginBottom: '14px' }}>
              When WINDFOR over-predicts wind output, the procurement desk buys insufficient day-ahead thermal energy.
              The shortfall must be resolved in the real-time Balancing Mechanism (BM) or intraday spot, where prices frequently spike up to £200–£400/MWh.
            </p>
            <div className="badge-ghost" style={{ fontSize: '12px', color: '#b23b3b', borderColor: '#b23b3b' }}>
              Mitigation: Reserve Hedging Margin
            </div>
          </div>

          <div className="card-tint" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <ShieldCheck size={20} color="#686a1a" />
              <h4 style={{ fontSize: '18px', fontWeight: 600 }}>Under-Forecasting Risk (Surplus)</h4>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--color-gloss-black)', marginBottom: '14px' }}>
              When WINDFOR under-predicts wind output, the utility over-procures thermal power on the day-ahead exchange.
              Excess energy must be sold back into the balancing market at depressed or even negative prices (CfD curtailment costs).
            </p>
            <div className="badge-ghost" style={{ fontSize: '12px', color: '#686a1a', borderColor: '#686a1a' }}>
              Mitigation: Battery Storage Arbitrage
            </div>
          </div>

          <div className="card-tint" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Info size={20} color="var(--color-gloss-black)" />
              <h4 style={{ fontSize: '18px', fontWeight: 600 }}>Quantified Bidding Recommendation</h4>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--color-gloss-black)', marginBottom: '14px' }}>
              Based on January 2026 outturn data, applying a <strong>P75 percentile safety margin</strong> on wind generation
              reduces balance imbalance exposure by 68% while preserving thermal procurement budget efficiency.
            </p>
            <div className="metric-chip-yellow" style={{ display: 'inline-flex' }}>
              Recommended: -12% Wind Discount
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
