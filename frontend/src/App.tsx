import React, { useState, useEffect } from 'react';
import { api } from './api';
import type { ComparisonPoint, AccuracyMetrics, DailySummary } from './api';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { StatBand } from './components/StatBand';
import { ComparisonChart } from './components/ComparisonChart';
import { DayAheadProcurement } from './components/DayAheadProcurement';
import { AccuracyDeepDive } from './components/AccuracyDeepDive';
import { DailyBreakdownTable } from './components/DailyBreakdownTable';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'dayAhead' | 'accuracy' | 'table'>('overview');
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-01-31');

  const [comparison, setComparison] = useState<ComparisonPoint[]>([]);
  const [metrics, setMetrics] = useState<AccuracyMetrics | null>(null);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [compData, accData, sumData] = await Promise.all([
          api.getComparison(dateFrom, dateTo),
          api.getAccuracy(dateFrom, dateTo),
          api.getDailySummary(dateFrom, dateTo),
        ]);
        setComparison(compData);
        setMetrics(accData);
        setSummaries(sumData);
      } catch (err: any) {
        console.error('Failed to load GridBricks analytics:', err);
        setError(err.message || 'Error communicating with backend API');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateFrom, dateTo]);

  const handleExportCsv = () => {
    window.open(api.getCsvExportUrl(dateFrom, dateTo), '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Navigation ── */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dateFrom={dateFrom}
        dateTo={dateTo}
        setDateFrom={setDateFrom}
        setDateTo={setDateTo}
        onExportCsv={handleExportCsv}
      />

      <main style={{ flex: 1 }}>
        {/* Error notification banner if backend is unreachable */}
        {error && (
          <div style={{
            backgroundColor: '#ffe5d6',
            color: 'var(--color-gloss-black)',
            padding: '12px 24px',
            borderBottom: 'var(--border-hairline)',
            fontSize: '14px',
            textAlign: 'center',
          }}>
            <strong>Notice:</strong> {error}. Ensure backend is running at http://localhost:8000.
          </div>
        )}

        {/* ── Hero Editorial Section (Overview tab) ── */}
        {activeTab === 'overview' && (
          <HeroSection
            onExploreClick={() => {
              const el = document.getElementById('chart-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            onProcurementClick={() => setActiveTab('dayAhead')}
          />
        )}

        {/* ── Quantitative Accuracy Stat Band (Always visible for quick reference) ── */}
        <StatBand metrics={metrics} loading={loading} />

        {/* ── Tab View 1: Overview & Actuals ── */}
        {activeTab === 'overview' && (
          <section id="chart-section" className="section-white">
            <div className="container">
              <ComparisonChart data={comparison} loading={loading} />
            </div>
          </section>
        )}

        {/* ── Tab View 2: Day-Ahead Thermal Procurement Calculator ── */}
        {activeTab === 'dayAhead' && (
          <DayAheadProcurement metrics={metrics} />
        )}

        {/* ── Tab View 3: Accuracy Deep Dive & Error Histogram ── */}
        {activeTab === 'accuracy' && (
          <AccuracyDeepDive dateFrom={dateFrom} dateTo={dateTo} />
        )}

        {/* ── Tab View 4: Daily Breakdown Ledger ── */}
        {activeTab === 'table' && (
          <DailyBreakdownTable summaries={summaries} loading={loading} />
        )}
      </main>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
};

export default App;
