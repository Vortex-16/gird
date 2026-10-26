"""
GridBricks Backend — FastAPI Application Entry Point.

UK Wind Power Forecast Analytics API for day-ahead market decisions.
Data sourced from Elexon BMRS Insights API (January 2026).
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import router

#  Logging  
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

#  FastAPI app  
app = FastAPI(
    title="GridBricks API",
    description=(
        "Wind power forecast analytics backend for UK day-ahead market decisions. "
        "Provides actual vs forecast comparison, accuracy metrics, and error analysis "
        "using Elexon BMRS data for January 2026."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

#  CORS  
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#  Register routes  
app.include_router(router)


#  Root endpoint  
@app.get("/")
async def root():
    return {
        "service": "GridBricks API",
        "version": "1.0.0",
        "description": "UK Wind Power Forecast Analytics",
        "docs": "/docs",
        "scope": "January 2026",
        "endpoints": [
            "/api/health",
            "/api/actuals",
            "/api/forecasts",
            "/api/forecasts/day-ahead/{delivery_date}",
            "/api/comparison",
            "/api/accuracy",
            "/api/daily-summary",
            "/api/error-distribution",
            "/api/hourly-profile",
            "/api/export/comparison",
        ],
    }
