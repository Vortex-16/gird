import React from 'react';
import { Sparkles, Shield, BarChart3, Wind, Clock } from 'lucide-react';

interface HeroSectionProps {
  onExploreClick: () => void;
  onProcurementClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreClick,
  onProcurementClick,
}) => {
  return (
    <section className="section-white" style={{ paddingTop: '60px', paddingBottom: '70px' }}>
      <div className="container">
        {/* Eyebrow badge */}
        <div style={{ marginBottom: '24px' }}>
          <div className="badge-ghost">
            <span>UK Electricity Wholesale Market</span>
            <span>•</span>
            <span>Day-Ahead Decision Support System</span>
          </div>
        </div>

        {/* Massive Editorial Headline */}
        <div style={{ maxWidth: '1040px', marginBottom: '32px' }}>
          <h1 className="display-title" style={{ fontSize: 'clamp(48px, 7vw, 92px)', marginBottom: '24px' }}>
            Empirical wind forecasts for disciplined wholesale power procurement.
          </h1>
          <p style={{
            fontSize: 'clamp(18px, 2.2vw, 22px)',
            lineHeight: 1.45,
            color: 'var(--color-gloss-black)',
            maxWidth: '820px',
            fontWeight: 400,
          }}>
            Designed specifically for UK energy utility trading desks buying from the day-ahead market.
            Quantify renewable generation volatility, audit gate-closure forecast vintages, and calculate precise thermal procurement requirements.
          </p>
        </div>

        {/* Action Button Cluster (Yellow Pill CTA + Ghost Pill) */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
          <button onClick={onProcurementClick} className="btn-pill-yellow">
            <Sparkles size={16} />
            <span>Launch Day-Ahead Calculator</span>
          </button>
          <button onClick={onExploreClick} className="btn-pill-ghost">
            <BarChart3 size={16} />
            <span>Inspect Delivery Actuals</span>
          </button>
          <span style={{ fontSize: '13px', color: 'var(--color-mid-grey)', marginLeft: '8px' }}>
            Audited against Elexon BMRS January 2026 outturn
          </span>
        </div>

        {/* Three Editorial Architectural Pillars (Mint Cards) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '20px',
        }}>
          <div className="card-tint" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-gloss-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Clock size={16} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Gate-Closure Synchronization</h3>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--color-gloss-black)' }}>
              UK Day-Ahead markets clear at 11:00 UTC D-1. GridBricks filters the rolling WINDFOR forecast stream to the exact publish timestamp available when traders submit bids.
            </p>
          </div>

          <div className="card-tint" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-gloss-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Shield size={16} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Quantified Error Margins</h3>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--color-gloss-black)' }}>
              Never procure on point forecasts alone. GridBricks calculates empirical MAE, RMSE, and net bias, enabling utility buyers to size risk-hedged reserve buffers.
            </p>
          </div>

          <div className="card-tint" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-gloss-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Wind size={16} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Thermal Gap Resolution</h3>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--color-gloss-black)' }}>
              Instantly converts hourly renewable predictions into required thermal plant procurement volumes, preventing punitive imbalance exposure in the Balancing Mechanism.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
