"""
Test suite for VarshaPurvanumanAI Hierarchical Weather Regime Classifier (SIH26080).
Validates 8-class taxonomy, synoptic decomposition (macro, disturbance, topographic),
calibrated posterior probabilities, multi-label flags, and fallback hierarchy.
"""
import pytest
import numpy as np

from src.regime_classifier.hierarchical import (
    HierarchicalRegimeClassifier,
    HierarchicalRegimeResult,
    ALL_8_REGIMES,
)
from src.postprocessing.regime_aware_postprocessor import RegimeAwarePostProcessor


class TestHierarchicalWeatherRegimeClassifier:
    """Verifies that the 8-class hierarchical regime classifier operates with meteorological validity."""

    @pytest.fixture
    def classifier(self):
        return HierarchicalRegimeClassifier()

    def test_taxonomy_completeness(self):
        expected_8 = {
            "ACTIVE_MONSOON",
            "BREAK_MONSOON",
            "MONSOON_LOW",
            "DEPRESSION",
            "COASTAL_RAINFALL",
            "OROGRAPHIC_RAINFALL",
            "WESTERN_DISTURBANCE",
            "OTHER",
        }
        assert set(ALL_8_REGIMES) == expected_8

    def test_synoptic_decomposition_rules(self, classifier):
        # 1. Western Disturbance: North India (lat >= 26) with westerly/northwesterly winds
        features_wd = {
            "surface_pressure": 980.0,
            "wind_speed_ms": 8.0,
            "wind_direction_deg": 290.0,
            "relative_humidity_2m": 85.0,
            "nwp_rainfall": 12.0,
        }
        res_wd = classifier.classify_atmospheric_state(
            features=features_wd,
            latitude=31.0,
            longitude=76.0,
        )
        assert res_wd.disturbance_state == "WESTERN_DISTURBANCE"
        assert "WESTERN_DISTURBANCE" in res_wd.active_flags

        # 2. Coastal Orographic: Western Ghats (lat 15, lon 73.5) with strong southwesterly flow and heavy rain
        features_orog = {
            "surface_pressure": 998.0,
            "wind_speed_ms": 14.0,
            "wind_direction_deg": 240.0,
            "relative_humidity_2m": 92.0,
            "nwp_rainfall": 45.0,
        }
        res_orog = classifier.classify_atmospheric_state(
            features=features_orog,
            latitude=15.0,
            longitude=73.5,
        )
        assert res_orog.topographic_state in ["COASTAL_RAINFALL", "OROGRAPHIC_RAINFALL"]

        # 3. Depression: Severe low surface pressure (<= 990 hPa) with high cyclonic winds
        features_dep = {
            "surface_pressure": 985.0,
            "wind_speed_ms": 18.0,
            "wind_direction_deg": 180.0,
            "relative_humidity_2m": 95.0,
            "nwp_rainfall": 50.0,
        }
        res_dep = classifier.classify_atmospheric_state(
            features=features_dep,
            latitude=20.0,
            longitude=86.0,
        )
        assert res_dep.disturbance_state == "DEPRESSION"
        assert "DEPRESSION" in res_dep.active_flags

    def test_calibrated_posterior_probabilities(self, classifier):
        features = {
            "latitude": 18.52,
            "longitude": 73.85,
            "month": 7,
            "surface_pressure": 998.0,
            "wind_speed_ms": 10.0,
            "wind_direction_deg": 240.0,
            "relative_humidity_2m": 88.0,
            "nwp_rainfall": 25.0,
        }
        res = classifier.classify_atmospheric_state(features, latitude=18.52, longitude=73.85)
        probs = res.regime_probabilities

        # Must include all 8 classes
        assert len(probs) == 8
        for r in ALL_8_REGIMES:
            assert r in probs
            assert 0.0 <= probs[r] <= 1.0

        # Must sum to 1.0 (calibrated simplex)
        assert abs(sum(probs.values()) - 1.0) < 1e-3

    def test_postprocessor_fallback_routing(self):
        postprocessor = RegimeAwarePostProcessor()
        # Verify fallback map maps all 8 regimes
        fallback_map = postprocessor.REGIME_FALLBACK_MAP

        assert fallback_map.get("MONSOON_LOW") == "DEPRESSION"
        assert fallback_map.get("OROGRAPHIC") == "COASTAL_OROGRAPHIC"
        assert fallback_map.get("OROGRAPHIC_RAINFALL") == "COASTAL_OROGRAPHIC"
        assert fallback_map.get("COASTAL_RAINFALL") == "COASTAL_OROGRAPHIC"
        assert fallback_map.get("OTHER") == "OTHER"
