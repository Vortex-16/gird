"""
Unit tests for data processor and analytics engine.
"""

from datetime import datetime, timezone
from app.services.data_processor import (
    parse_iso,
    format_iso,
    aggregate_actuals_to_hourly,
    select_latest_forecast_per_hour,
    align_actuals_and_forecasts,
    build_daily_groups,
)
from app.services.analytics import (
    compute_accuracy_metrics,
    compute_daily_summaries,
    compute_error_distribution,
    compute_hourly_error_profile,
)


def test_aggregate_actuals_to_hourly():
    # 2 half-hour records in the 00:00 hour: 100 MW and 200 MW -> mean = 150 MW
    sample_actuals = [
        {"startTime": "2026-01-01T00:00:00Z", "generation": 100},
        {"startTime": "2026-01-01T00:30:00Z", "generation": 200},
        {"startTime": "2026-01-01T01:00:00Z", "generation": 300},
    ]
    hourly = aggregate_actuals_to_hourly(sample_actuals)
    assert "2026-01-01T00:00:00Z" in hourly
    assert hourly["2026-01-01T00:00:00Z"] == 150.0
    assert hourly["2026-01-01T01:00:00Z"] == 300.0


def test_select_latest_forecast_per_hour():
    # Two forecasts for the same target hour, published at 08:00 and 10:00
    sample_forecasts = [
        {
            "startTime": "2026-01-02T12:00:00Z",
            "publishTime": "2026-01-01T08:00:00Z",
            "generation": 1000,
        },
        {
            "startTime": "2026-01-02T12:00:00Z",
            "publishTime": "2026-01-01T10:00:00Z",
            "generation": 1200,
        },
    ]
    latest = select_latest_forecast_per_hour(sample_forecasts)
    assert "2026-01-02T12:00:00Z" in latest
    assert latest["2026-01-02T12:00:00Z"]["forecast_mw"] == 1200.0

    # With gate closure before 09:00, it should pick the 08:00 one (1000 MW)
    gate = datetime(2026, 1, 1, 9, 0, 0, tzinfo=timezone.utc)
    filtered = select_latest_forecast_per_hour(sample_forecasts, gate_closure=gate)
    assert filtered["2026-01-02T12:00:00Z"]["forecast_mw"] == 1000.0


def test_compute_accuracy_metrics():
    # 3 points:
    # 1: act=100, fc=110 -> err=+10, abs=10, pct=10%
    # 2: act=200, fc=180 -> err=-20, abs=20, pct=10%
    # 3: act=300, fc=330 -> err=+30, abs=30, pct=10%
    data = [
        {"start_time": "2026-01-01T00:00:00Z", "actual_mw": 100.0, "forecast_mw": 110.0, "error_mw": 10.0, "abs_error_mw": 10.0, "pct_error": 10.0},
        {"start_time": "2026-01-01T01:00:00Z", "actual_mw": 200.0, "forecast_mw": 180.0, "error_mw": -20.0, "abs_error_mw": 20.0, "pct_error": 10.0},
        {"start_time": "2026-01-01T02:00:00Z", "actual_mw": 300.0, "forecast_mw": 330.0, "error_mw": 30.0, "abs_error_mw": 30.0, "pct_error": 10.0},
    ]
    metrics = compute_accuracy_metrics(data)
    # MAE = (10 + 20 + 30) / 3 = 20.0
    assert metrics["mae"] == 20.0
    # RMSE = sqrt((100 + 400 + 900)/3) = sqrt(1400/3) = sqrt(466.666) ~= 21.60
    assert metrics["rmse"] == 21.6
    # Bias = (10 - 20 + 30) / 3 = 6.67
    assert metrics["bias"] == 6.67
    # Max overforecast = 30.0, max underforecast = -20.0
    assert metrics["max_overforecast"] == 30.0
    assert metrics["max_underforecast"] == -20.0
    assert metrics["total_points"] == 3
    assert metrics["correlation"] > 0.95


def test_error_distribution_and_hourly_profile():
    data = [
        {"start_time": f"2026-01-01T{h:02d}:00:00Z", "actual_mw": 500.0, "forecast_mw": 500.0 + (h * 10), "error_mw": float(h * 10), "abs_error_mw": float(h * 10), "pct_error": float(h * 2)}
        for h in range(24)
    ]
    dist = compute_error_distribution(data, num_bins=10)
    assert len(dist["bins"]) == 10
    assert sum(dist["counts"]) == 24
    assert "mean_error" in dist
    assert "std_error" in dist
    assert "skewness" in dist

    profile = compute_hourly_error_profile(data)
    assert len(profile) == 24
    assert profile[0]["hour"] == 0
    assert profile[0]["avg_error"] == 0.0
    assert profile[10]["avg_error"] == 100.0


if __name__ == "__main__":
    test_aggregate_actuals_to_hourly()
    test_select_latest_forecast_per_hour()
    test_compute_accuracy_metrics()
    test_error_distribution_and_hourly_profile()
    print("All unit tests passed successfully!")
