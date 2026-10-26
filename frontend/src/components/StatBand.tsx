import React from 'react';
import type { AccuracyMetrics } from '../api';

interface StatBandProps {
  metrics: AccuracyMetrics | null;
  loading: boolean;
}

export const StatBand: React.FC<StatBandProps> = ({ metrics, loading }) => {
  if (loading || !metrics) {
    return (
      <section className="section-tint">
        <div className="container" style={{ textAlign: 'center', padding: '40px 0' }}>
          <div className="badge-ghost">Loading Quantitative Forecast Accuracy Metrics...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-tint">
      <div className="container">
        {/* Eyebrow Label */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div className="badge-ghost">
            <span>Quantitative Accuracy Benchmark</span>
            <span>•</span>
            <span>UK National Wind Fleet</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-mid-grey)' }}>
            Evaluated on {metrics.total_points} hourly settlement pairs ({metrics.date_from} → {metrics.date_to})
          </div>
        </div>

        {/* 4-Column Stat Band with 88px Display Typography */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '40px',
        }}>
          {/* Column 1: MAE */}
          <div className="stat-block">
            <div className="stat-number">
              <span>{Math.round(metrics.mae).toLocaleString()}</span>
              <span className="stat-unit">MW</span>
            </div>
            <div className="stat-caption">Mean Absolute Error (MAE)</div>
            <div className="stat-subcaption">Average absolute procurement deviation per hour</div>
          </div>

          {/* Column 2: RMSE */}
          <div className="stat-block">
            <div className="stat-number">
              <span>{Math.round(metrics.rmse).toLocaleString()}</span>
              <span className="stat-unit">MW</span>
            </div>
            <div className="stat-caption">Root Mean Squared Error (RMSE)</div>
            <div className="stat-subcaption">Penalizes large extreme prediction swings</div>
          </div>

          {/* Column 3: MAPE */}
          <div className="stat-block">
            <div className="stat-number">
              <span>{metrics.mape.toFixed(1)}</span>
              <span className="stat-unit">%</span>
            </div>
            <div className="stat-caption">Mean Absolute % Error (MAPE)</div>
            <div className="stat-subcaption">Relative volume risk across fleet capacity</div>
          </div>

          {/* Column 4: Systemic Bias */}
          <div className="stat-block">
            <div className="stat-number">
              <span style={{ color: metrics.bias > 0 ? '#17150e' : '#b23b3b' }}>
                {metrics.bias > 0 ? `+${Math.round(metrics.bias)}` : Math.round(metrics.bias)}
              </span>
              <span className="stat-unit">MW</span>
            </div>
            <div className="stat-caption">
              {metrics.bias > 0 ? 'Net Overforecast Bias' : 'Net Underforecast Bias'}
            </div>
            <div className="stat-subcaption">
              {metrics.bias > 0
                ? 'System tends to predict more wind than delivers'
                : 'System tends to predict less wind than delivers'}
            </div>
          </div>
        </div>

        {/* Footnote callout chip */}
        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: 'var(--border-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="metric-chip-yellow">Correlation: {metrics.correlation}</span>
            <span style={{ fontSize: '13px', color: 'var(--color-gloss-black)' }}>
              Strong linear alignment between forecasted and delivered physical generation.
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-mid-grey)' }}>
            Max Overforecast: +{Math.round(metrics.max_overforecast)} MW &nbsp;|&nbsp; Max Underforecast: {Math.round(metrics.max_underforecast)} MW
          </div>
        </div>
      </div>
    </section>
  );
};
