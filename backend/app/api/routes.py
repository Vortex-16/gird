"""
FastAPI route definitions for the GridBricks backend.

All endpoints serve data scoped to January 2026 for UK national wind power.
"""

from __future__ import annotations

import io
import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.api.elexon import (
    fetch_wind_actuals,
    fetch_wind_forecasts,
    fetch_forecasts_for_delivery_date,
)
from app.services.data_processor import (
    align_actuals_and_forecasts,
    select_latest_forecast_per_hour,
)
from app.services.analytics import (
    compute_accuracy_metrics,
    compute_daily_summaries,
    compute_error_distribution,
    compute_hourly_error_profile,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Wind Analytics"])


# ── Health check ───────────────────────────────────────────────────────────

@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "gridbricks-backend",
        "scope": "January 2026",
    }


# ── Actuals ────────────────────────────────────────────────────────────────

@router.get("/actuals")
async def get_actuals(
    date_from: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    date_to: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
):
    """Fetch half-hourly actual wind generation (FUELHH, fuelType=WIND)."""
    try:
        raw = await fetch_wind_actuals(date_from, date_to)
        return {
            "data": raw,
            "total": len(raw),
            "date_from": date_from,
            "date_to": date_to,
        }
    except Exception as e:
        logger.exception("Error fetching actuals")
        raise HTTPException(status_code=502, detail=f"Elexon API error: {str(e)}")


# ── Forecasts ──────────────────────────────────────────────────────────────

@router.get("/forecasts")
async def get_forecasts(
    publish_from: str = Query(
        "2025-12-31T00:00:00Z",
        description="Publish time lower bound (ISO-8601)",
    ),
    publish_to: str = Query(
        "2026-02-01T00:00:00Z",
        description="Publish time upper bound (ISO-8601)",
    ),
):
    """Fetch wind generation forecasts (WINDFOR)."""
    try:
        raw = await fetch_wind_forecasts(publish_from, publish_to)
        return {
            "data": raw,
            "total": len(raw),
            "publish_from": publish_from,
            "publish_to": publish_to,
        }
    except Exception as e:
        logger.exception("Error fetching forecasts")
        raise HTTPException(status_code=502, detail=f"Elexon API error: {str(e)}")


# ── Day-ahead forecasts for a delivery date ────────────────────────────────

@router.get("/forecasts/day-ahead/{delivery_date}")
async def get_day_ahead_forecasts(delivery_date: str):
    """
    Get the forecasts that were available at day-ahead gate closure
    (11:00 UTC the day before) for a specific delivery date.
    """
    try:
        raw = await fetch_forecasts_for_delivery_date(delivery_date)
        latest_map = select_latest_forecast_per_hour(raw)

        result = [
            {
                "startTime": hour_key,
                "generation": info["forecast_mw"],
                "publishTime": info["publish_time"].isoformat(),
            }
            for hour_key, info in sorted(latest_map.items())
        ]

        return {
            "data": result,
            "delivery_date": delivery_date,
            "total": len(result),
        }
    except Exception as e:
        logger.exception("Error fetching day-ahead forecasts")
        raise HTTPException(status_code=502, detail=f"Error: {str(e)}")


# ── Comparison (aligned actuals vs forecasts) ─────────────────────────────

@router.get("/comparison")
async def get_comparison(
    date_from: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    date_to: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
):
    """
    Get aligned hourly comparison of actual vs forecast wind generation.
    Actuals are aggregated from 30-min to hourly. Forecasts use the
    latest available publish vintage per target hour.
    """
    try:
        actuals_raw = await fetch_wind_actuals(date_from, date_to)
        forecasts_raw = await fetch_wind_forecasts()
        aligned = align_actuals_and_forecasts(
            actuals_raw, forecasts_raw, date_from, date_to
        )

        return {
            "data": aligned,
            "date_from": date_from,
            "date_to": date_to,
            "total_points": len(aligned),
        }
    except Exception as e:
        logger.exception("Error building comparison")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


# ── Accuracy metrics ──────────────────────────────────────────────────────

@router.get("/accuracy")
async def get_accuracy_metrics(
    date_from: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    date_to: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
):
    """Compute aggregate forecast accuracy metrics for the date range."""
    try:
        actuals_raw = await fetch_wind_actuals(date_from, date_to)
        forecasts_raw = await fetch_wind_forecasts()
        aligned = align_actuals_and_forecasts(
            actuals_raw, forecasts_raw, date_from, date_to
        )
        metrics = compute_accuracy_metrics(aligned)
        metrics["date_from"] = date_from
        metrics["date_to"] = date_to
        return metrics
    except Exception as e:
        logger.exception("Error computing accuracy metrics")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


# ── Daily summary ─────────────────────────────────────────────────────────

@router.get("/daily-summary")
async def get_daily_summary(
    date_from: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    date_to: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
):
    """Compute per-day aggregated statistics."""
    try:
        actuals_raw = await fetch_wind_actuals(date_from, date_to)
        forecasts_raw = await fetch_wind_forecasts()
        aligned = align_actuals_and_forecasts(
            actuals_raw, forecasts_raw, date_from, date_to
        )
        summaries = compute_daily_summaries(aligned)
        return {
            "data": summaries,
            "date_from": date_from,
            "date_to": date_to,
        }
    except Exception as e:
        logger.exception("Error computing daily summary")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


# ── Error distribution ────────────────────────────────────────────────────

@router.get("/error-distribution")
async def get_error_distribution(
    date_from: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    date_to: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
    bins: int = Query(25, description="Number of histogram bins"),
):
    """Compute forecast error distribution (histogram and statistics)."""
    try:
        actuals_raw = await fetch_wind_actuals(date_from, date_to)
        forecasts_raw = await fetch_wind_forecasts()
        aligned = align_actuals_and_forecasts(
            actuals_raw, forecasts_raw, date_from, date_to
        )
        dist = compute_error_distribution(aligned, num_bins=bins)
        dist["date_from"] = date_from
        dist["date_to"] = date_to
        return dist
    except Exception as e:
        logger.exception("Error computing error distribution")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


# ── Hourly error profile ─────────────────────────────────────────────────

@router.get("/hourly-profile")
async def get_hourly_error_profile(
    date_from: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    date_to: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
):
    """Compute average forecast error by hour of day (0-23)."""
    try:
        actuals_raw = await fetch_wind_actuals(date_from, date_to)
        forecasts_raw = await fetch_wind_forecasts()
        aligned = align_actuals_and_forecasts(
            actuals_raw, forecasts_raw, date_from, date_to
        )
        profile = compute_hourly_error_profile(aligned)
        return {
            "data": profile,
            "date_from": date_from,
            "date_to": date_to,
        }
    except Exception as e:
        logger.exception("Error computing hourly profile")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


# ── CSV Export ────────────────────────────────────────────────────────────

@router.get("/export/comparison")
async def export_comparison_csv(
    date_from: str = Query("2026-01-01"),
    date_to: str = Query("2026-01-31"),
):
    """Export comparison data as CSV."""
    try:
        actuals_raw = await fetch_wind_actuals(date_from, date_to)
        forecasts_raw = await fetch_wind_forecasts()
        aligned = align_actuals_and_forecasts(
            actuals_raw, forecasts_raw, date_from, date_to
        )

        output = io.StringIO()
        output.write("start_time,actual_mw,forecast_mw,error_mw,abs_error_mw,pct_error\n")
        for pt in aligned:
            pct_val = "" if pt["pct_error"] is None else str(pt["pct_error"])
            output.write(
                f"{pt['start_time']},{pt['actual_mw']},{pt['forecast_mw']},"
                f"{pt['error_mw']},{pt['abs_error_mw']},{pct_val}\n"
            )

        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition":
                    f"attachment; filename=wind_comparison_{date_from}_{date_to}.csv"
            },
        )
    except Exception as e:
        logger.exception("Error exporting CSV")
        raise HTTPException(status_code=500, detail=f"Export error: {str(e)}")
