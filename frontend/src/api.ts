/**
 * GridBricks Frontend API Client
 * Sourced from the FastAPI backend (Elexon BMRS data for January 2026)
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ComparisonPoint {
  start_time: string;
  actual_mw: number;
  forecast_mw: number;
  error_mw: number;
  abs_error_mw: number;
  pct_error: number | null;
}

export interface AccuracyMetrics {
  mae: number;
  rmse: number;
  mape: number;
  bias: number;
  max_overforecast: number;
  max_underforecast: number;
  correlation: number;
  total_points: number;
  date_from: string;
  date_to: string;
}

export interface DailySummary {
  date: string;
  avg_actual_mw: number;
  avg_forecast_mw: number;
  peak_actual_mw: number;
  peak_forecast_mw: number;
  min_actual_mw: number;
  mae: number;
  rmse: number;
  mape: number;
  bias: number;
  total_points: number;
}

export interface ErrorDistribution {
  bins: number[];
  counts: number[];
  mean_error: number;
  std_error: number;
  skewness: number;
  date_from: string;
  date_to: string;
}

export interface HourlyProfilePoint {
  hour: number;
  avg_error: number;
  avg_abs_error: number;
  count: number;
}

export interface DayAheadForecastPoint {
  startTime: string;
  generation: number;
  publishTime: string;
}

export const api = {
  async getComparison(dateFrom: string, dateTo: string): Promise<ComparisonPoint[]> {
    const res = await fetch(`${API_BASE}/api/comparison?date_from=${dateFrom}&date_to=${dateTo}`);
    if (!res.ok) throw new Error(`Failed to fetch comparison: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  async getAccuracy(dateFrom: string, dateTo: string): Promise<AccuracyMetrics> {
    const res = await fetch(`${API_BASE}/api/accuracy?date_from=${dateFrom}&date_to=${dateTo}`);
    if (!res.ok) throw new Error(`Failed to fetch accuracy: ${res.statusText}`);
    return await res.json();
  },

  async getDailySummary(dateFrom: string, dateTo: string): Promise<DailySummary[]> {
    const res = await fetch(`${API_BASE}/api/daily-summary?date_from=${dateFrom}&date_to=${dateTo}`);
    if (!res.ok) throw new Error(`Failed to fetch daily summary: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  async getErrorDistribution(dateFrom: string, dateTo: string): Promise<ErrorDistribution> {
    const res = await fetch(`${API_BASE}/api/error-distribution?date_from=${dateFrom}&date_to=${dateTo}`);
    if (!res.ok) throw new Error(`Failed to fetch error distribution: ${res.statusText}`);
    return await res.json();
  },

  async getHourlyProfile(dateFrom: string, dateTo: string): Promise<HourlyProfilePoint[]> {
    const res = await fetch(`${API_BASE}/api/hourly-profile?date_from=${dateFrom}&date_to=${dateTo}`);
    if (!res.ok) throw new Error(`Failed to fetch hourly profile: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  async getDayAheadForecast(deliveryDate: string): Promise<DayAheadForecastPoint[]> {
    const res = await fetch(`${API_BASE}/api/forecasts/day-ahead/${deliveryDate}`);
    if (!res.ok) throw new Error(`Failed to fetch day-ahead forecast: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  getCsvExportUrl(dateFrom: string, dateTo: string): string {
    return `${API_BASE}/api/export/comparison?date_from=${dateFrom}&date_to=${dateTo}`;
  },
};
