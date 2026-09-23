"""
Chronological and Event-Aware Train/Validation/Test Splitter for SIH26080.
Guarantees strict zero-temporal-leakage partitioning.
"""
from typing import Tuple, Dict, Any, Optional
import pandas as pd
import numpy as np


class ChronologicalSplitter:
    """Partitions meteorological time series data chronologically without future leakage."""

    @staticmethod
    def split_by_dates(
        df: pd.DataFrame,
        time_col: str,
        train_end: str,
        val_end: str
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Splits DataFrame chronologically based on explicit cutoff dates.

        Parameters:
        -----------
        df : pd.DataFrame
            Dataset with datetime/date column.
        time_col : str
            Name of time/date column.
        train_end : str
            End of training period (inclusive).
        val_end : str
            End of validation period (inclusive).

        Returns:
        --------
        (df_train, df_val, df_test)
        """
        df_sorted = df.sort_values(by=time_col).copy()
        ts_series = pd.to_datetime(df_sorted[time_col], utc=True)

        t_train_end = pd.to_datetime(train_end, utc=True)
        t_val_end = pd.to_datetime(val_end, utc=True)

        if t_train_end >= t_val_end:
            raise ValueError(f"train_end ({train_end}) must be strictly earlier than val_end ({val_end}).")

        train_mask = ts_series <= t_train_end
        val_mask = (ts_series > t_train_end) & (ts_series <= t_val_end)
        test_mask = ts_series > t_val_end

        df_train = df_sorted[train_mask].copy()
        df_val = df_sorted[val_mask].copy()
        df_test = df_sorted[test_mask].copy()

        return df_train, df_val, df_test

    @staticmethod
    def split_by_ratios(
        df: pd.DataFrame,
        time_col: str = "timestamp",
        train_ratio: float = 0.70,
        val_ratio: float = 0.15
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Splits DataFrame chronologically based on temporal ordering ratios.
        """
        if df.empty:
            return df.copy(), df.copy(), df.copy()

        df_sorted = df.sort_values(by=time_col).copy()
        n = len(df_sorted)

        if n < 3:
            # Insufficient samples for 3-way split; return single copy as train
            return df_sorted.copy(), pd.DataFrame(), pd.DataFrame()

        n_train = int(np.floor(n * train_ratio))
        n_val = int(np.floor(n * val_ratio))
        # Ensure at least 1 in val and test if n >= 3
        n_train = max(1, min(n - 2, n_train))
        n_val = max(1, min(n - n_train - 1, n_val))

        df_train = df_sorted.iloc[:n_train].copy()
        df_val = df_sorted.iloc[n_train:n_train + n_val].copy()
        df_test = df_sorted.iloc[n_train + n_val:].copy()

        return df_train, df_val, df_test

    @staticmethod
    def verify_split_temporal_integrity(
        df_train: pd.DataFrame,
        df_val: pd.DataFrame,
        df_test: pd.DataFrame,
        time_col: str = "timestamp"
    ) -> Tuple[bool, Optional[str]]:
        """Verifies that no future timestamps from val/test contaminate train."""
        if df_train.empty:
            return True, None

        max_train = pd.to_datetime(df_train[time_col]).max()

        if not df_val.empty:
            min_val = pd.to_datetime(df_val[time_col]).min()
            if max_train > min_val:
                return False, f"Temporal leakage detected: max train ({max_train}) > min val ({min_val})."

            max_val = pd.to_datetime(df_val[time_col]).max()
            if not df_test.empty:
                min_test = pd.to_datetime(df_test[time_col]).min()
                if max_val > min_test:
                    return False, f"Temporal leakage detected: max val ({max_val}) > min test ({min_test})."

        return True, None
