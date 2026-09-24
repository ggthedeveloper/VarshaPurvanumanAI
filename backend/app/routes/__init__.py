"""
Routes package for VarshaPurvanumanAI Backend.
"""
from .health import router as health_router
from .models import router as models_router
from .regime import router as regime_router
from .rainfall import router as rainfall_router
from .forecast import router as forecast_router
from .districts import router as districts_router
from .verification import router as verification_router
from .auth import router as auth_router
from .grid import router as grid_router

__all__ = [
    "health_router",
    "models_router",
    "regime_router",
    "rainfall_router",
    "forecast_router",
    "districts_router",
    "verification_router",
    "auth_router",
    "grid_router",
]

