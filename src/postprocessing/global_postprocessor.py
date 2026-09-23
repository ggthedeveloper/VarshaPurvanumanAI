"""
Global ML Post-Processor for SIH26080 (Baseline B).
Trains a single global machine learning regression model to correct NWP rainfall forecasts.
Guarantees zero regime-awareness (no regime labels/predictions) and non-negative rainfall outputs.
"""
import os
import json
import pickle
import platform
from typing import Dict, Any, Optional, List, Union
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
import sklearn

from src.metrics.evaluator import ForecastEvaluator


class GlobalPostProcessor:
    """
    Global regression model for NWP bias correction without regime information.
    Predicts corrected precipitation in mm/day.
    """

    FORBIDDEN_COLUMNS = [
        "regime", "sub_regime", "label_status", "label_method",
        "source_event_id", "observed_rainfall", "target"
    ]

    def __init__(
        self,
        model_type: str = "random_forest",
        random_state: int = 42,
        **model_kwargs
    ):
        self.model_type = model_type.lower()
        self.random_state = random_state
        self.model_kwargs = model_kwargs
        self.feature_names_: List[str] = []
        self.is_fitted: bool = False
        self.estimator = self._init_estimator()

    def _init_estimator(self):
        """Initializes the underlying scikit-learn regressor."""
        if self.model_type == "random_forest":
            n_estimators = self.model_kwargs.get("n_estimators", 100)
            max_depth = self.model_kwargs.get("max_depth", 5)
            min_samples_leaf = self.model_kwargs.get("min_samples_leaf", 3)
            return RandomForestRegressor(
                n_estimators=n_estimators,
                max_depth=max_depth,
                min_samples_leaf=min_samples_leaf,
                random_state=self.random_state
            )
        elif self.model_type == "gradient_boosting":
            n_estimators = self.model_kwargs.get("n_estimators", 50)
            max_depth = self.model_kwargs.get("max_depth", 3)
            lr = self.model_kwargs.get("learning_rate", 0.05)
            loss = self.model_kwargs.get("loss", "squared_error")
            return GradientBoostingRegressor(
                n_estimators=n_estimators,
                max_depth=max_depth,
                learning_rate=lr,
                loss=loss,
                random_state=self.random_state
            )
        elif self.model_type == "ridge":
            alpha = self.model_kwargs.get("alpha", 10.0)
            return Ridge(alpha=alpha, random_state=self.random_state)
        else:
            raise ValueError(
                f"Unknown model_type '{self.model_type}'. Choose from 'random_forest', 'gradient_boosting', 'ridge'."
            )

    def _validate_features(self, X: pd.DataFrame):
        """Enforces that no regime-aware features or target variables enter the global model."""
        cols = [c.lower() for c in X.columns]
        for forbidden in self.FORBIDDEN_COLUMNS:
            if forbidden in cols:
                raise ValueError(
                    f"CRITICAL LEAKAGE DETECTED: Forbidden column '{forbidden}' found in GlobalPostProcessor feature set."
                )

    def fit(self, X: pd.DataFrame, y: Union[pd.Series, np.ndarray]) -> "GlobalPostProcessor":
        """
        Fits the global model strictly on training features and observed rainfall.

        Parameters:
        -----------
        X : pd.DataFrame
            NWP and meteorological feature matrix.
        y : array-like
            Ground-truth observed rainfall (mm/day).
        """
        if X.empty:
            raise ValueError("Feature matrix X cannot be empty.")
        if len(y) != len(X):
            raise ValueError(f"Length mismatch: X has {len(X)} rows, y has {len(y)} rows.")

        self._validate_features(X)
        self.feature_names_ = list(X.columns)

        y_clean = np.asarray(y, dtype=float).ravel()
        self.estimator.fit(X, y_clean)
        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Predicts bias-corrected rainfall. Enforces physical non-negativity constraint.
        """
        if not self.is_fitted:
            raise RuntimeError("GlobalPostProcessor must be fitted before predict() can be called.")
        self._validate_features(X)

        raw_preds = self.estimator.predict(X)
        # Enforce physically grounded non-negative rainfall constraint
        return np.maximum(0.0, raw_preds)

    def evaluate(
        self,
        X: pd.DataFrame,
        y: Union[pd.Series, np.ndarray],
        thresholds: Optional[List[float]] = None,
        regimes: Optional[Union[np.ndarray, pd.Series]] = None
    ) -> Dict[str, Any]:
        """
        Runs comprehensive evaluation against ground-truth observations.
        """
        preds = self.predict(X)
        return ForecastEvaluator.evaluate(y_true=y, y_pred=preds, thresholds=thresholds, regimes=regimes)

    def save(
        self,
        model_path: str = "models/global_postprocessor.pkl",
        metadata_path: str = "models/global_postprocessor_metadata.json",
        extra_metadata: Optional[Dict[str, Any]] = None
    ):
        """Saves model weights and complete audit metadata."""
        if not self.is_fitted:
            raise RuntimeError("Cannot save unfitted post-processor.")
        os.makedirs(os.path.dirname(model_path), exist_ok=True)

        with open(model_path, "wb") as f:
            pickle.dump(self.estimator, f)

        meta = {
            "algorithm": type(self.estimator).__name__,
            "model_type": self.model_type,
            "random_state": self.random_state,
            "feature_count": len(self.feature_names_),
            "features": self.feature_names_,
            "is_fitted": self.is_fitted,
            "hyperparameters": self.model_kwargs,
            "software_versions": {
                "scikit_learn": sklearn.__version__,
                "numpy": np.__version__,
                "pandas": pd.__version__,
                "python": platform.python_version()
            }
        }
        if extra_metadata:
            meta.update(extra_metadata)

        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)

    @classmethod
    def load(
        cls,
        model_path: str = "models/global_postprocessor.pkl",
        metadata_path: str = "models/global_postprocessor_metadata.json"
    ) -> "GlobalPostProcessor":
        """Loads a persisted model from disk."""
        with open(metadata_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

        inst = cls(
            model_type=meta["model_type"],
            random_state=meta["random_state"],
            **meta.get("hyperparameters", {})
        )
        with open(model_path, "rb") as f:
            inst.estimator = pickle.load(f)

        inst.feature_names_ = meta["features"]
        inst.is_fitted = True
        return inst
