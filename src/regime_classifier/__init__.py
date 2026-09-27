"""
Weather Regime Classification Package for SIH26080.
Provides scientifically defensible regime labeling, provenance tracking,
and machine learning classification interfaces.
"""
from src.regime_classifier.label_generator import RegimeLabelGenerator
from src.regime_classifier.classifier import RegimeClassifier
from src.regime_classifier.hierarchical import (
    HierarchicalRegimeClassifier,
    HierarchicalRegimeResult,
    ALL_8_REGIMES,
    REGIME_ACTIVE_MONSOON,
    REGIME_BREAK_MONSOON,
    REGIME_MONSOON_LOW,
    REGIME_DEPRESSION,
    REGIME_COASTAL_RAINFALL,
    REGIME_OROGRAPHIC_RAINFALL,
    REGIME_WESTERN_DISTURBANCE,
    REGIME_OTHER,
)

__all__ = [
    "RegimeLabelGenerator",
    "RegimeClassifier",
    "HierarchicalRegimeClassifier",
    "HierarchicalRegimeResult",
    "ALL_8_REGIMES",
    "REGIME_ACTIVE_MONSOON",
    "REGIME_BREAK_MONSOON",
    "REGIME_MONSOON_LOW",
    "REGIME_DEPRESSION",
    "REGIME_COASTAL_RAINFALL",
    "REGIME_OROGRAPHIC_RAINFALL",
    "REGIME_WESTERN_DISTURBANCE",
    "REGIME_OTHER",
]
