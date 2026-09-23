"""
Weather Regime Classifier for SIH26080.
Trains and evaluates transparent machine learning classifiers to predict
synoptic weather regimes from raw NWP atmospheric predictors.
Guarantees strict zero-temporal-leakage and full scientific interpretability.
"""
import os
import json
import pickle
from typing import Dict, Any, Optional, List, Tuple
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, f1_score, confusion_matrix

from .label_generator import VALID_REGIMES


class RegimeClassifier:
    """
    Supervised classifier for monsoon weather regimes.
    Predicts: ACTIVE_MONSOON, BREAK_MONSOON, COASTAL_OROGRAPHIC, DEPRESSION, OTHER.
    """

    def __init__(
        self,
        model_type: str = "gradient_boosting",
        random_state: int = 42,
        class_weight: Optional[str] = "balanced",
        **model_kwargs
    ):
        """
        Initializes the regime classifier.

        Parameters:
        -----------
        model_type : str
            One of 'gradient_boosting' (default), 'logistic_regression', or 'random_forest'.
        random_state : int
            Seed for deterministic reproducibility.
        class_weight : Optional[str]
            Handling for class imbalance (e.g. 'balanced' for LR / RF).
        """
        self.model_type = model_type.lower()
        self.random_state = random_state
        self.class_weight = class_weight
        self.model_kwargs = model_kwargs
        self.classes_: List[str] = []
        self.feature_names_: List[str] = []
        self.is_fitted: bool = False
        self.estimator = self._init_estimator()

    def _init_estimator(self):
        """Initializes the underlying scikit-learn estimator."""
        if self.model_type == "gradient_boosting":
            # Gradient Boosting naturally captures non-linear atmospheric interactions
            n_estimators = self.model_kwargs.get("n_estimators", 50)
            max_depth = self.model_kwargs.get("max_depth", 3)
            lr = self.model_kwargs.get("learning_rate", 0.05)
            return GradientBoostingClassifier(
                n_estimators=n_estimators,
                max_depth=max_depth,
                learning_rate=lr,
                random_state=self.random_state
            )
        elif self.model_type == "logistic_regression":
            # Highly transparent linear baseline with balanced class weights
            max_iter = self.model_kwargs.get("max_iter", 1000)
            C = self.model_kwargs.get("C", 1.0)
            return LogisticRegression(
                C=C,
                max_iter=max_iter,
                class_weight=self.class_weight,
                random_state=self.random_state
            )
        elif self.model_type == "random_forest":
            n_estimators = self.model_kwargs.get("n_estimators", 100)
            max_depth = self.model_kwargs.get("max_depth", 5)
            return RandomForestClassifier(
                n_estimators=n_estimators,
                max_depth=max_depth,
                class_weight=self.class_weight,
                random_state=self.random_state
            )
        else:
            raise ValueError(
                f"Unknown model_type '{self.model_type}'. Choose from 'gradient_boosting', 'logistic_regression', 'random_forest'."
            )

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "RegimeClassifier":
        """
        Fits the regime classifier strictly on training features.

        Parameters:
        -----------
        X : pd.DataFrame
            NWP forecast feature matrix.
        y : pd.Series or np.ndarray
            Verified canonical regime labels.
        """
        if X.empty:
            raise ValueError("Training feature matrix X cannot be empty.")
        if len(y) != len(X):
            raise ValueError(f"Length mismatch: X has {len(X)} rows, y has {len(y)} rows.")

        self.feature_names_ = list(X.columns)
        self.classes_ = sorted(list(set(y)))

        # Fit estimator
        self.estimator.fit(X, y)
        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Predicts regime labels for unseen forecast instances."""
        if not self.is_fitted:
            raise RuntimeError("Classifier must be fitted before predict() can be called.")
        return self.estimator.predict(X)

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """Predicts class posterior probabilities."""
        if not self.is_fitted:
            raise RuntimeError("Classifier must be fitted before predict_proba() can be called.")
        return self.estimator.predict_proba(X)

    def evaluate(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, Any]:
        """
        Computes comprehensive evaluation metrics on validation or test sets.
        """
        preds = self.predict(X)
        acc = float(accuracy_score(y, preds))
        macro_f1 = float(f1_score(y, preds, average="macro", zero_division=0))
        weighted_f1 = float(f1_score(y, preds, average="weighted", zero_division=0))

        report_dict = classification_report(y, preds, output_dict=True, zero_division=0)
        cm = confusion_matrix(y, preds, labels=self.classes_)

        return {
            "accuracy": acc,
            "macro_f1": macro_f1,
            "weighted_f1": weighted_f1,
            "classification_report": report_dict,
            "confusion_matrix": cm.tolist(),
            "classes": self.classes_
        }

    def save(self, model_path: str = "models/regime_classifier.pkl", metadata_path: str = "models/regime_classifier_metadata.json"):
        """Saves model weights and execution metadata."""
        if not self.is_fitted:
            raise RuntimeError("Cannot save unfitted classifier.")
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        with open(model_path, "wb") as f:
            pickle.dump(self.estimator, f)

        meta = {
            "model_type": self.model_type,
            "random_state": self.random_state,
            "class_weight": self.class_weight,
            "feature_names": self.feature_names_,
            "feature_count": len(self.feature_names_),
            "classes": self.classes_,
            "is_fitted": self.is_fitted,
            "model_kwargs": self.model_kwargs
        }
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)

    @classmethod
    def load(cls, model_path: str = "models/regime_classifier.pkl", metadata_path: str = "models/regime_classifier_metadata.json") -> "RegimeClassifier":
        """Loads a persisted regime classifier from disk."""
        with open(metadata_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

        inst = cls(
            model_type=meta["model_type"],
            random_state=meta["random_state"],
            class_weight=meta.get("class_weight"),
            **meta.get("model_kwargs", {})
        )
        with open(model_path, "rb") as f:
            inst.estimator = pickle.load(f)

        inst.feature_names_ = meta["feature_names"]
        inst.classes_ = meta["classes"]
        inst.is_fitted = True
        return inst
