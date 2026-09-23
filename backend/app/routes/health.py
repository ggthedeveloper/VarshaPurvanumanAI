"""
Health check route handler for VarshaPurvanumanAI Backend.
"""
from fastapi import APIRouter
from backend.app.config import settings
from backend.app.services.model_loader import registry

router = APIRouter(prefix="/api", tags=["System"])


@router.get("/health", summary="Health & Model Status Check")
def get_health():
    """
    Returns API health, version, loaded model statuses, and data provenance.
    """
    all_ok = registry.is_loaded
    return {
        "status": "ok" if all_ok else "degraded",
        "service": settings.SERVICE_NAME,
        "version": settings.API_VERSION,
        "model_status": registry.status_dict,
        "data_status": settings.DATA_STATUS,
        "environment": settings.APP_ENV,
    }
