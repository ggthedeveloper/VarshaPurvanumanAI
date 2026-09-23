"""
Unit tests for ChronologicalSplitter.
"""
import pytest
import pandas as pd
from src.features.split import ChronologicalSplitter


def test_chronological_split_strict_ordering():
    dates = pd.date_range("2023-06-01", periods=100, freq="D", tz="UTC")
    df = pd.DataFrame({
        "timestamp": dates,
        "nwp_rainfall": range(100),
        "observed_rainfall": range(100)
    })

    df_train, df_val, df_test = ChronologicalSplitter.split_by_dates(
        df=df,
        time_col="timestamp",
        train_end="2023-07-31",
        val_end="2023-08-31"
    )

    assert not df_train.empty
    assert not df_val.empty
    assert not df_test.empty

    max_train = df_train["timestamp"].max()
    min_val = df_val["timestamp"].min()
    max_val = df_val["timestamp"].max()
    min_test = df_test["timestamp"].min()

    assert max_train < min_val
    assert max_val < min_test

    is_clean, err = ChronologicalSplitter.verify_split_temporal_integrity(df_train, df_val, df_test)
    assert is_clean is True
    assert err is None


def test_chronological_split_detects_temporal_leakage():
    # Construct invalid split where train has a future date
    df_train = pd.DataFrame({"timestamp": pd.date_range("2023-06-01", periods=10, freq="D", tz="UTC")})
    # Overlapping validation set
    df_val = pd.DataFrame({"timestamp": pd.date_range("2023-06-05", periods=10, freq="D", tz="UTC")})
    df_test = pd.DataFrame({"timestamp": pd.date_range("2023-07-01", periods=10, freq="D", tz="UTC")})

    is_clean, err = ChronologicalSplitter.verify_split_temporal_integrity(df_train, df_val, df_test)
    assert is_clean is False
    assert "Temporal leakage detected" in err
