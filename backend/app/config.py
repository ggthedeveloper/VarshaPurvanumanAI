"""
Configuration module for VarshaPurvanumanAI Backend.
Loads settings from environment variables with secure production-ready defaults.
"""
import os
from typing import List


class Settings:
    SERVICE_NAME: str = "VarshaPurvanumanAI Backend"
    API_VERSION: str = "1.0.0"
    HOST: str = os.getenv("BACKEND_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    APP_ENV: str = os.getenv("APP_ENV", "production")
    DATA_STATUS: str = os.getenv("DATA_STATUS", "REAL_DATA")

    # CORS configuration
    CORS_ALLOWED_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ALLOWED_ORIGINS",
            "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    ]

    # File paths
    PROJECT_ROOT: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    MODELS_DIR: str = os.path.join(PROJECT_ROOT, "models")
    REPORTS_DIR: str = os.path.join(PROJECT_ROOT, "reports")
    DATA_DIR: str = os.path.join(PROJECT_ROOT, "data")

    # Specific model artifact paths
    REGIME_CLASSIFIER_PATH: str = os.path.join(MODELS_DIR, "regime_classifier.pkl")
    GLOBAL_POSTPROCESSOR_PATH: str = os.path.join(MODELS_DIR, "global_postprocessor.pkl")
    REGIME_POSTPROCESSORS_DIR: str = os.path.join(MODELS_DIR, "regime_postprocessors")
    REGIME_POSTPROCESSOR_META: str = os.path.join(MODELS_DIR, "regime_postprocessor_metadata.json")
    PROBABILITY_SUITE_PATH: str = os.path.join(MODELS_DIR, "probability", "probability_suite.pkl")

    # Specific verification report paths
    FINAL_METRICS_PATH: str = os.path.join(REPORTS_DIR, "final_metrics.json")
    FINAL_METADATA_PATH: str = os.path.join(REPORTS_DIR, "final_verification_metadata.json")
    PROVENANCE_PATH: str = os.path.join(DATA_DIR, "metadata", "feature_pipeline_provenance.json")
    DISTRICT_GEOJSON_PATH: str = os.path.join(DATA_DIR, "raw", "boundaries", "DISTRICT_F-2.json")


settings = Settings()
