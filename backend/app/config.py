"""
Configuration settings for the GridBricks backend.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application configuration loaded from environment variables."""

    # Elexon BMRS API
    ELEXON_BASE_URL: str = "https://data.elexon.co.uk/bmrs/api/v1"
    ELEXON_FUELHH_ENDPOINT: str = "/datasets/FUELHH/stream"
    ELEXON_WINDFOR_ENDPOINT: str = "/datasets/WINDFOR/stream"

    # Data scope
    DATA_START_DATE: str = "2026-01-01"
    DATA_END_DATE: str = "2026-01-31"

    # Cache TTL in seconds (1 hour — data is historical)
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "3600"))

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # CORS origins (comma-separated)
    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://localhost:8080"
    ).split(",")


settings = Settings()
