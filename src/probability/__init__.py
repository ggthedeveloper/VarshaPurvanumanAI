"""
Probabilistic Rainfall Exceedance Post-Processing Package for SIH26080.
Provides Global and Regime-Aware calibrated probability of exceedance models
for operational and experimental rainfall thresholds.
"""
from .exceedance_model import (
    VERIFIED_THRESHOLDS,
    GlobalExceedanceModel,
    RegimeAwareExceedanceModel,
    ExceedanceModelSuite,
)

__all__ = [
    "VERIFIED_THRESHOLDS",
    "GlobalExceedanceModel",
    "RegimeAwareExceedanceModel",
    "ExceedanceModelSuite",
]
