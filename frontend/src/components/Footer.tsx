import React from 'react';
import { Wind, ExternalLink, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="section-dark" style={{ borderTop: 'var(--border-hairline)', paddingTop: '60px', paddingBottom: '60px' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '40px', marginBottom: '48px' }}>
          {/* Brand & Purpose */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'var(--color-gloss-white)',
                color: 'var(--color-gloss-black)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Wind size={18} />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500 }}>
                GridBricks
              </span>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--color-mid-grey)', lineHeight: 1.6, maxWidth: '340px' }}>
              Bespoke wholesale energy procurement decision platform engineered for UK utility trading desks.
              Powered by real-time Elexon BMRS market stream integrations.
            </p>
          </div>

          {/* Market Regulations & Data Sources */}
          <div>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gloss-white)', marginBottom: '16px' }}>
              Data Provenance & Compliance
            </h4>
            <ul style={{ listStyle: 'none', fontSize: '13px', color: 'var(--color-mid-grey)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <a
                  href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--color-gloss-white)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>FUELHH Generation Outturn (WIND)</span>
                  <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--color-gloss-white)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>WINDFOR Generation Forecasts</span>
                  <ExternalLink size={12} />
                </a>
              </li>
              <li>UK Electricity Balancing and Settlement Code (BSC)</li>
              <li>EPEX SPOT & Nord Pool Day-Ahead Auction Clearing</li>
            </ul>
          </div>

          {/* Technical Specifications */}
          <div>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gloss-white)', marginBottom: '16px' }}>
              Architecture & Stack
            </h4>
            <ul style={{ listStyle: 'none', fontSize: '13px', color: 'var(--color-mid-grey)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>Backend: Python 3.12+ & FastAPI Async Engine</li>
              <li>Frontend: React 19 + TypeScript + Vite + Recharts</li>
              <li>Containerization: Docker & Multi-stage container builds</li>
              <li>Deployment: Vercel edge frontend & container backend</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(240, 247, 246, 0.15)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '12px',
          color: 'var(--color-mid-grey)',
        }}>
          <div>
            © 2026 GridBricks Energy Systems. Developed for UK Day-Ahead Procurement Utility Desk.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={14} color="var(--color-solar-yellow)" />
            <span>Elexon BMRS Verified • National Grid BSC Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
