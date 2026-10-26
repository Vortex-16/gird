"""
Elexon BMRS Insights API client.

Fetches wind generation actuals (FUELHH) and forecasts (WINDFOR)
for the UK national grid.  All dates are scoped to January 2026.
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

#  In-memory cache 
_cache: dict[str, tuple[float, Any]] = {}


def _get_cached(key: str) -> Any | None:
    """Return cached value if still within TTL, else None."""
    if key in _cache:
        ts, data = _cache[key]
        if time.time() - ts < settings.CACHE_TTL:
            logger.debug("Cache HIT for %s", key)
            return data
        del _cache[key]
    return None


def _set_cached(key: str, data: Any) -> None:
    _cache[key] = (time.time(), data)


#  HTTP helpers 

async def _fetch_json(url: str, params: dict | None = None) -> list[dict]:
    """
    Fetch JSON from Elexon.  The stream endpoints return the full
    dataset in one shot (no pagination needed).
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        logger.info("GET %s  params=%s", url, params)
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        return resp.json()


#  Public API 

async def fetch_wind_actuals(
    date_from: str | None = None,
    date_to: str | None = None,
) -> list[dict]:
    """
    Fetch half-hourly actual wind generation from FUELHH.

    Parameters
    ----------
    date_from : str  – settlement date start  (YYYY-MM-DD)
    date_to   : str  – settlement date end    (YYYY-MM-DD)

    Returns list of dicts with keys:
        dataset, publishTime, startTime, settlementDate,
        settlementPeriod, fuelType, generation
    """
    date_from = date_from or settings.DATA_START_DATE
    date_to = date_to or settings.DATA_END_DATE

    cache_key = f"actuals:{date_from}:{date_to}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    url = f"{settings.ELEXON_BASE_URL}{settings.ELEXON_FUELHH_ENDPOINT}"
    params = {
        "settlementDateFrom": date_from,
        "settlementDateTo": date_to,
        "fuelType": "WIND",
    }

    data = await _fetch_json(url, params)
    _set_cached(cache_key, data)
    logger.info("Fetched %d FUELHH records (%s → %s)", len(data), date_from, date_to)
    return data


async def fetch_wind_forecasts(
    publish_from: str | None = None,
    publish_to: str | None = None,
) -> list[dict]:
    """
    Fetch wind generation forecasts from WINDFOR.

    Parameters
    ----------
    publish_from : str  – ISO-8601 datetime for publishTime lower bound
    publish_to   : str  – ISO-8601 datetime for publishTime upper bound

    Returns list of dicts with keys:
        dataset, publishTime, startTime, generation
    """
    # Default: forecasts published during the entire January 2026 window.
    # We fetch slightly earlier (Dec 31) to capture forecasts published
    # before midnight that cover Jan 1 delvery.
    publish_from = publish_from or "2025-12-31T00:00:00Z"
    publish_to = publish_to or "2026-02-01T00:00:00Z"

    cache_key = f"forecasts:{publish_from}:{publish_to}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    url = f"{settings.ELEXON_BASE_URL}{settings.ELEXON_WINDFOR_ENDPOINT}"

    # The API may have limits on date range per request.
    # We chunk by week to be safe and merge results.
    all_data: list[dict] = []
    chunk_start = datetime.fromisoformat(publish_from.replace("Z", "+00:00"))
    chunk_end_limit = datetime.fromisoformat(publish_to.replace("Z", "+00:00"))

    while chunk_start < chunk_end_limit:
        chunk_end = min(chunk_start + timedelta(days=7), chunk_end_limit)
        params = {
            "publishDateTimeFrom": chunk_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "publishDateTimeTo": chunk_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        chunk_data = await _fetch_json(url, params)
        all_data.extend(chunk_data)
        logger.info(
            "Fetched %d WINDFOR records (chunk %s → %s)",
            len(chunk_data),
            params["publishDateTimeFrom"],
            params["publishDateTimeTo"],
        )
        chunk_start = chunk_end

    _set_cached(cache_key, all_data)
    logger.info("Total WINDFOR records fetched: %d", len(all_data))
    return all_data


async def fetch_forecasts_for_delivery_date(delivery_date: str) -> list[dict]:
    """
    Fetch the forecasts that would have been available when making
    day-ahead purchase decisions for a specific delivery date.

    Day-ahead gate closure is typically ~11:00 UTC the day before.
    We fetch forecasts published up to 11:00 UTC on (delivery_date - 1 day),
    whose startTime falls within the delivery date.
    """
    cache_key = f"forecasts_delivery:{delivery_date}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    delivery = datetime.strptime(delivery_date, "%Y-%m-%d")
    decision_day = delivery - timedelta(days=1)

    # Forecasts published from 2 days before up to gate closure
    publish_from = (decision_day - timedelta(days=1)).strftime("%Y-%m-%dT00:00:00Z")
    publish_to = decision_day.strftime("%Y-%m-%dT11:00:00Z")

    url = f"{settings.ELEXON_BASE_URL}{settings.ELEXON_WINDFOR_ENDPOINT}"
    params = {
        "publishDateTimeFrom": publish_from,
        "publishDateTimeTo": publish_to,
    }

    data = await _fetch_json(url, params)

    # Filter to only forecasts whose startTime falls on the delivery date
    delivery_str = delivery.strftime("%Y-%m-%d")
    filtered = [
        r for r in data
        if r.get("startTime", "").startswith(delivery_str)
    ]

    _set_cached(cache_key, filtered)
    logger.info(
        "Fetched %d forecasts for delivery date %s (from %d raw)",
        len(filtered), delivery_date, len(data),
    )
    return filtered
