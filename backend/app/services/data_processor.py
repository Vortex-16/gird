"""
Data processing service for GridBricks.

Handles alignment between FUELHH (30-min actuals) and WINDFOR (hourly forecasts),
selecting the correct forecast vintage for day-ahead decisions.
Implemented in clean, dependency-free Python for maximum speed and portability.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


def parse_iso(dt_str: str) -> datetime:
    """Parse ISO datetime string to timezone-aware UTC datetime."""
    if not dt_str:
        return datetime.min.replace(tzinfo=timezone.utc)
    # Normalize trailing Z
    dt_str = dt_str.replace("Z", "+00:00")
    dt = datetime.fromisoformat(dt_str)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def format_iso(dt: datetime) -> str:
    """Format datetime to ISO UTC string."""
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def aggregate_actuals_to_hourly(actuals_raw: list[dict[str, Any]]) -> dict[str, float]:
    """
    Aggregate 30-min actuals (FUELHH) to hourly by averaging records in the same hour.

    Returns dict mapping hour ISO string (e.g. '2026-01-01T00:00:00Z') to average MW.
    """
    hourly_buckets: dict[str, list[float]] = defaultdict(list)

    for item in actuals_raw:
        gen = item.get("generation")
        if gen is None:
            continue
        st = item.get("startTime")
        if not st:
            continue
        dt = parse_iso(st)
        hour_key = format_iso(dt.replace(minute=0, second=0, microsecond=0))
        try:
            hourly_buckets[hour_key].append(float(gen))
        except (ValueError, TypeError):
            continue

    # Average each hour
    return {
        hour_key: sum(values) / len(values)
        for hour_key, values in hourly_buckets.items()
        if values
    }


def select_latest_forecast_per_hour(
    forecasts_raw: list[dict[str, Any]],
    gate_closure: datetime | None = None,
) -> dict[str, dict[str, Any]]:
    """
    For each target hour (startTime), select the forecast from the
    latest publishTime that was available before gate_closure (if specified).

    Returns dict mapping target hour ISO string to:
        {"forecast_mw": float, "publish_time": datetime, "start_time": datetime}
    """
    latest_per_hour: dict[str, dict[str, Any]] = {}

    for item in forecasts_raw:
        gen = item.get("generation")
        st = item.get("startTime")
        pt = item.get("publishTime")
        if gen is None or not st or not pt:
            continue

        start_dt = parse_iso(st)
        publish_dt = parse_iso(pt)

        if gate_closure is not None and publish_dt > gate_closure:
            continue

        hour_key = format_iso(start_dt.replace(minute=0, second=0, microsecond=0))
        try:
            gen_val = float(gen)
        except (ValueError, TypeError):
            continue

        if hour_key not in latest_per_hour:
            latest_per_hour[hour_key] = {
                "forecast_mw": gen_val,
                "publish_time": publish_dt,
                "start_time": start_dt,
            }
        else:
            if publish_dt > latest_per_hour[hour_key]["publish_time"]:
                latest_per_hour[hour_key] = {
                    "forecast_mw": gen_val,
                    "publish_time": publish_dt,
                    "start_time": start_dt,
                }

    return latest_per_hour


def align_actuals_and_forecasts(
    actuals_raw: list[dict[str, Any]],
    forecasts_raw: list[dict[str, Any]],
    date_from: str | None = None,
    date_to: str | None = None,
) -> list[dict[str, Any]]:
    """
    Build an aligned list joining hourly actuals with the latest available forecast.

    Each item contains:
        start_time: str (ISO)
        actual_mw: float
        forecast_mw: float
        error_mw: float (forecast - actual)
        abs_error_mw: float
        pct_error: float | None
    """
    hourly_actuals = aggregate_actuals_to_hourly(actuals_raw)
    latest_forecasts = select_latest_forecast_per_hour(forecasts_raw)

    dt_from = parse_iso(f"{date_from}T00:00:00Z") if date_from else None
    dt_to = parse_iso(f"{date_to}T23:59:59Z") if date_to else None

    aligned: list[dict[str, Any]] = []

    # Find common target hours
    common_hours = set(hourly_actuals.keys()) & set(latest_forecasts.keys())

    for hour_key in sorted(common_hours):
        dt = parse_iso(hour_key)
        if dt_from and dt < dt_from:
            continue
        if dt_to and dt > dt_to:
            continue

        act = hourly_actuals[hour_key]
        fc = latest_forecasts[hour_key]["forecast_mw"]
        err = fc - act
        abs_err = abs(err)
        pct_err = (abs_err / act * 100.0) if act > 0 else None

        aligned.append({
            "start_time": hour_key,
            "actual_mw": round(act, 2),
            "forecast_mw": round(fc, 2),
            "error_mw": round(err, 2),
            "abs_error_mw": round(abs_err, 2),
            "pct_error": round(pct_err, 2) if pct_err is not None else None,
        })

    logger.info("Aligned %d hourly comparison points", len(aligned))
    return aligned


def build_daily_groups(aligned: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    """Group aligned hourly records by date string (YYYY-MM-DD)."""
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for pt in aligned:
        date_str = pt["start_time"][:10]
        groups[date_str].append(pt)
    return dict(sorted(groups.items()))
