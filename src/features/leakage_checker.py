"""
Automated Data and Target Leakage Detection for SIH26080.
"""
from typing import Tuple, List, Optional
import pandas as pd
import numpy as np


class LeakageChecker:
    """Rigorous leakage detection across features, targets, and temporal splits."""

    @classmethod
    def check_target_leakage(
        cls,
        X: pd.DataFrame,
        y: pd.Series,
        target_name: str = "observed_rainfall"
    ) -> Tuple[bool, List[str]]:
        """
        Verifies that target is not present in X and has no deterministic leakage.
        """
        errors = []

        # 1. Column name check
        if target_name in X.columns:
            errors.append(f"Target column '{target_name}' is directly present in feature matrix X.")

        for col in X.columns:
            if "observed" in col.lower():
                errors.append(f"Suspicious column name containing 'observed' found in X: '{col}'.")

        # 2. Perfect correlation check
        if len(y.dropna()) > 5:
            for col in X.select_dtypes(include=[np.number]).columns:
                series = X[col].dropna()
                common_idx = series.index.intersection(y.dropna().index)
                if len(common_idx) > 5:
                    s_vals = series.loc[common_idx]
                    y_vals = y.loc[common_idx]
                    if s_vals.std() > 1e-6 and y_vals.std() > 1e-6:
                        corr = np.corrcoef(s_vals, y_vals)[0, 1]
                        if np.isclose(abs(corr), 1.0, atol=1e-4):
                            errors.append(
                                f"Feature '{col}' has near-perfect correlation ({corr:.4f}) with target, indicating potential target leakage."
                            )

        return len(errors) == 0, errors

    @classmethod
    def check_scaler_leakage(
        cls,
        scaler,
        X_train_raw: pd.DataFrame,
        X_test_scaled: pd.DataFrame
    ) -> Tuple[bool, List[str]]:
        """
        Verifies that:
        1. Scaler parameters strictly match unscaled training data (not test or full dataset).
        2. Scaler was not refitted on test data.
        """
        errors = []
        if hasattr(scaler, "mean_"):
            raw_train_means = X_train_raw.select_dtypes(include=[np.number]).mean(axis=0).values
            scaler_means = scaler.mean_
            if len(raw_train_means) == len(scaler_means):
                if not np.allclose(raw_train_means, scaler_means, atol=1e-3, equal_nan=True):
                    errors.append("Scaler fitted parameters do not match raw training data parameters.")

            # Check that X_test_scaled mean is NOT identically zero (which would indicate refitting on test)
            test_means = X_test_scaled.select_dtypes(include=[np.number]).mean(axis=0).values
            if len(test_means) > 0 and np.allclose(test_means, 0.0, atol=1e-6):
                errors.append("Test features have mean exactly 0.0, indicating scaler was improperly refitted on test.")

        return len(errors) == 0, errors
