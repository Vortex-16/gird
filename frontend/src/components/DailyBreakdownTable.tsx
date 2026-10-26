import React from 'react';
import type { DailySummary } from '../api';

interface DailyBreakdownTableProps {
  summaries: DailySummary[];
  loading: boolean;
}

export const DailyBreakdownTable: React.FC<DailyBreakdownTableProps> = ({ summaries, loading }) => {
  if (loading) {
    return (
      <section className="section-white">
        <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="badge-ghost">Loading Daily Outturn Summaries...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-white">
      <div className="container">
        {/* Header */}
        <div style={{ maxWidth: '840px', marginBottom: '32px' }}>
          <div className="badge-ghost" style={{ marginBottom: '12px' }}>
            Daily Granularity • January 2026
          </div>
          <h2 className="heading-md" style={{ fontSize: '38px', marginBottom: '12px' }}>
            Daily Forecast Performance Register
          </h2>
          <p className="caption" style={{ fontSize: '16px' }}>
            Audited daily statistics across all 31 delivery days of January 2026. Identifies storm events, low-wind lulls, and severe forecast deviation periods.
          </p>
        </div>

        {/* Table Container */}
        <div className="card-white" style={{ padding: '0', overflowX: 'auto', border: 'var(--border-hairline)' }}>
          <table className="editorial-table">
            <thead>
              <tr>
                <th>Delivery Date</th>
                <th>Avg Actual</th>
                <th>Avg Forecast</th>
                <th>Peak Actual</th>
                <th>Peak Forecast</th>
                <th>MAE</th>
                <th>RMSE</th>
                <th>MAPE</th>
                <th>Net Bias</th>
                <th>Settlement Hours</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((day) => {
                const isOver = day.bias > 0;
                return (
                  <tr key={day.date}>
                    <td>
                      <strong>{day.date}</strong>
                    </td>
                    <td>{Math.round(day.avg_actual_mw).toLocaleString()} MW</td>
                    <td style={{ color: '#686a1a', fontWeight: 500 }}>
                      {Math.round(day.avg_forecast_mw).toLocaleString()} MW
                    </td>
                    <td>{Math.round(day.peak_actual_mw).toLocaleString()} MW</td>
                    <td>{Math.round(day.peak_forecast_mw).toLocaleString()} MW</td>
                    <td><strong>{Math.round(day.mae).toLocaleString()} MW</strong></td>
                    <td style={{ color: 'var(--color-mid-grey)' }}>{Math.round(day.rmse).toLocaleString()} MW</td>
                    <td>
                      <span className="badge-filled" style={{ padding: '3px 8px', fontSize: '12px' }}>
                        {day.mape.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge-ghost"
                        style={{
                          padding: '3px 8px',
                          fontSize: '11px',
                          borderColor: isOver ? '#17150e' : '#b23b3b',
                          color: isOver ? '#17150e' : '#b23b3b',
                        }}
                      >
                        {isOver ? `+${Math.round(day.bias)} MW (Over)` : `${Math.round(day.bias)} MW (Under)`}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--color-mid-grey)' }}>
                      {day.total_points} hrs
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
