"""
Gridded Rainfall route handlers for VarshaPurvanumanAI Backend.
Provides multi-layer 2D spatial rainfall fields (raw NWP, ML bias-corrected,
observed IMD, and bias fields) across the Western Ghats 0.25° mesoscale grid.
"""
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status
from backend.app.schemas.verification import GriddedRainfallResponse
from src.verification.gridded_verification import GriddedVerificationRunner

router = APIRouter(prefix="/api/grid", tags=["Gridded Rainfall Products"])

_runner: Optional[GriddedVerificationRunner] = None


def get_runner() -> GriddedVerificationRunner:
    global _runner
    if _runner is None:
        _runner = GriddedVerificationRunner()
    return _runner


@router.get("/rainfall", response_model=GriddedRainfallResponse, summary="2D Gridded Rainfall Multi-Layer Product")
def get_gridded_rainfall(
    date: Optional[str] = Query(
        default=None,
        description="Forecast/observation date (YYYY-MM-DD or YYYYMMDD). Defaults to active monsoon spell 2024-06-07."
    )
):
    """
    Returns 2D gridded rainfall fields for map visualization:
    - Raw NWP rainfall (NOAA GFS 0.25°)
    - Bias-corrected rainfall (Regime-Aware ML post-processor)
    - IMD observed rainfall (0.25° Zenodo ground-truth grid)
    - Difference maps: raw bias (NWP - Obs) and corrected bias (ML - Obs)
    """
    try:
        runner = get_runner()
        grid_data = runner.get_gridded_rainfall_map(target_date=date)
        return GriddedRainfallResponse(**grid_data)
    except FileNotFoundError as fe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Gridded dataset not found on disk: {str(fe)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating gridded rainfall product: {str(e)}"
        )
