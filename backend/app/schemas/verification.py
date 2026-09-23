"""
Pydantic schemas for Scientific Verification API endpoints.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class FSSStatusItem(BaseModel):
    metric: str = Field(default="FSS")
    status: str = Field(default="NOT_COMPUTABLE")
    reason: str = Field(default="Current evaluation data is point-based and lacks the required 2-D spatial forecast/observation grid.")


class VerificationSummaryResponse(BaseModel):
    """
    Consolidated scientific verification summary.
    """
    test_period: str
    test_sample_count: int
    continuous_metrics: Dict[str, Dict[str, Any]]
    categorical_metrics: Dict[str, Dict[str, Any]]
    uncertainty_intervals_95: Dict[str, Dict[str, Any]]
    fss: FSSStatusItem
    scientific_conclusion: str
    data_status: str = Field(default="REAL_DATA")


class VerificationThresholdsResponse(BaseModel):
    """
    Threshold-by-threshold contingency tables and scores.
    """
    thresholds: Dict[str, Dict[str, Any]]
    data_status: str = Field(default="REAL_DATA")


class VerificationRegimesResponse(BaseModel):
    """
    Regime-wise performance breakdown.
    """
    regimes: Dict[str, Dict[str, Any]]
    data_status: str = Field(default="REAL_DATA")


class VerificationProbabilityResponse(BaseModel):
    """
    Calibrated probability evaluation metrics.
    """
    global_model: Dict[str, Any]
    regime_aware_model: Dict[str, Any]
    data_status: str = Field(default="REAL_DATA")
