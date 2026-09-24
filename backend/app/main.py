"""
FastAPI Main Application Entrypoint for VarshaPurvanumanAI.
Provides production-quality REST API endpoints for regime classification,
rainfall post-processing, probability of exceedance, and verification.
"""
from contextlib import asynccontextmanager
import time
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.app.config import settings
from backend.app.utils.logger import logger
from backend.app.services.model_loader import registry
from backend.app.routes import (
    health_router,
    models_router,
    regime_router,
    rainfall_router,
    forecast_router,
    districts_router,
    verification_router,
    auth_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager: loads authoritative model artifacts once on startup.
    """
    logger.info("Starting VarshaPurvanumanAI API...")
    registry.load_all_models()
    yield
    logger.info("Shutting down VarshaPurvanumanAI API...")


app = FastAPI(
    title="VarshaPurvanumanAI — Monsoon Rainfall AI Post-Processing API",
    description=(
        "Production-quality backend API for SIH26080: 'Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts' (MoES). "
        "Exposes operational synoptic regime classification, regime-aware point rainfall bias-correction, "
        "calibrated probability of exceedance for heavy rainfall thresholds, and verified scientific metrics."
    ),
    version=settings.API_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS Middleware Configuration
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request Latency and Logging Middleware
# ---------------------------------------------------------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000.0
    logger.info(
        f"{request.method} {request.url.path} | Status: {response.status_code} | Latency: {duration_ms:.2f}ms"
    )
    response.headers["X-Response-Time-Ms"] = f"{duration_ms:.2f}"
    response.headers["X-Data-Status"] = settings.DATA_STATUS
    return response


# ---------------------------------------------------------------------------
# Custom Error Handlers
# ---------------------------------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handles Pydantic schema validation failures with clean error structure."""
    errors = []
    for err in exc.errors():
        field = " -> ".join(str(loc) for loc in err.get("loc", []))
        msg = err.get("msg", "Invalid value")
        errors.append(f"{field}: {msg}")
    logger.warning(f"Request validation error on {request.url.path}: {errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={
            "error": "Validation Failure",
            "details": errors,
            "data_status": settings.DATA_STATUS,
        }
    )


# ---------------------------------------------------------------------------
# Router Registration
# ---------------------------------------------------------------------------
app.include_router(health_router)
app.include_router(models_router)
app.include_router(regime_router)
app.include_router(rainfall_router)
app.include_router(forecast_router)
app.include_router(districts_router)
app.include_router(verification_router)
app.include_router(auth_router)


@app.get("/", summary="Root Status")
def root():
    return {
        "service": settings.SERVICE_NAME,
        "version": settings.API_VERSION,
        "docs": "/docs",
        "health": "/api/health",
        "data_status": settings.DATA_STATUS,
    }
