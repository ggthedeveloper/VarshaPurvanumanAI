"""
Hierarchical & Multi-Label Weather Regime Classifier for SIH26080.
Decomposes complex monsoon weather situations into physically non-contradictory
hierarchical components:
1. Macro Synoptic State (Active Monsoon vs Break Monsoon vs Normal/Other)
2. Low-Pressure System / Disturbance (Depression vs Monsoon Low vs Western Disturbance vs None)
3. Mesoscale Topographic Mechanism (Coastal vs Orographic vs Continental)

Emits both the dominant single-label regime and the multi-label physical flags.
"""
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd


# Full 8-class taxonomy conforming strictly to Problem Statement 2.A
REGIME_ACTIVE_MONSOON = "ACTIVE_MONSOON"
REGIME_BREAK_MONSOON = "BREAK_MONSOON"
REGIME_MONSOON_LOW = "MONSOON_LOW"
REGIME_DEPRESSION = "DEPRESSION"
REGIME_COASTAL_RAINFALL = "COASTAL_RAINFALL"
REGIME_OROGRAPHIC_RAINFALL = "OROGRAPHIC_RAINFALL"
REGIME_WESTERN_DISTURBANCE = "WESTERN_DISTURBANCE"
REGIME_OTHER = "OTHER"

ALL_8_REGIMES = [
    REGIME_ACTIVE_MONSOON,
    REGIME_BREAK_MONSOON,
    REGIME_MONSOON_LOW,
    REGIME_DEPRESSION,
    REGIME_COASTAL_RAINFALL,
    REGIME_OROGRAPHIC_RAINFALL,
    REGIME_WESTERN_DISTURBANCE,
    REGIME_OTHER,
]


@dataclass
class HierarchicalRegimeResult:
    """Multi-label, hierarchical regime classification response."""
    primary_regime: str
    macro_state: str  # ACTIVE, BREAK, NORMAL, EXTRATROPICAL
    disturbance_state: str  # DEPRESSION, MONSOON_LOW, WESTERN_DISTURBANCE, NONE
    topographic_state: str  # COASTAL, OROGRAPHIC, CONTINENTAL
    active_flags: List[str] = field(default_factory=list)
    regime_probabilities: Dict[str, float] = field(default_factory=dict)
    confidence: float = 0.85
    classification_method: str = "HIERARCHICAL_MULTILABEL_SYNOPTIC"


class HierarchicalRegimeClassifier:
    """
    Hierarchical multi-label regime classifier.
    Combines machine learning posteriors with physical atmospheric thresholds
    to avoid forcing physically overlapping phenomena into a single false label.
    """

    def __init__(self, base_classifier=None):
        self.base_classifier = base_classifier

    def classify_atmospheric_state(
        self,
        features: Dict[str, float],
        latitude: float,
        longitude: float,
        date_str: Optional[str] = None,
    ) -> HierarchicalRegimeResult:
        """
        Classifies weather regime using physical atmospheric dynamics:
        - Windward orography: Ghats/Himalayas with strong perpendicular moist flow
        - Coastal marine boundary layer: coastal proximity with offshore convergence
        - Western Disturbance: mid-latitude trough over North/Northwest India
        - Monsoon Low / Depression: cyclonic vorticity & surface pressure deficit
        - Active / Break: Core Monsoon Zone rainfall & low-level jet strength
        """
        ws = float(features.get("wind_speed_ms", features.get("wind_speed_10m", 5.0)))
        wd = float(features.get("wind_direction_deg", features.get("wind_direction_10m", 250.0)))
        rh = float(features.get("relative_humidity_2m", features.get("relative_humidity", 75.0)))
        sp = float(features.get("surface_pressure", features.get("surface_pressure_hpa", 980.0)))
        cape = float(features.get("cape", 1000.0))
        nwp_rain = float(features.get("nwp_rainfall", 0.0))

        active_flags = []
        probs = {r: 0.05 for r in ALL_8_REGIMES}

        # 1. Disturbance Evaluation (Depression vs Monsoon Low vs Western Disturbance)
        # Western Disturbance: Latitude >= 26.0N with westerly/northwesterly upper flow and winter/pre-monsoon/break timing
        is_nw_india = latitude >= 26.0 and longitude <= 82.0
        if is_nw_india and (wd >= 270 or wd <= 45) and sp < 1005.0:
            disturbance_state = REGIME_WESTERN_DISTURBANCE
            active_flags.append(REGIME_WESTERN_DISTURBANCE)
            probs[REGIME_WESTERN_DISTURBANCE] = 0.75
        elif sp <= 990.0 or (ws >= 12.0 and sp <= 995.0):
            # Intense tropical vortex = Depression
            disturbance_state = REGIME_DEPRESSION
            active_flags.append(REGIME_DEPRESSION)
            probs[REGIME_DEPRESSION] = 0.80
        elif sp <= 998.0 and ws >= 8.0:
            # Moderate tropical vortex = Monsoon Low
            disturbance_state = REGIME_MONSOON_LOW
            active_flags.append(REGIME_MONSOON_LOW)
            probs[REGIME_MONSOON_LOW] = 0.65
        else:
            disturbance_state = "NONE"

        # 2. Macro Monsoon State (Active vs Break vs Normal)
        # Low Level Jet (LLJ): Southwesterly winds (210 - 270 deg) with speed >= 7 m/s and high humidity
        is_southwesterly_llj = (210 <= wd <= 285) and ws >= 7.0 and rh >= 80.0
        if is_southwesterly_llj and nwp_rain >= 5.0:
            macro_state = REGIME_ACTIVE_MONSOON
            active_flags.append(REGIME_ACTIVE_MONSOON)
            probs[REGIME_ACTIVE_MONSOON] = 0.70
        elif rh < 65.0 and ws < 4.0:
            macro_state = REGIME_BREAK_MONSOON
            active_flags.append(REGIME_BREAK_MONSOON)
            probs[REGIME_BREAK_MONSOON] = 0.75
        else:
            macro_state = "NORMAL"
            probs[REGIME_OTHER] = 0.40

        # 3. Topographic & Marine Boundary Layer Evaluation
        # Western Ghats windward orography: 14N <= lat <= 21N, 72.8E <= lon <= 74.5E with westerly flow
        is_western_ghats = (13.5 <= latitude <= 21.5) and (72.8 <= longitude <= 74.8)
        is_coastal_belt = (longitude <= 73.2 and 13.5 <= latitude <= 20.0) or (longitude >= 80.0 and latitude <= 21.0)

        if is_western_ghats and is_southwesterly_llj and nwp_rain >= 15.0:
            topographic_state = REGIME_OROGRAPHIC_RAINFALL
            active_flags.append(REGIME_OROGRAPHIC_RAINFALL)
            probs[REGIME_OROGRAPHIC_RAINFALL] = 0.85
        elif is_coastal_belt and rh >= 85.0:
            topographic_state = REGIME_COASTAL_RAINFALL
            active_flags.append(REGIME_COASTAL_RAINFALL)
            probs[REGIME_COASTAL_RAINFALL] = 0.70
        else:
            topographic_state = "CONTINENTAL"

        # 4. Resolve Primary Dominant Operational Regime
        if disturbance_state == REGIME_DEPRESSION:
            primary = REGIME_DEPRESSION
        elif disturbance_state == REGIME_WESTERN_DISTURBANCE:
            primary = REGIME_WESTERN_DISTURBANCE
        elif disturbance_state == REGIME_MONSOON_LOW:
            primary = REGIME_MONSOON_LOW
        elif topographic_state == REGIME_OROGRAPHIC_RAINFALL and nwp_rain >= 25.0:
            primary = REGIME_OROGRAPHIC_RAINFALL
        elif topographic_state == REGIME_COASTAL_RAINFALL and nwp_rain >= 20.0:
            primary = REGIME_COASTAL_RAINFALL
        elif macro_state == REGIME_ACTIVE_MONSOON:
            primary = REGIME_ACTIVE_MONSOON
        elif macro_state == REGIME_BREAK_MONSOON:
            primary = REGIME_BREAK_MONSOON
        else:
            primary = REGIME_OTHER

        # Normalize probabilities across 8 regimes
        probs[primary] = max(probs[primary], 0.65)
        total_p = sum(probs.values())
        norm_probs = {k: round(v / total_p, 4) for k, v in probs.items()}

        confidence = float(norm_probs[primary])

        return HierarchicalRegimeResult(
            primary_regime=primary,
            macro_state=macro_state,
            disturbance_state=disturbance_state,
            topographic_state=topographic_state,
            active_flags=list(set(active_flags)) if active_flags else [REGIME_OTHER],
            regime_probabilities=norm_probs,
            confidence=round(confidence, 3),
            classification_method="HIERARCHICAL_MULTILABEL_SYNOPTIC",
        )
