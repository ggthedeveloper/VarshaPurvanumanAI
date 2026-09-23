"""
Verification reporting route handlers for VarshaPurvanumanAI Backend.
Provides read-only access to official Phase 8 verified scientific metrics.
"""
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.verification import (
    VerificationSummaryResponse,
    VerificationThresholdsResponse,
    VerificationRegimesResponse,
    VerificationProbabilityResponse,
)
from backend.app.services.verification_service import VerificationService

router = APIRouter(prefix="/api/verification", tags=["Scientific Verification"])


@router.get("/summary", response_model=VerificationSummaryResponse, summary="Consolidated Verification Summary")
def get_verification_summary():
    """
    Returns official continuous, categorical, bootstrap uncertainty, and FSS status metrics.
    FSS is explicitly declared as NOT_COMPUTABLE for point-based observations.
    """
    try:
        return VerificationService.get_summary()
    except FileNotFoundError as fe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(fe))


@router.get("/thresholds", response_model=VerificationThresholdsResponse, summary="Threshold-by-Threshold Verification")
def get_threshold_verification():
    """
    Returns complete 2x2 contingency tables, CSI, POD, FAR, and ETS across all thresholds.
    """
    try:
        return VerificationService.get_thresholds()
    except FileNotFoundError as fe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(fe))


@router.get("/regimes", response_model=VerificationRegimesResponse, summary="Regime-Wise Verification Breakdown")
def get_regime_verification():
    """
    Returns verified performance metrics stratified by synoptic weather regime.
    """
    try:
        return VerificationService.get_regimes()
    except FileNotFoundError as fe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(fe))


@router.get("/probability", response_model=VerificationProbabilityResponse, summary="Calibrated Exceedance Probability Verification")
def get_probability_verification():
    """
    Returns Brier scores, Murphy decompositions, ROC-AUC, PR-AUC, and calibration error metrics.
    """
    try:
        return VerificationService.get_probability()
    except FileNotFoundError as fe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(fe))
