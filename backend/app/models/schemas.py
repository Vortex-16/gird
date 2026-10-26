"""
Pydantic models / response schemas for the GridBricks API.
"""

from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


#  Raw data models  

class ActualGeneration(BaseModel):
    """A single half-hourly actual wind generation record from FUELHH."""
    start_time: datetime = Field(..., alias="startTime")
    settlement_date: str = Field(..., alias="settlementDate")
    settlement_period: int = Field(..., alias="settlementPeriod")
    generation: float


class ForecastGeneration(BaseModel):
    """A single wind generation forecast record from WINDFOR."""
    start_time: datetime = Field(..., alias="startTime")
    publish_time: datetime = Field(..., alias="publishTime")
    generation: float


#  Comparison / aligned data  

class ComparisonPoint(BaseModel):
    """A single aligned forecast-vs-actual data point (hourly)."""
    start_time: datetime
    actual_mw: float
    forecast_mw: float
    error_mw: float  # forecast - actual
    abs_error_mw: float
    pct_error: float | None = None  # percentage error, None if actual is 0


class ComparisonResponse(BaseModel):
    """Full comparison dataset for a date range."""
    data: list[ComparisonPoint]
    date_from: str
    date_to: str
    total_points: int


#  Accuracy metrics  

class AccuracyMetrics(BaseModel):
    """Quantitative forecast accuracy metrics over a date range."""
    mae: float = Field(..., description="Mean Absolute Error (MW)")
    rmse: float = Field(..., description="Root Mean Squared Error (MW)")
    mape: float = Field(..., description="Mean Absolute Percentage Error (%)")
    bias: float = Field(..., description="Mean Error / Bias (MW)")
    max_overforecast: float = Field(..., description="Max overforecast (MW)")
    max_underforecast: float = Field(..., description="Max underforecast (MW)")
    correlation: float = Field(..., description="Pearson correlation coefficient")
    total_points: int
    date_from: str
    date_to: str


#  Daily summary  

class DailySummary(BaseModel):
    """Aggregated statistics for a single day."""
    date: str
    avg_actual_mw: float
    avg_forecast_mw: float
    peak_actual_mw: float
    peak_forecast_mw: float
    min_actual_mw: float
    mae: float
    rmse: float
    mape: float
    bias: float
    total_points: int


class DailySummaryResponse(BaseModel):
    """List of daily summaries."""
    data: list[DailySummary]
    date_from: str
    date_to: str


#  Forecast versions  

class ForecastVersion(BaseModel):
    """A specific forecast vintage (publish time) with its data."""
    publish_time: datetime
    forecasts: list[ForecastPoint]


class ForecastPoint(BaseModel):
    """A single point within a forecast version."""
    start_time: datetime
    generation: float


# Rebuild models to resolve forward references
ForecastVersion.model_rebuild()


#  Error distribution  

class ErrorDistribution(BaseModel):
    """Histogram data for forecast error distribution."""
    bins: list[float]
    counts: list[int]
    mean_error: float
    std_error: float
    skewness: float


#  Hourly error profile  

class HourlyErrorProfile(BaseModel):
    """Average forecast error by hour of day."""
    hour: int
    avg_error: float
    avg_abs_error: float
    count: int
