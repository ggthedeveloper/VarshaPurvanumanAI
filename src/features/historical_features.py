"""
Historical / Antecedent Feature Extractor with Strict Anti-Leakage Guarantee.
"""
from typing import List, Optional
import pandas as pd
import numpy as np


class HistoricalFeatureExtractor:
    """
    Extracts strictly past antecedent rainfall and forecast trajectory indicators.
    Guarantees zero target leakage by applying shift(1) before any rolling window calculation.
    """

    @staticmethod
    def extract_features(
        df: pd.DataFrame,
        group_col: str = "district_name",
        nwp_col: str = "nwp_rainfall"
    ) -> pd.DataFrame:
        """
        Derives antecedent NWP predictors.

        Parameters:
        -----------
        df : pd.DataFrame
            DataFrame sorted by timestamp for each group.
        group_col : str
            Column name to group time series by (e.g., 'district_name').
        nwp_col : str
            NWP rainfall column name.
        """
        out = pd.DataFrame(index=df.index)

        if nwp_col not in df.columns:
            return out

        if group_col in df.columns and "timestamp" in df.columns:
            # Sort within group to guarantee chronological order
            df_sorted = df.sort_values(by=[group_col, "timestamp"])
            grouped = df_sorted.groupby(group_col)[nwp_col]

            # Shift by 1 step: strictly prior forecast value (t-1)
            lag1 = grouped.shift(1)
            # 3-step rolling mean of past values (t-3, t-2, t-1)
            rolling3 = grouped.apply(lambda s: s.shift(1).rolling(3, min_periods=1).mean()).reset_index(level=0, drop=True)

            out["nwp_rainfall_lag1"] = lag1.reindex(df.index)
            out["nwp_rainfall_rolling3"] = rolling3.reindex(df.index)
        else:
            # If no time series group available, antecedent features are marked NaN
            out["nwp_rainfall_lag1"] = np.nan
            out["nwp_rainfall_rolling3"] = np.nan

        return out
