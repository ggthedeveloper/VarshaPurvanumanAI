"""
Comprehensive Verification Engine Package for SIH26080.
Consolidates deterministic, probabilistic, regime-wise, and spatial
verification across Raw NWP, Global ML, Regime-Aware ML, and Probability models.
"""
from .engine import VerificationEngine

__all__ = ["VerificationEngine"]
