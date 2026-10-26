import React, { useState } from 'react';
import { Wind, Download, Calendar, Menu, X } from 'lucide-react';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: 'overview' | 'dayAhead' | 'accuracy' | 'table') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header>
      {/* ── Top Announcement Bar (Scrolls away naturally) ── */}
      <div style={{
        backgroundColor: 'var(--color-gloss-black)',
        color: 'var(--color-gloss-white)',
        padding: '10px 0',
        fontSize: '12px',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-solar-yellow)',
            }} />
            <span style={{ fontWeight: 500 }}>UK National Grid Wholesale Day-Ahead Procurement</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', color: 'var(--color-mid-grey)', fontSize: '11px' }}>
            <span>Elexon BMRS Stream</span>
            <span>•</span>
            <span style={{ color: 'var(--color-gloss-white)' }}>Jan 2026</span>
          </div>
        </div>
      </div>

      {/* ── Main Navigation Bar (STICKY to top: 0 with hairline border) ── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: 'var(--border-hairline)',
        padding: '14px 0',
        transition: 'all 0.2s ease',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          
          {/* Logo & Brand */}
          <div
            onClick={() => handleTabClick('overview')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-gloss-black)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-solar-yellow)',
            }}>
              <Wind size={20} />
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '26px',
                lineHeight: '1',
                fontWeight: 500,
                color: 'var(--color-gloss-black)',
              }}>
                GridBricks
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-mid-grey)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Day-Ahead Utility Desk
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="desktop-nav" style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--color-gloss-white)', padding: '4px', borderRadius: 'var(--radius-buttons)', border: 'var(--border-hairline)' }}>
            <button
              onClick={() => handleTabClick('overview')}
              style={{
                borderRadius: 'var(--radius-buttons)',
                padding: '7px 16px',
                fontSize: '13px',
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
              onClick={() => handleTabClick('dayAhead')}
              style={{
                borderRadius: 'var(--radius-buttons)',
                padding: '7px 16px',
                fontSize: '13px',
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
              onClick={() => handleTabClick('accuracy')}
              style={{
                borderRadius: 'var(--radius-buttons)',
                padding: '7px 16px',
                fontSize: '13px',
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
              onClick={() => handleTabClick('table')}
              style={{
                borderRadius: 'var(--radius-buttons)',
                padding: '7px 16px',
                fontSize: '13px',
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

          {/* Desktop Date Controls & Export */}
          <div className="desktop-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
              <Calendar size={14} color="var(--color-gloss-black)" />
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-editorial"
                style={{ padding: '5px 8px', fontSize: '12px', width: '120px' }}
                aria-label="Filter start date"
              />
              <span style={{ color: 'var(--color-mid-grey)' }}>-</span>
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-editorial"
                style={{ padding: '5px 8px', fontSize: '12px', width: '120px' }}
                aria-label="Filter end date"
              />
            </div>

            <button
              onClick={onExportCsv}
              className="btn-pill-dark"
              style={{ padding: '7px 14px', fontSize: '12px' }}
              title="Download CSV"
            >
              <Download size={13} />
              <span>CSV</span>
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            style={{
              display: 'none',
              background: 'transparent',
              border: 'var(--border-hairline)',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: 'var(--color-gloss-black)',
            }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* ── Mobile Dropdown Menu Drawer ── */}
        {mobileMenuOpen && (
          <div className="mobile-drawer" style={{
            padding: '16px 24px 20px',
            backgroundColor: 'var(--color-pure-white)',
            borderTop: '1px solid rgba(23, 21, 14, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            {/* Mobile Nav Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => handleTabClick('overview')}
                className={activeTab === 'overview' ? 'btn-pill-dark' : 'btn-pill-ghost'}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 16px', fontSize: '14px' }}
              >
                Overview & Actuals
              </button>
              <button
                onClick={() => handleTabClick('dayAhead')}
                className={activeTab === 'dayAhead' ? 'btn-pill-dark' : 'btn-pill-ghost'}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 16px', fontSize: '14px' }}
              >
                Day-Ahead Procurement
              </button>
              <button
                onClick={() => handleTabClick('accuracy')}
                className={activeTab === 'accuracy' ? 'btn-pill-dark' : 'btn-pill-ghost'}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 16px', fontSize: '14px' }}
              >
                Error Quantification
              </button>
              <button
                onClick={() => handleTabClick('table')}
                className={activeTab === 'table' ? 'btn-pill-dark' : 'btn-pill-ghost'}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 16px', fontSize: '14px' }}
              >
                Daily Breakdown
              </button>
            </div>

            {/* Mobile Date Filter Controls */}
            <div style={{ borderTop: '1px solid rgba(23, 21, 14, 0.1)', paddingTop: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-gloss-black)', marginBottom: '8px' }}>
                Date Range Filter (January 2026):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="date"
                  min="2026-01-01"
                  max="2026-01-31"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input-editorial"
                  style={{ width: '100%', fontSize: '13px', padding: '8px' }}
                />
                <input
                  type="date"
                  min="2026-01-01"
                  max="2026-01-31"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input-editorial"
                  style={{ width: '100%', fontSize: '13px', padding: '8px' }}
                />
              </div>

              <button
                onClick={onExportCsv}
                className="btn-pill-dark"
                style={{ width: '100%', padding: '10px', fontSize: '13px' }}
              >
                <Download size={14} />
                <span>Export Aligned Comparison CSV</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
