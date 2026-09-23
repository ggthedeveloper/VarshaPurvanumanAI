"""
Singleton Model Loader for VarshaPurvanumanAI Backend.
Loads trained models once at application startup and caches them in memory.
"""
import os
import json
import pickle
from typing import Optional, Dict, Any

from backend.app.config import settings
from backend.app.utils.logger import logger
from src.postprocessing.regime_aware_postprocessor import RegimeAwarePostProcessor


class ModelRegistry:
    """
    In-memory registry holding references to pre-trained, immutable model artifacts.
    """

    def __init__(self):
        self.regime_classifier: Optional[Any] = None
        self.global_postprocessor: Optional[Any] = None
        self.regime_postprocessor: Optional[RegimeAwarePostProcessor] = None
        self.probability_suite: Optional[Any] = None
        self.feature_provenance: Optional[Dict[str, Any]] = None

        self.is_loaded: bool = False
        self.status_dict: Dict[str, str] = {
            "regime_classifier": "uninitialized",
            "global_postprocessor": "uninitialized",
            "regime_postprocessor": "uninitialized",
            "probability_suite": "uninitialized",
            "feature_provenance": "uninitialized",
        }

    def load_all_models(self):
        """Loads all verified models from disk into memory."""
        logger.info("Initializing ModelRegistry: loading verified model artifacts...")

        # 1. Feature Provenance
        try:
            if os.path.exists(settings.PROVENANCE_PATH):
                with open(settings.PROVENANCE_PATH, "r") as f:
                    self.feature_provenance = json.load(f)
                self.status_dict["feature_provenance"] = "loaded"
            else:
                self.status_dict["feature_provenance"] = "missing_file"
                logger.warning(f"Provenance file not found at {settings.PROVENANCE_PATH}")
        except Exception as e:
            self.status_dict["feature_provenance"] = f"error: {str(e)}"
            logger.error(f"Failed loading feature provenance: {e}")

        # 2. Phase 4 Regime Classifier
        try:
            if os.path.exists(settings.REGIME_CLASSIFIER_PATH):
                with open(settings.REGIME_CLASSIFIER_PATH, "rb") as f:
                    self.regime_classifier = pickle.load(f)
                self.status_dict["regime_classifier"] = "loaded"
                logger.info(f"Loaded Regime Classifier (classes: {list(self.regime_classifier.classes_)})")
            else:
                self.status_dict["regime_classifier"] = "missing_artifact"
                logger.error(f"Regime classifier artifact missing at {settings.REGIME_CLASSIFIER_PATH}")
        except Exception as e:
            self.status_dict["regime_classifier"] = f"error: {str(e)}"
            logger.error(f"Failed to load regime classifier: {e}")

        # 3. Phase 5 Global Post-Processor
        try:
            if os.path.exists(settings.GLOBAL_POSTPROCESSOR_PATH):
                with open(settings.GLOBAL_POSTPROCESSOR_PATH, "rb") as f:
                    self.global_postprocessor = pickle.load(f)
                self.status_dict["global_postprocessor"] = "loaded"
                logger.info("Loaded Global Post-Processor (RandomForestRegressor)")
            else:
                self.status_dict["global_postprocessor"] = "missing_artifact"
                logger.error(f"Global postprocessor artifact missing at {settings.GLOBAL_POSTPROCESSOR_PATH}")
        except Exception as e:
            self.status_dict["global_postprocessor"] = f"error: {str(e)}"
            logger.error(f"Failed to load global postprocessor: {e}")

        # 4. Phase 6 Regime-Aware Post-Processor
        try:
            if os.path.exists(settings.REGIME_POSTPROCESSORS_DIR):
                self.regime_postprocessor = RegimeAwarePostProcessor.load(
                    models_dir=settings.REGIME_POSTPROCESSORS_DIR,
                    metadata_path=settings.REGIME_POSTPROCESSOR_META,
                    classifier=self.regime_classifier,
                )
                self.status_dict["regime_postprocessor"] = "loaded"
                logger.info(f"Loaded Regime-Aware Post-Processor (models: {list(self.regime_postprocessor.regime_models_.keys())})")
            else:
                self.status_dict["regime_postprocessor"] = "missing_artifact_dir"
                logger.error(f"Regime postprocessors dir missing at {settings.REGIME_POSTPROCESSORS_DIR}")
        except Exception as e:
            self.status_dict["regime_postprocessor"] = f"error: {str(e)}"
            logger.error(f"Failed to load regime-aware postprocessor: {e}")

        # 5. Phase 7 Probability of Exceedance Suite
        try:
            if os.path.exists(settings.PROBABILITY_SUITE_PATH):
                with open(settings.PROBABILITY_SUITE_PATH, "rb") as f:
                    self.probability_suite = pickle.load(f)
                self.status_dict["probability_suite"] = "loaded"
                logger.info(f"Loaded Probability Suite (thresholds: {self.probability_suite.thresholds})")
            else:
                self.status_dict["probability_suite"] = "missing_artifact"
                logger.error(f"Probability suite artifact missing at {settings.PROBABILITY_SUITE_PATH}")
        except Exception as e:
            self.status_dict["probability_suite"] = f"error: {str(e)}"
            logger.error(f"Failed to load probability suite: {e}")

        self.is_loaded = all(v == "loaded" for v in self.status_dict.values())
        logger.info(f"ModelRegistry initialized. Overall loaded status: {self.is_loaded}")
        return self


registry = ModelRegistry()
