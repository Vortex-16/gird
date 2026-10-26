"""
Analytics engine for forecast accuracy evaluation.

Computes MAE, RMSE, MAPE, Bias, Correlation, error distribution,
hourly error profiles, and daily summaries using Python standard library.
"""

from __future__ import annotations

import logging
import math
from collections import defaultdict
from typing import Any

from app.services.data_processor import build_daily_groups

logger = logging.getLogger(__name__)


def compute_accuracy_metrics(aligned: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Compute aggregate forecast accuracy metrics over an aligned dataset.

    Returns dict with keys:
        mae, rmse, mape, bias, max_overforecast, max_underforecast, correlation, total_points
    """
    if not aligned:
        return {
            "mae": 0.0,
            "rmse": 0.0,
            "mape": 0.0,
            "bias": 0.0,
            "max_overforecast": 0.0,
            "max_underforecast": 0.0,
            "correlation": 0.0,
            "total_points": 0,
        }

    n = len(aligned)
    errors = [pt["error_mw"] for pt in aligned]
    abs_errors = [pt["abs_error_mw"] for pt in aligned]
    pct_errors = [pt["pct_error"] for pt in aligned if pt["pct_error"] is not None]

    mae = sum(abs_errors) / n
    rmse = math.sqrt(sum(e * e for e in errors) / n)
    mape = (sum(pct_errors) / len(pct_errors)) if pct_errors else 0.0
    bias = sum(errors) / n

    max_over = max(errors)
    max_under = min(errors)

    # Pearson correlation coefficient between actual and forecast
    actuals = [pt["actual_mw"] for pt in aligned]
    forecasts = [pt["forecast_mw"] for pt in aligned]

    if n > 1:
        mean_act = sum(actuals) / n
        mean_fc = sum(forecasts) / n

        num = sum((a - mean_act) * (f - mean_fc) for a, f in zip(actuals, forecasts))
        den_act = sum((a - mean_act) ** 2 for a in actuals)
        den_fc = sum((f - mean_fc) ** 2 for f in forecasts)

        denom = math.sqrt(den_act * den_fc)
        corr = (num / denom) if denom > 0 else 0.0
    else:
        corr = 0.0

    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "mape": round(mape, 2),
        "bias": round(bias, 2),
        "max_overforecast": round(max_over, 2),
        "max_underforecast": round(max_under, 2),
        "correlation": round(corr, 4),
        "total_points": n,
    }


def compute_daily_summaries(aligned: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Compute per-day aggregated statistics."""
    daily_groups = build_daily_groups(aligned)
    summaries = []

    for date_str, day_points in daily_groups.items():
        if not day_points:
            continue
        metrics = compute_accuracy_metrics(day_points)
        actuals = [p["actual_mw"] for p in day_points]
        forecasts = [p["forecast_mw"] for p in day_points]

        summaries.append({
            "date": date_str,
            "avg_actual_mw": round(sum(actuals) / len(actuals), 2),
            "avg_forecast_mw": round(sum(forecasts) / len(forecasts), 2),
            "peak_actual_mw": round(max(actuals), 2),
            "peak_forecast_mw": round(max(forecasts), 2),
            "min_actual_mw": round(min(actuals), 2),
            "mae": metrics["mae"],
            "rmse": metrics["rmse"],
            "mape": metrics["mape"],
            "bias": metrics["bias"],
            "total_points": metrics["total_points"],
        })

    return summaries


def compute_error_distribution(
    aligned: list[dict[str, Any]],
    num_bins: int = 25,
) -> dict[str, Any]:
    """Compute histogram and statistical distribution of forecast errors."""
    if not aligned:
        return {
            "bins": [],
            "counts": [],
            "mean_error": 0.0,
            "std_error": 0.0,
            "skewness": 0.0,
        }

    errors = [pt["error_mw"] for pt in aligned]
    n = len(errors)
    mean_val = sum(errors) / n
    variance = sum((e - mean_val) ** 2 for e in errors) / n
    std_val = math.sqrt(variance)

    # Skewness (Fisher-Pearson standardized 3rd moment)
    if std_val > 0 and n > 2:
        m3 = sum((e - mean_val) ** 3 for e in errors) / n
        skewness = m3 / (std_val ** 3)
    else:
        skewness = 0.0

    min_err = min(errors)
    max_err = max(errors)

    if min_err == max_err:
        return {
            "bins": [round(min_err, 2)],
            "counts": [n],
            "mean_error": round(mean_val, 2),
            "std_error": round(std_val, 2),
            "skewness": round(skewness, 4),
        }

    bin_width = (max_err - min_err) / num_bins
    bin_counts = [0] * num_bins
    bin_centres = [min_err + (i + 0.5) * bin_width for i in range(num_bins)]

    for e in errors:
        idx = int((e - min_err) / bin_width)
        if idx >= num_bins:
            idx = num_bins - 1
        bin_counts[idx] += 1

    return {
        "bins": [round(b, 2) for b in bin_centres],
        "counts": bin_counts,
        "mean_error": round(mean_val, 2),
        "std_error": round(std_val, 2),
        "skewness": round(skewness, 4),
    }


def compute_hourly_error_profile(aligned: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Compute average forecast error by hour-of-day (0-23)."""
    if not aligned:
        return []

    buckets: dict[int, list[tuple[float, float]]] = defaultdict(list)
    for pt in aligned:
        # ISO string format: YYYY-MM-DDTHH:MM:SSZ
        try:
            hour = int(pt["start_time"][11:13])
            buckets[hour].append((pt["error_mw"], pt["abs_error_mw"]))
        except (ValueError, IndexError):
            continue

    profile = []
    for hour in range(24):
        pairs = buckets.get(hour, [])
        if pairs:
            avg_err = sum(p[0] for p in pairs) / len(pairs)
            avg_abs = sum(p[1] for p in pairs) / len(pairs)
            profile.append({
                "hour": hour,
                "avg_error": round(avg_err, 2),
                "avg_abs_error": round(avg_abs, 2),
                "count": len(pairs),
            })
        else:
            profile.append({
                "hour": hour,
                "avg_error": 0.0,
                "avg_abs_error": 0.0,
                "count": 0,
            })

    return profile
