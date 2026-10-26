import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { DayAheadForecastPoint, AccuracyMetrics } from '../api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Zap, Clock, CheckCircle2 } from 'lucide-react';

interface DayAheadProcurementProps {
  metrics: AccuracyMetrics | null;
}

export const DayAheadProcurement: React.FC<DayAheadProcurementProps> = ({ metrics }) => {
  const [deliveryDate, setDeliveryDate] = useState('2026-01-15');
  const [baseDemandMw, setBaseDemandMw] = useState<number>(26000);
  const [forecasts, setForecasts] = useState<DayAheadForecastPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Typical UK winter diurnal demand index by hour (0 to 23)
  const diurnalDemandMultiplier = [
    0.78, 0.74, 0.72, 0.71, 0.73, 0.82, 0.96, 1.08, 1.12, 1.10,
    1.08, 1.06, 1.04, 1.03, 1.02, 1.06, 1.18, 1.25, 1.22, 1.16,
    1.10, 1.02, 0.92, 0.84,
  ];

  useEffect(() => {
    async function loadForecast() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getDayAheadForecast(deliveryDate);
        setForecasts(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load day-ahead forecast');
      } finally {
        setLoading(false);
      }
    }
    loadForecast();
  }, [deliveryDate]);

  // Gate closure timestamp is 11:00 UTC on deliveryDate - 1 day
  const dObj = new Date(deliveryDate);
  const decisionDateObj = new Date(dObj.getTime() - 24 * 60 * 60 * 1000);
  const decisionDateStr = decisionDateObj.toISOString().slice(0, 10);

  // Compute thermal procurement schedule
  const procurementSchedule = forecasts.map((pt, idx) => {
    const hour = idx % 24;
    const hourDemand = Math.round(baseDemandMw * (diurnalDemandMultiplier[hour] || 1.0));
    const expectedWind = Math.round(pt.generation);
    const thermalNeeded = Math.max(0, hourDemand - expectedWind);
    const maeBuffer = metrics ? Math.round(metrics.mae) : 3000;
    const conservativeThermal = Math.max(0, hourDemand - Math.max(0, expectedWind - maeBuffer));

    return {
      hour: `${String(hour).padStart(2, '0')}:00`,
      customerDemand: hourDemand,
      expectedWind: expectedWind,
      thermalRequired: thermalNeeded,
      conservativeThermal: conservativeThermal,
      publishTime: pt.publishTime,
    };
  });

  const totalDemandMwh = procurementSchedule.reduce((a, b) => a + b.customerDemand, 0);
  const totalWindMwh = procurementSchedule.reduce((a, b) => a + b.expectedWind, 0);
  const totalThermalMwh = procurementSchedule.reduce((a, b) => a + b.thermalRequired, 0);
  const windPenetration = totalDemandMwh > 0 ? (totalWindMwh / totalDemandMwh) * 100 : 0;

  return (
    <section className="section-white">
      <div className="container">
        {/* Section Header */}
        <div style={{ maxWidth: '840px', marginBottom: '40px' }}>
          <div className="badge-ghost" style={{ marginBottom: '12px' }}>
            Core Commercial Workflow • UK Day-Ahead Procurement
          </div>
          <h2 className="heading-md" style={{ fontSize: '42px', marginBottom: '16px' }}>
            Day-Ahead Thermal Balancing & Purchase Calculator
          </h2>
          <p style={{ fontSize: '18px', color: 'var(--color-gloss-black)', lineHeight: 1.5 }}>
            To meet consumer electricity demand in the Day-Ahead Market, utilities must bid 24 hours prior to delivery.
            This module ingests the latest forecast available at gate closure (11:00 UTC D-1), quantifies expected wind delivery,
            and calculates the exact thermal replacement capacity required across each settlement block.
          </p>
        </div>

        {/* ── Control Bar ── */}
        <div className="card-tint" style={{ padding: '24px', marginBottom: '36px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '20px', alignItems: 'flex-end' }}>
            {/* Delivery Date Picker */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Delivery Target Date (Day D)
              </label>
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="input-editorial"
                style={{ width: '100%' }}
              />
            </div>

            {/* Decision Gate Info */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Market Gate Closure (D-1)
              </label>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-pure-white)', borderRadius: 'var(--radius-inputs)', border: 'var(--border-hairline)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} />
                <span>{decisionDateStr} @ 11:00 UTC</span>
              </div>
            </div>

            {/* Utility Demand Input */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Portfolio Peak Demand (MW)
              </label>
              <input
                type="number"
                step="500"
                min="5000"
                max="60000"
                value={baseDemandMw}
                onChange={(e) => setBaseDemandMw(Number(e.target.value))}
                className="input-editorial"
                style={{ width: '100%' }}
              />
            </div>

            {/* Status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge-filled" style={{ backgroundColor: 'var(--color-solar-yellow)', borderColor: 'var(--color-gloss-black)', color: 'var(--color-gloss-black)', width: '100%', justifyContent: 'center' }}>
                <Zap size={14} />
                <span>{loading ? 'Ingesting Elexon Stream...' : 'Gate Frozen Forecast'}</span>
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: '#ffe5d6', color: '#17150e', padding: '14px 20px', borderRadius: '8px', border: '1.5px solid #17150e', marginBottom: '24px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* ── Procurement KPI Highlights ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '16px', marginBottom: '36px' }}>
          <div className="card-tint" style={{ padding: '20px' }}>
            <span className="caption">Total Expected Demand</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 500, margin: '8px 0' }}>
              {Math.round(totalDemandMwh / 1000).toLocaleString()} <span style={{ fontSize: '18px' }}>GWh</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-mid-grey)' }}>24-hour winter delivery cycle</span>
          </div>

          <div className="card-tint" style={{ padding: '20px' }}>
            <span className="caption">Forecasted Wind Contribution</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 500, margin: '8px 0', color: '#686a1a' }}>
              {Math.round(totalWindMwh / 1000).toLocaleString()} <span style={{ fontSize: '18px' }}>GWh</span>
            </div>
            <span className="metric-chip-yellow">{windPenetration.toFixed(1)}% Renewable Share</span>
          </div>

          <div className="card-tint" style={{ padding: '20px', backgroundColor: 'var(--color-gloss-black)', color: 'var(--color-gloss-white)' }}>
            <span style={{ color: 'var(--color-mid-grey)', fontSize: '14px' }}>Thermal Procure Required</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 500, margin: '8px 0', color: 'var(--color-solar-yellow)' }}>
              {Math.round(totalThermalMwh / 1000).toLocaleString()} <span style={{ fontSize: '18px' }}>GWh</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-gloss-white)' }}>Must buy from Day-Ahead market</span>
          </div>

          <div className="card-tint" style={{ padding: '20px' }}>
            <span className="caption">Risk Buffer (+MAE Margin)</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 500, margin: '8px 0', color: '#b23b3b' }}>
              ±{metrics ? Math.round(metrics.mae).toLocaleString() : 3000} <span style={{ fontSize: '18px' }}>MW</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-mid-grey)' }}>Reserve hedge for wind deficit</span>
          </div>
        </div>

        {/* ── Procurement Dispatch Curve ── */}
        <div className="card-white" style={{ padding: '32px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 className="heading-sm" style={{ fontSize: '26px' }}>24-Hour Day-Ahead Purchase Commitment</h3>
              <p className="caption" style={{ marginTop: '4px' }}>
                Visualizing how renewable wind offsets demand and exposes the exact residual thermal purchase needed per hour.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="badge-filled" style={{ gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#17150e', display: 'inline-block' }} />
                <span>Demand Profile</span>
              </div>
              <div className="badge-filled" style={{ gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#cccc25', display: 'inline-block' }} />
                <span>Wind Generation</span>
              </div>
              <div className="badge-filled" style={{ gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#9fa6ff', display: 'inline-block' }} />
                <span>Thermal Procured</span>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: '380px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={procurementSchedule} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid stroke="#eceae4" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: '#949494', fontSize: 12 }} axisLine={{ stroke: '#17150e', strokeWidth: 1.5 }} />
                <YAxis
                  tick={{ fill: '#949494', fontSize: 12 }}
                  axisLine={{ stroke: '#17150e', strokeWidth: 1.5 }}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  unit=" MW"
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div style={{
                        backgroundColor: 'var(--color-gloss-white)',
                        border: 'var(--border-hairline)',
                        borderRadius: 'var(--radius-cards)',
                        padding: '12px 16px',
                        fontSize: '13px',
                      }}>
                        <div style={{ fontWeight: 600, borderBottom: '1px solid rgba(23,21,14,0.15)', paddingBottom: '4px', marginBottom: '6px' }}>
                          Hour {label} UTC
                        </div>
                        <div>Customer Demand: <strong>{item.customerDemand.toLocaleString()} MW</strong></div>
                        <div style={{ color: '#686a1a' }}>Wind Forecast: <strong>{item.expectedWind.toLocaleString()} MW</strong></div>
                        <div style={{ color: 'var(--color-gloss-black)', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #ddd' }}>
                          Thermal to Buy: <strong>{item.thermalRequired.toLocaleString()} MW</strong>
                        </div>
                        <div style={{ color: '#949494', fontSize: '11px', marginTop: '2px' }}>
                          With MAE Buffer: {item.conservativeThermal.toLocaleString()} MW
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="thermalRequired"
                  name="Thermal Procured (MW)"
                  fill="#9fa6ff"
                  fillOpacity={0.4}
                  stroke="#272b30"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expectedWind"
                  name="Wind Forecast (MW)"
                  stroke="#cccc25"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#cccc25' }}
                />
                <Line
                  type="monotone"
                  dataKey="customerDemand"
                  name="Customer Demand (MW)"
                  stroke="#17150e"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Hourly Bidding Table for EPEX SPOT / Nord Pool ── */}
        <div className="card-white" style={{ padding: '28px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h4 className="heading-sm" style={{ fontSize: '20px' }}>Hourly Power Purchase Bidding Table</h4>
              <p className="caption">Direct inputs for Day-Ahead auction order submission</p>
            </div>
            <div className="badge-ghost">
              <CheckCircle2 size={14} color="#cccc25" />
              <span>Gate Compliant</span>
            </div>
          </div>

          <table className="editorial-table">
            <thead>
              <tr>
                <th>Delivery Hour</th>
                <th>Consumer Demand</th>
                <th>Wind Forecast</th>
                <th>Base Thermal Procure</th>
                <th>MAE Risk Buffer</th>
                <th>Conservative Buy</th>
                <th>Forecast Publish Vintage</th>
              </tr>
            </thead>
            <tbody>
              {procurementSchedule.slice(0, 12).map((row, idx) => (
                <tr key={idx}>
                  <td><strong>{row.hour} UTC</strong></td>
                  <td>{row.customerDemand.toLocaleString()} MW</td>
                  <td style={{ color: '#686a1a', fontWeight: 600 }}>{row.expectedWind.toLocaleString()} MW</td>
                  <td><strong>{row.thermalRequired.toLocaleString()} MW</strong></td>
                  <td style={{ color: '#949494' }}>±{metrics ? Math.round(metrics.mae).toLocaleString() : 3000} MW</td>
                  <td><span className="metric-chip-yellow">{row.conservativeThermal.toLocaleString()} MW</span></td>
                  <td style={{ fontSize: '11px', color: 'var(--color-mid-grey)' }}>{row.publishTime?.slice(0, 16).replace('T', ' ')} UTC</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="caption" style={{ marginTop: '12px', textAlign: 'center' }}>
            Showing morning and afternoon blocks (first 12 hours of delivery day). Full 24-hour block available via CSV export.
          </p>
        </div>
      </div>
    </section>
  );
};
