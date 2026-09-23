"""
Validator for IMD Gridded Rainfall observation datasets.
"""
from typing import Tuple, List
import pandas as pd
import numpy as np


class IMDGriddedValidator:
    """Validates gridded rainfall observation DataFrames."""

    @classmethod
    def validate(cls, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """Validates gridded observations for schema and physical bounds."""
        errors = []
        if df.empty:
            return False, ["Gridded observation DataFrame is empty."]

        if "date" not in df.columns and not isinstance(df.index, pd.DatetimeIndex):
            errors.append("DataFrame must have a 'date' column or a DatetimeIndex.")

        # Check rainfall values
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) == 0:
            return False, ["No numeric rainfall columns found."]

        for col in numeric_cols:
            vals = df[col].dropna()
            if (vals < 0.0).any():
                min_v = vals.min()
                errors.append(f"Column '{col}' contains negative rainfall: {min_v} mm.")
            if (vals > 1000.0).any():
                max_v = vals.max()
                errors.append(f"Column '{col}' exceeds physical limit: {max_v} mm.")

        return len(errors) == 0, errors
