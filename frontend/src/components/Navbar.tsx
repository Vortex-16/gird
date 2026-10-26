import React from 'react';
import { Wind, Download, Calendar } from 'lucide-react';

interface NavbarProps {
  activeTab: 'overview' | 'dayAhead' | 'accuracy' | 'table';
  setActiveTab: (tab: 'overview' | 'dayAhead' | 'accuracy' | 'table') => void;
  dateFrom: string;
  dateTo: string;
  setDateFrom: (d: string) => void;
  setDateTo: (d: string) => void;
  onExportCsv: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  onExportCsv,
}) => {
  return (
    <header style={{ borderBottom: 'var(--border-hairline)' }}>
      {/* ── Top Announcement Bar ── */}
      <div style={{
        backgroundColor: 'var(--color-gloss-black)',
        color: 'var(--color-gloss-white)',
        padding: '10px 0',
        fontSize: '13px',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-solar-yellow)',
            }} />
            <span>UK National Grid • Wholesale Day-Ahead Procurement Analytics</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', color: 'var(--color-mid-grey)' }}>
            <span>Elexon BMRS Stream: FUELHH & WINDFOR</span>
            <span>•</span>
            <span style={{ color: 'var(--color-gloss-white)' }}>January 2026 Scope</span>
          </div>
        </div>
      </div>

      {/* ── Main Navigation ── */}
      <div style={{ backgroundColor: 'var(--color-pure-white)', padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-gloss-black)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-solar-yellow)',
            }}>
              <Wind size={22} />
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px',
                lineHeight: '1',
                fontWeight: 500,
                color: 'var(--color-gloss-black)',
              }}>
                GridBricks
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-mid-grey)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Energy Utility Day-Ahead Portal
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--color-gloss-white)', padding: '4px', borderRadius: 'var(--radius-buttons)', border: 'var(--border-hairline)' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                borderRadius: 'var(--radius-buttons)',
                padding: '8px 18px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeTab === 'overview' ? 'var(--color-gloss-black)' : 'transparent',
                color: activeTab === 'overview' ? 'var(--color-gloss-white)' : 'var(--color-gloss-black)',
                transition: 'all 0.15s ease',
              }}
            >
              Overview & Actuals
            </button>
            <button
              onClick={() => setActiveTab('dayAhead')}
              style={{
                borderRadius: 'var(--radius-buttons)',
                padding: '8px 18px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeTab === 'dayAhead' ? 'var(--color-gloss-black)' : 'transparent',
                color: activeTab === 'dayAhead' ? 'var(--color-gloss-white)' : 'var(--color-gloss-black)',
                transition: 'all 0.15s ease',
              }}
            >
              Day-Ahead Procurement
            </button>
            <button
              onClick={() => setActiveTab('accuracy')}
              style={{
                borderRadius: 'var(--radius-buttons)',
                padding: '8px 18px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeTab === 'accuracy' ? 'var(--color-gloss-black)' : 'transparent',
                color: activeTab === 'accuracy' ? 'var(--color-gloss-white)' : 'var(--color-gloss-black)',
                transition: 'all 0.15s ease',
              }}
            >
              Error Quantification
            </button>
            <button
              onClick={() => setActiveTab('table')}
              style={{
                borderRadius: 'var(--radius-buttons)',
                padding: '8px 18px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeTab === 'table' ? 'var(--color-gloss-black)' : 'transparent',
                color: activeTab === 'table' ? 'var(--color-gloss-white)' : 'var(--color-gloss-black)',
                transition: 'all 0.15s ease',
              }}
            >
              Daily Breakdown
            </button>
          </nav>

          {/* Date Range Picker & Export */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <Calendar size={15} color="var(--color-gloss-black)" />
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-editorial"
                style={{ padding: '6px 10px', fontSize: '13px' }}
              />
              <span style={{ color: 'var(--color-mid-grey)' }}>to</span>
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-editorial"
                style={{ padding: '6px 10px', fontSize: '13px' }}
              />
            </div>

            <button
              onClick={onExportCsv}
              className="btn-pill-dark"
              style={{ padding: '8px 16px', fontSize: '13px' }}
              title="Download aligned comparison data as CSV"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
