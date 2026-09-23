"""
Calibrated Probability of Exceedance Models for Rainfall Post-Processing (SIH26080).
Provides Global and Regime-Aware exceedance estimators for operational and experimental
rainfall thresholds, adhering to physical bounds [0, 1] and strict validation-based calibration.
"""
from typing import Dict, Any, Optional, List, Tuple, Union
import copy
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.base import BaseEstimator, ClassifierMixin

from src.metrics.probabilistic import evaluate_probability_forecast, brier_score
from src.metrics.categorical import csi, pod, far, ets
from src.regime_classifier.classifier import RegimeClassifier

VERIFIED_THRESHOLDS: Dict[float, Dict[str, str]] = {
    2.5: {
        "name": "Rainy Day",
        "category": "OPERATIONAL",
        "official_source": "IMD Official Standard: Daily rainfall >= 2.5 mm constitutes a rainy day.",
    },
    7.5: {
        "name": "Surge Proxy",
        "category": "EXPERIMENTAL",
        "official_source": "Experimental Monsoon Surge / Moderate Showers indicator (clearly distinguished from IMD standard).",
    },
    15.6: {
        "name": "Moderate Rain",
        "category": "OPERATIONAL",
        "official_source": "IMD Classification: 15.6 - 64.4 mm/day corresponds to Moderate Rainfall.",
    },
    64.5: {
        "name": "Heavy Rain",
        "category": "OPERATIONAL",
        "official_source": "IMD Classification: 64.5 - 115.5 mm/day corresponds to Heavy Rainfall.",
    },
    115.6: {
        "name": "Very Heavy Rain",
        "category": "OPERATIONAL",
        "official_source": "IMD Classification: 115.6 - 204.4 mm/day corresponds to Very Heavy Rainfall.",
    },
}


class ConstantProbabilityEstimator(BaseEstimator, ClassifierMixin):
    """
    Fallback estimator when training data contains 0 positive cases.
    Always outputs constant probability (default: 0.0).
    """

    def __init__(self, prob: float = 0.0):
        self.prob = float(prob)
        self.classes_ = np.array([0, 1])

    def fit(self, X, y=None):
        return self

    def predict_proba(self, X):
        n = len(X)
        probs = np.zeros((n, 2), dtype=float)
        probs[:, 0] = 1.0 - self.prob
        probs[:, 1] = self.prob
        return probs

    def predict(self, X):
        return (self.predict_proba(X)[:, 1] >= 0.5).astype(int)


class GlobalExceedanceModel:
    """
    Global Calibrated Probability of Exceedance Model (Experiment A).
    Estimates P(Y >= threshold | X) using atmospheric and NWP features
    without weather regime conditioning.
    """

    def __init__(
        self,
        threshold_mm: float,
        model_family: str = "gradient_boosting",
        calibration_method: str = "sigmoid",
        random_state: int = 42,
    ):
        self.threshold_mm = float(threshold_mm)
        self.model_family = model_family
        self.calibration_method = calibration_method
        self.random_state = random_state

        self.model_: Optional[Any] = None
        self.training_sample_count_: int = 0
        self.training_positive_count_: int = 0
        self.is_calibrated_: bool = False

    def fit(self, X: pd.DataFrame, y: Union[pd.Series, np.ndarray]):
        """
        Fits calibrated classifier on training predictors and observed rainfall.
        """
        y_arr = np.asarray(y, dtype=float).ravel()
        # Create binary target
        y_bin = (y_arr >= self.threshold_mm).astype(int)

        self.training_sample_count_ = len(y_bin)
        self.training_positive_count_ = int(np.sum(y_bin == 1))

        if self.training_positive_count_ == 0:
            # Zero positive cases: cannot fit classifier; output constant zero
            self.model_ = ConstantProbabilityEstimator(prob=0.0)
            self.is_calibrated_ = False
            return self

        base_estimator = GradientBoostingClassifier(
            n_estimators=60,
            max_depth=3 if self.training_positive_count_ >= 10 else 2,
            learning_rate=0.05,
            subsample=0.8,
            random_state=self.random_state,
        )

        if self.training_positive_count_ >= 6 and (self.training_sample_count_ - self.training_positive_count_) >= 6:
            # Full 3-fold cross-validated calibration
            self.model_ = CalibratedClassifierCV(
                estimator=base_estimator,
                method=self.calibration_method,
                cv=3
            )
            self.model_.fit(X, y_bin)
            self.is_calibrated_ = True
        elif self.training_positive_count_ >= 2 and (self.training_sample_count_ - self.training_positive_count_) >= 2:
            # 2-fold cross-validated calibration for sparse positives
            self.model_ = CalibratedClassifierCV(
                estimator=base_estimator,
                method=self.calibration_method,
                cv=2
            )
            self.model_.fit(X, y_bin)
            self.is_calibrated_ = True
        else:
            # 1 positive case: fit base estimator without cross-validation calibration
            base_estimator.fit(X, y_bin)
            self.model_ = base_estimator
            self.is_calibrated_ = False

        return self

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Returns estimated exceedance probability P(Y >= threshold | X) in range [0, 1].
        """
        if self.model_ is None:
            raise RuntimeError("Model has not been fitted yet.")

        if isinstance(self.model_, ConstantProbabilityEstimator):
            return np.zeros(len(X), dtype=float)

        proba = self.model_.predict_proba(X)
        if proba.shape[1] == 1:
            # Single class present during fit
            if hasattr(self.model_, "classes_") and self.model_.classes_[0] == 1:
                p = np.ones(len(X), dtype=float)
            else:
                p = np.zeros(len(X), dtype=float)
        else:
            p = proba[:, 1]

        # Enforce physical probability bounds [0, 1]
        return np.clip(p, 0.0, 1.0)


class RegimeAwareExceedanceModel:
    """
    Regime-Aware Calibrated Probability of Exceedance Model (Experiment B).
    Conditions probability estimation on predicted weather regimes from Phase 4 classifier.
    Trains dedicated calibrated models where sample support permits, with fallback to global model.
    """

    MIN_SAMPLES_FOR_DEDICATED = 15
    MIN_POS_FOR_DEDICATED = 3

    def __init__(
        self,
        threshold_mm: float,
        classifier: Optional[RegimeClassifier] = None,
        min_samples: int = MIN_SAMPLES_FOR_DEDICATED,
        min_pos: int = MIN_POS_FOR_DEDICATED,
        routing_mode: str = "hard",
        random_state: int = 42,
    ):
        self.threshold_mm = float(threshold_mm)
        self.classifier = classifier
        self.min_samples = min_samples
        self.min_pos = min_pos
        self.routing_mode = routing_mode.lower()
        self.random_state = random_state

        self.global_fallback_: Optional[GlobalExceedanceModel] = None
        self.regime_models_: Dict[str, Optional[Any]] = {}
        self.regime_counts_: Dict[str, Dict[str, int]] = {}

    def fit(
        self,
        X: pd.DataFrame,
        y: Union[pd.Series, np.ndarray],
        regime_labels: Optional[Union[pd.Series, np.ndarray]] = None,
    ):
        """
        Fits global fallback and dedicated regime models.
        """
        # 1. Fit global fallback
        self.global_fallback_ = GlobalExceedanceModel(
            threshold_mm=self.threshold_mm,
            random_state=self.random_state
        )
        self.global_fallback_.fit(X, y)

        if regime_labels is None:
            return self

        reg_series = pd.Series(regime_labels).reset_index(drop=True)
        y_arr = np.asarray(y, dtype=float).ravel()
        y_bin = (y_arr >= self.threshold_mm).astype(int)

        regimes = reg_series.unique()
        for r in regimes:
            mask = (reg_series == r).values
            n_sub = int(np.sum(mask))
            pos_sub = int(np.sum(y_bin[mask]))
            neg_sub = n_sub - pos_sub

            self.regime_counts_[r] = {
                "total": n_sub,
                "positives": pos_sub,
                "negatives": neg_sub,
            }

            if (
                n_sub >= self.min_samples
                and pos_sub >= self.min_pos
                and neg_sub >= self.min_pos
            ):
                # Fit dedicated regime model
                X_sub = X.iloc[mask].copy()
                y_sub_bin = y_bin[mask]

                base_r = GradientBoostingClassifier(
                    n_estimators=40,
                    max_depth=2,
                    learning_rate=0.05,
                    subsample=0.8,
                    random_state=self.random_state,
                )

                n_splits = 3 if (pos_sub >= 6 and neg_sub >= 6) else 2
                model_r = CalibratedClassifierCV(
                    estimator=base_r,
                    method="sigmoid",
                    cv=n_splits
                )
                model_r.fit(X_sub, y_sub_bin)
                self.regime_models_[r] = model_r
            else:
                self.regime_models_[r] = None

        return self

    def predict_proba(
        self,
        X: pd.DataFrame,
        predicted_regimes: Optional[Union[pd.Series, np.ndarray, List[str]]] = None,
        regime_probabilities: Optional[np.ndarray] = None,
    ) -> np.ndarray:
        """
        Predicts exceedance probabilities conditioned on predicted regimes.
        """
        if self.global_fallback_ is None:
            raise RuntimeError("Model has not been fitted yet.")

        p_global = self.global_fallback_.predict_proba(X)
        n = len(X)

        if predicted_regimes is None and self.classifier is not None:
            predicted_regimes = self.classifier.predict(X)
            regime_probabilities = self.classifier.predict_proba(X)

        if predicted_regimes is None:
            return p_global

        pred_reg_series = pd.Series(predicted_regimes).reset_index(drop=True)

        if self.routing_mode == "soft" and regime_probabilities is not None and self.classifier is not None:
            classes = list(self.classifier.classes_)
            p_soft = np.zeros(n, dtype=float)

            for c_idx, r in enumerate(classes):
                w = regime_probabilities[:, c_idx]
                if self.regime_models_.get(r) is not None:
                    p_r = self.regime_models_[r].predict_proba(X)[:, 1]
                else:
                    p_r = p_global
                p_soft += w * p_r

            return np.clip(p_soft, 0.0, 1.0)

        # Hard routing
        p_out = np.zeros(n, dtype=float)
        for i in range(n):
            r = pred_reg_series.iloc[i]
            model_r = self.regime_models_.get(r)
            if model_r is not None:
                p_out[i] = model_r.predict_proba(X.iloc[[i]])[0, 1]
            else:
                p_out[i] = p_global[i]

        return np.clip(p_out, 0.0, 1.0)


class ExceedanceModelSuite:
    """
    Coordinates multi-threshold probability of exceedance estimation,
    calibration, threshold tuning on validation data, and full verification.
    """

    def __init__(
        self,
        thresholds: Optional[List[float]] = None,
        classifier: Optional[RegimeClassifier] = None,
        routing_mode: str = "hard",
        random_state: int = 42,
    ):
        if thresholds is None:
            self.thresholds = sorted(list(VERIFIED_THRESHOLDS.keys()))
        else:
            self.thresholds = sorted(thresholds)

        self.classifier = classifier
        self.routing_mode = routing_mode
        self.random_state = random_state

        self.global_models: Dict[float, GlobalExceedanceModel] = {}
        self.regime_models: Dict[float, RegimeAwareExceedanceModel] = {}
        self.optimal_decision_thresholds_global: Dict[float, float] = {}
        self.optimal_decision_thresholds_regime: Dict[float, float] = {}

    def fit(
        self,
        X: pd.DataFrame,
        y: Union[pd.Series, np.ndarray],
        regime_labels: Optional[Union[pd.Series, np.ndarray]] = None,
    ):
        """
        Fits global and regime-aware models across all configured thresholds.
        """
        for thr in self.thresholds:
            # Fit global model
            gm = GlobalExceedanceModel(threshold_mm=thr, random_state=self.random_state)
            gm.fit(X, y)
            self.global_models[thr] = gm

            # Fit regime-aware model
            rm = RegimeAwareExceedanceModel(
                threshold_mm=thr,
                classifier=self.classifier,
                routing_mode=self.routing_mode,
                random_state=self.random_state,
            )
            rm.fit(X, y, regime_labels=regime_labels)
            self.regime_models[thr] = rm

        return self

    def tune_decision_thresholds_on_validation(
        self,
        X_val: pd.DataFrame,
        y_val: Union[pd.Series, np.ndarray],
        candidate_cutoffs: Optional[List[float]] = None,
    ) -> Dict[str, Dict[float, float]]:
        """
        Evaluates candidate operational probability warning cutoffs (e.g. 0.1, 0.2, ..., 0.9)
        strictly on the validation set to maximize CSI (or F1 if CSI undefined).
        Prevents test-set leakage.
        """
        if candidate_cutoffs is None:
            candidate_cutoffs = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]

        y_val_arr = np.asarray(y_val, dtype=float).ravel()

        for thr in self.thresholds:
            y_val_bin = (y_val_arr >= thr).astype(int)
            n_pos_val = int(np.sum(y_val_bin == 1))

            # If validation has 0 positive cases, set default 0.5
            if n_pos_val == 0:
                self.optimal_decision_thresholds_global[thr] = 0.5
                self.optimal_decision_thresholds_regime[thr] = 0.5
                continue

            # Tune global
            p_glob = self.global_models[thr].predict_proba(X_val)
            best_tau_glob = 0.5
            best_score_glob = -1.0

            for tau in candidate_cutoffs:
                y_pred = (p_glob >= tau).astype(int)
                h = int(np.sum((y_pred == 1) & (y_val_bin == 1)))
                f = int(np.sum((y_pred == 1) & (y_val_bin == 0)))
                m = int(np.sum((y_pred == 0) & (y_val_bin == 1)))
                score = csi(h, f, m) or 0.0
                if score > best_score_glob:
                    best_score_glob = score
                    best_tau_glob = tau

            self.optimal_decision_thresholds_global[thr] = best_tau_glob

            # Tune regime-aware
            p_reg = self.regime_models[thr].predict_proba(X_val)
            best_tau_reg = 0.5
            best_score_reg = -1.0

            for tau in candidate_cutoffs:
                y_pred = (p_reg >= tau).astype(int)
                h = int(np.sum((y_pred == 1) & (y_val_bin == 1)))
                f = int(np.sum((y_pred == 1) & (y_val_bin == 0)))
                m = int(np.sum((y_pred == 0) & (y_val_bin == 1)))
                score = csi(h, f, m) or 0.0
                if score > best_score_reg:
                    best_score_reg = score
                    best_tau_reg = tau

            self.optimal_decision_thresholds_regime[thr] = best_tau_reg

        return {
            "global_optimal_thresholds": self.optimal_decision_thresholds_global,
            "regime_optimal_thresholds": self.optimal_decision_thresholds_regime,
        }

    def evaluate_suite(
        self,
        X: pd.DataFrame,
        y: Union[pd.Series, np.ndarray],
        predicted_regimes: Optional[Union[pd.Series, np.ndarray, List[str]]] = None,
        use_tuned_thresholds: bool = True,
    ) -> Dict[str, Dict[float, Dict[str, Any]]]:
        """
        Evaluates both global and regime-aware models across all thresholds.
        """
        y_arr = np.asarray(y, dtype=float).ravel()
        results_global = {}
        results_regime = {}

        for thr in self.thresholds:
            y_bin = (y_arr >= thr).astype(int)

            # Global evaluation
            p_glob = self.global_models[thr].predict_proba(X)
            tau_glob = (
                self.optimal_decision_thresholds_global.get(thr, 0.5)
                if use_tuned_thresholds
                else 0.5
            )
            eval_glob = evaluate_probability_forecast(
                y_true=y_bin,
                y_prob=p_glob,
                decision_threshold=tau_glob,
                threshold_mm=thr,
            )
            results_global[thr] = eval_glob

            # Regime-aware evaluation
            p_reg = self.regime_models[thr].predict_proba(
                X, predicted_regimes=predicted_regimes
            )
            tau_reg = (
                self.optimal_decision_thresholds_regime.get(thr, 0.5)
                if use_tuned_thresholds
                else 0.5
            )
            eval_reg = evaluate_probability_forecast(
                y_true=y_bin,
                y_prob=p_reg,
                decision_threshold=tau_reg,
                threshold_mm=thr,
            )
            results_regime[thr] = eval_reg

        return {
            "global_model": results_global,
            "regime_aware_model": results_regime,
        }
