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


class GriddedFSSScaleItem(BaseModel):
    window_size: int = Field(description="Odd dimension of neighborhood kernel window (e.g. 1, 3, 5).")
    window_km: float = Field(description="Spatial neighborhood physical scale in km.")
    fss_raw: float = Field(description="Raw NWP Fractions Skill Score.")
    fss_corrected: float = Field(description="Bias-corrected ML Fractions Skill Score.")
    fss_random: float = Field(description="FSS random no-skill baseline (equal to observed base rate fo).")
    fss_useful: float = Field(description="Target useful skill threshold: 0.5 + fo / 2.")
    skill_assessment: str = Field(description="'SKILLFUL', 'MARGINAL', or 'NO_SKILL'.")


class GriddedThresholdFSS(BaseModel):
    threshold_mm: float
    threshold_name: str
    category: str
    observed_fraction: float
    fss_random: float
    fss_useful: float
    scales: List[GriddedFSSScaleItem]


class GriddedVerificationResponse(BaseModel):
    """
    2D Fractions Skill Score (FSS) and continuous spatial verification response.
    """
    domain_name: str
    domain_bbox: Dict[str, float]
    grid_shape: List[int]
    resolution_deg: float
    grid_cell_km: float
    dates_evaluated: int
    evaluation_period: str
    fss_status: str = Field(default="COMPUTED_GRIDDED")
    spatial_continuous_metrics: Dict[str, Dict[str, float]]
    fss_by_threshold: Dict[str, GriddedThresholdFSS]
    data_provenance: str
    data_status: str = Field(default="REAL_DATA")


class GriddedRainfallResponse(BaseModel):
    """
    Multi-layer 2D spatial rainfall fields for GIS / web map rendering.
    """
    date: str
    domain_name: str
    grid_shape: List[int]
    latitudes: List[float]
    longitudes: List[float]
    raw_nwp_grid: List[List[float]]
    corrected_grid: List[List[float]]
    observed_grid: List[List[float]]
    bias_raw_grid: List[List[float]]
    bias_corrected_grid: List[List[float]]
    summary_stats: Dict[str, float]
    units: str = Field(default="mm/day")
    data_status: str = Field(default="REAL_DATA")

