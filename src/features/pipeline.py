"""
Feature Pipeline module for SIH26080.
Orchestrates feature extraction, transformation fitting, and strict zero-leakage validation.
"""
import os
import json
from typing import Tuple, List, Optional, Dict, Any
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

from .nwp_features import NWPFeatureExtractor
from .temporal_features import TemporalFeatureExtractor
from .spatial_features import SpatialFeatureExtractor
from .historical_features import HistoricalFeatureExtractor
from .leakage_checker import LeakageChecker


class FeaturePipeline:
    """
    Constructs scientifically traceable feature matrices from real paired meteorological data.
    Guarantees no target leakage and fits all transformations strictly on training subsets.
    """

    def __init__(self, scale_features: bool = True):
        self.scale_features = scale_features
        self.scaler: Optional[StandardScaler] = None
        self.feature_names_: List[str] = []
        self.impute_values_: Dict[str, float] = {}
        self.is_fitted: bool = False

    def _extract_raw_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extracts features across NWP, Temporal, Spatial, and Historical categories."""
        df_nwp = NWPFeatureExtractor.extract_features(df)
        df_temp = TemporalFeatureExtractor.extract_features(df)
        df_spat = SpatialFeatureExtractor.extract_features(df)
        df_hist = HistoricalFeatureExtractor.extract_features(df)

        # Concatenate horizontally
        X = pd.concat([df_nwp, df_temp, df_spat, df_hist], axis=1)

        # Drop duplicate columns
        X = X.loc[:, ~X.columns.duplicated()]
        return X

    def fit_transform(
        self,
        df_train: pd.DataFrame,
        target_col: str = "observed_rainfall"
    ) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Fits transformations exclusively on training data and returns (X_train, y_train).
        """
        if df_train.empty:
            raise ValueError("Training DataFrame cannot be empty.")

        X_raw = self._extract_raw_features(df_train)

        # Extract target series
        if target_col not in df_train.columns:
            raise KeyError(f"Target column '{target_col}' not found in training DataFrame.")

        y_train = df_train[target_col].copy()

        # Run target leakage validation
        is_leak_free, leak_errors = LeakageChecker.check_target_leakage(X_raw, y_train, target_col)
        if not is_leak_free:
            raise ValueError(f"Target leakage detected during feature engineering: {'; '.join(leak_errors)}")

        numeric_cols = X_raw.select_dtypes(include=[np.number]).columns.tolist()
        self.feature_names_ = numeric_cols

        X_numeric = X_raw[numeric_cols].copy()

        # Calculate training imputation values (medians or 0.0 for all-NaN columns)
        for col in numeric_cols:
            col_series = X_numeric[col].dropna()
            if len(col_series) > 0:
                self.impute_values_[col] = float(col_series.median())
            else:
                self.impute_values_[col] = 0.0
            X_numeric[col] = X_numeric[col].fillna(self.impute_values_[col])

        if self.scale_features:
            self.scaler = StandardScaler()
            # Fit strictly on X_train
            X_scaled_vals = self.scaler.fit_transform(X_numeric)
            X_train = pd.DataFrame(X_scaled_vals, columns=numeric_cols, index=df_train.index)
        else:
            X_train = X_numeric

        self.is_fitted = True
        return X_train, y_train

    def transform(
        self,
        df: pd.DataFrame,
        target_col: Optional[str] = "observed_rainfall"
    ) -> Tuple[pd.DataFrame, Optional[pd.Series]]:
        """
        Applies fitted transformations to unseen evaluation/test data without re-fitting.
        """
        if not self.is_fitted:
            raise RuntimeError("FeaturePipeline must be fitted on training data before calling transform().")

        X_raw = self._extract_raw_features(df)
        X_numeric = X_raw.reindex(columns=self.feature_names_)

        # Impute strictly using values fitted from training set
        for col in self.feature_names_:
            fill_val = self.impute_values_.get(col, 0.0)
            X_numeric[col] = X_numeric[col].fillna(fill_val)

        if self.scale_features and self.scaler is not None:
            X_scaled_vals = self.scaler.transform(X_numeric)
            X_out = pd.DataFrame(X_scaled_vals, columns=self.feature_names_, index=df.index)
        else:
            X_out = X_numeric

        y_out = None
        if target_col and target_col in df.columns:
            y_out = df[target_col].copy()
            # Verify no leakage
            is_leak_free, leak_errors = LeakageChecker.check_target_leakage(X_out, y_out, target_col)
            if not is_leak_free:
                raise ValueError(f"Target leakage detected in transform(): {'; '.join(leak_errors)}")

        return X_out, y_out

    def save_provenance(self, filepath: str = "data/metadata/feature_pipeline_provenance.json"):
        """Saves feature engineering metadata and transformation parameters."""
        meta = {
            "is_fitted": self.is_fitted,
            "scale_features": self.scale_features,
            "feature_count": len(self.feature_names_),
            "feature_names": self.feature_names_,
            "impute_values": self.impute_values_,
            "scaler_type": "StandardScaler" if self.scale_features else "None",
            "scaler_means": self.scaler.mean_.tolist() if (self.scaler and hasattr(self.scaler, "mean_")) else None,
            "scaler_scale": self.scaler.scale_.tolist() if (self.scaler and hasattr(self.scaler, "scale_")) else None
        }
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)
