"""
Regime-Aware AI Post-Processor for SIH26080.
Core Innovation: Conditions rainfall bias-correction on the detected synoptic weather regime.
Routes forecast instances through dedicated regime-specific post-processing models
with transparent fallback and strict non-negative physical bounds.
"""
import os
import json
import pickle
import platform
from typing import Dict, Any, Optional, List, Tuple, Union
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
import sklearn

from src.metrics.evaluator import ForecastEvaluator
from src.regime_classifier.classifier import RegimeClassifier
from src.postprocessing.global_postprocessor import GlobalPostProcessor


class RegimeAwarePostProcessor:
    """
    Hierarchical Regime-Aware Post-Processing Architecture:
    NWP Features -> Phase 4 Regime Classifier -> Predicted Regime -> Dedicated Regime Regressor -> Non-Negative Rainfall.
    """

    MIN_SAMPLES_FOR_DEDICATED = 15

    def __init__(
        self,
        classifier: Optional[RegimeClassifier] = None,
        min_samples: int = MIN_SAMPLES_FOR_DEDICATED,
        model_family: str = "random_forest",
        random_state: int = 42,
        routing_mode: str = "hard"
    ):
        """
        Parameters:
        -----------
        classifier : RegimeClassifier, optional
            Pre-trained Phase 4 regime classifier.
        min_samples : int
            Minimum real training samples required to instantiate a dedicated model.
        model_family : str
            Regime regression model family ('random_forest' or 'ridge').
        random_state : int
            Deterministic reproducibility seed.
        routing_mode : str
            'hard' (discrete routing by predicted class) or 'soft' (posterior probability weighting).
        """
        self.classifier = classifier
        self.min_samples = min_samples
        self.model_family = model_family.lower()
        self.random_state = random_state
        self.routing_mode = routing_mode.lower()

        self.regime_models_: Dict[str, Any] = {}
        self.fallback_model_: Optional[GlobalPostProcessor] = None
        self.model_provenance_: Dict[str, dict] = {}
        self.is_fitted: bool = False
        self.classes_: List[str] = []

    def fit(
        self,
        X_train: pd.DataFrame,
        y_train: Union[pd.Series, np.ndarray],
        regimes_train: Union[pd.Series, np.ndarray]
    ) -> "RegimeAwarePostProcessor":
        """
        Fits dedicated regime models on real training samples for each regime.
        Also trains a global fallback model across all training samples.
        """
        if X_train.empty:
            raise ValueError("Training feature matrix X_train cannot be empty.")
        if len(y_train) != len(X_train) or len(regimes_train) != len(X_train):
            raise ValueError("Length mismatch between features, targets, and regime labels.")

        y_tr = np.asarray(y_train, dtype=float).ravel()
        reg_series = pd.Series(regimes_train).values
        self.classes_ = sorted(list(set(reg_series)))

        # 1. Train Global Fallback Model (trained across all samples without regimes)
        print("Training Global Fallback Regressor...")
        self.fallback_model_ = GlobalPostProcessor(
            model_type=self.model_family,
            random_state=self.random_state,
            n_estimators=100,
            max_depth=5,
            min_samples_leaf=3
        )
        self.fallback_model_.fit(X_train, y_tr)

        # 2. Train Regime-Specific Models
        for reg in self.classes_:
            mask = (reg_series == reg)
            n_samples = int(np.sum(mask))

            if n_samples >= self.min_samples:
                # Dedicated regime model
                if self.model_family == "random_forest":
                    # Adapt depth and leaf parameters to avoid P > N overfitting on moderate subsets
                    depth = 3 if n_samples < 40 else 5
                    leaf = 2 if n_samples < 40 else 3
                    m = RandomForestRegressor(
                        n_estimators=100,
                        max_depth=depth,
                        min_samples_leaf=leaf,
                        random_state=self.random_state
                    )
                elif self.model_family == "ridge":
                    m = Ridge(alpha=20.0, random_state=self.random_state)
                else:
                    raise ValueError(f"Unsupported model family: {self.model_family}")

                X_sub = X_train[mask]
                y_sub = y_tr[mask]
                m.fit(X_sub, y_sub)
                self.regime_models_[reg] = m
                self.model_provenance_[reg] = {
                    "regime": reg,
                    "model_type": "dedicated",
                    "algorithm": type(m).__name__,
                    "training_samples": n_samples,
                    "fallback_applied": False,
                    "hyperparameters": m.get_params()
                }
                print(f"  [Dedicated Model] {reg:20s}: Trained on {n_samples} real samples.")
            else:
                # Fallback to global model
                self.regime_models_[reg] = self.fallback_model_.estimator
                self.model_provenance_[reg] = {
                    "regime": reg,
                    "model_type": "fallback_global",
                    "algorithm": type(self.fallback_model_.estimator).__name__,
                    "training_samples": n_samples,
                    "fallback_applied": True,
                    "reason": f"Sample count ({n_samples}) < threshold ({self.min_samples})"
                }
                print(f"  [Fallback Applied] {reg:20s}: Insufficient samples ({n_samples} < {self.min_samples}). Routed to Global ML.")

        self.is_fitted = True
        return self

    def predict(
        self,
        X: pd.DataFrame,
        routing: str = "operational",
        true_regimes: Optional[Union[pd.Series, np.ndarray]] = None,
        return_trace: bool = False
    ) -> Union[np.ndarray, Tuple[np.ndarray, pd.DataFrame]]:
        """
        Predicts bias-corrected rainfall.

        Parameters:
        -----------
        X : pd.DataFrame
            Predictor feature matrix.
        routing : str
            'operational' (default: uses trained classifier) or 'oracle' (uses true_regimes).
        true_regimes : array-like, optional
            Ground truth regimes required when routing='oracle'.
        return_trace : bool
            If True, returns a tuple (predictions, trace_dataframe) for auditing.
        """
        if not self.is_fitted:
            raise RuntimeError("RegimeAwarePostProcessor must be fitted before predict().")

        N = len(X)
        preds = np.zeros(N, dtype=float)
        trace_records = []

        if routing.lower() == "oracle":
            if true_regimes is None or len(true_regimes) != N:
                raise ValueError("true_regimes must be provided and match X length for oracle routing.")
            eval_regimes = pd.Series(true_regimes).values
            probs = np.zeros((N, len(self.classes_)))
        else:
            if self.classifier is None:
                raise RuntimeError("RegimeClassifier is required for operational routing.")
            eval_regimes = self.classifier.predict(X)
            probs = self.classifier.predict_proba(X)

        for i in range(N):
            x_row = X.iloc[[i]]
            assigned_reg = eval_regimes[i]

            if self.routing_mode == "soft" and routing.lower() == "operational":
                # Posterior probability-weighted blending: sum_r P(r|X) * y_r(X)
                blended = 0.0
                for c_idx, c_name in enumerate(self.classifier.classes_):
                    m = self.regime_models_.get(c_name, self.fallback_model_.estimator)
                    r_pred = float(m.predict(x_row)[0])
                    blended += probs[i, c_idx] * max(0.0, r_pred)
                pred_val = blended
                selected_model_desc = "Soft_Probability_Ensemble"
                max_prob = float(np.max(probs[i]))
            else:
                # Hard routing: route to dedicated model of the assigned regime
                m = self.regime_models_.get(assigned_reg, self.fallback_model_.estimator)
                raw_p = float(m.predict(x_row)[0])
                pred_val = max(0.0, raw_p)
                prov = self.model_provenance_.get(assigned_reg, {})
                selected_model_desc = f"{prov.get('model_type', 'dedicated')}_{assigned_reg}"
                max_prob = float(np.max(probs[i])) if routing.lower() == "operational" else 1.0

            preds[i] = pred_val

            if return_trace:
                trace_records.append({
                    "sample_idx": i,
                    "assigned_regime": assigned_reg,
                    "regime_probability": max_prob,
                    "selected_model": selected_model_desc,
                    "corrected_rainfall": pred_val
                })

        if return_trace:
            return preds, pd.DataFrame(trace_records)
        return preds

    def evaluate(
        self,
        X: pd.DataFrame,
        y: Union[pd.Series, np.ndarray],
        regimes: Optional[Union[np.ndarray, pd.Series]] = None,
        routing: str = "operational"
    ) -> Dict[str, Any]:
        """
        Evaluates predictions against ground truth observations.
        """
        preds = self.predict(X, routing=routing, true_regimes=regimes)
        return ForecastEvaluator.evaluate(y_true=y, y_pred=preds, regimes=regimes)

    def save(
        self,
        models_dir: str = "models/regime_postprocessors/",
        metadata_path: str = "models/regime_postprocessor_metadata.json",
        extra_metadata: Optional[Dict[str, Any]] = None
    ):
        """Saves individual regime models and system metadata."""
        if not self.is_fitted:
            raise RuntimeError("Cannot save unfitted post-processor.")
        os.makedirs(models_dir, exist_ok=True)

        # Save individual regime models
        for reg, m in self.regime_models_.items():
            fname = f"{reg.lower()}.pkl"
            with open(os.path.join(models_dir, fname), "wb") as f:
                pickle.dump(m, f)

        # Save fallback model
        if self.fallback_model_ is not None:
            with open(os.path.join(models_dir, "fallback_model.pkl"), "wb") as f:
                pickle.dump(self.fallback_model_.estimator, f)

        # Save metadata
        meta = {
            "system_name": "RegimeAwarePostProcessor",
            "model_family": self.model_family,
            "routing_mode": self.routing_mode,
            "random_state": self.random_state,
            "min_samples_threshold": self.min_samples,
            "classes": self.classes_,
            "regime_models": self.model_provenance_,
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
        models_dir: str = "models/regime_postprocessors/",
        metadata_path: str = "models/regime_postprocessor_metadata.json",
        classifier: Optional[RegimeClassifier] = None
    ) -> "RegimeAwarePostProcessor":
        """Loads a persisted regime-aware post-processing system from disk."""
        with open(metadata_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

        inst = cls(
            classifier=classifier,
            min_samples=meta.get("min_samples_threshold", cls.MIN_SAMPLES_FOR_DEDICATED),
            model_family=meta.get("model_family", "random_forest"),
            random_state=meta.get("random_state", 42),
            routing_mode=meta.get("routing_mode", "hard")
        )
        inst.classes_ = meta.get("classes", [])
        inst.model_provenance_ = meta.get("regime_models", {})

        # Load individual regime models
        for reg in inst.classes_:
            fname = f"{reg.lower()}.pkl"
            p = os.path.join(models_dir, fname)
            if os.path.exists(p):
                with open(p, "rb") as f:
                    inst.regime_models_[reg] = pickle.load(f)

        # Load fallback model
        fb_path = os.path.join(models_dir, "fallback_model.pkl")
        if os.path.exists(fb_path):
            with open(fb_path, "rb") as f:
                fb_est = pickle.load(f)
            inst.fallback_model_ = GlobalPostProcessor(model_type=inst.model_family, random_state=inst.random_state)
            inst.fallback_model_.estimator = fb_est
            inst.fallback_model_.is_fitted = True

        inst.is_fitted = True
        return inst
