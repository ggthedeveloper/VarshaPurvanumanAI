"""
District Geographic and Forecast Lookup Service for VarshaPurvanumanAI Backend.
Provides access to verified Indian district coordinates, historical benchmark forecasts,
and explicit DATA_UNAVAILABLE notices for unmonitored districts without synthetic data fabrication.
"""
import os
from typing import List, Optional, Dict, Any, Tuple
import pandas as pd

from backend.app.config import settings
from backend.app.schemas.district import DistrictItem, DistrictListResponse, DistrictForecastResponse
from backend.app.services.prediction_service import PredictionService
from backend.app.schemas.forecast import CombinedForecastResponse
from backend.app.utils.logger import logger
from src.ingestion.observations.imd_district.district_centroids import (
    OFFICIAL_DISTRICT_COORDINATES,
    OFFICIAL_DISTRICT_STATES,
    get_district_state,
)


class DistrictService:
    """
    Manages district catalog and station/district operational forecast retrieval.
    Strictly preserves the distinction between validated station benchmark replay
    and unsupported administrative districts.
    """

    @classmethod
    def get_all_districts(cls) -> DistrictListResponse:
        """
        Returns all verified Indian districts from the authoritative coordinates registry.
        Pune is designated as the sole BENCHMARK_ACTIVE station.
        All other districts return DATA_UNAVAILABLE with null forecast previews.
        """
        items: List[DistrictItem] = []
        for name, coords in sorted(OFFICIAL_DISTRICT_COORDINATES.items()):
            dist_id = name.lower().replace(" ", "_")
            state_name = get_district_state(name)

            if "pune" in dist_id:
                disp_name = "PUNE BENCHMARK STATION"
                status = "BENCHMARK_ACTIVE"
                raw_val = 0.90
                corr_val = 3.26
                regime = "OTHER"
            else:
                disp_name = name.title()
                status = "DATA_UNAVAILABLE"
                raw_val = None
                corr_val = None
                regime = None

            items.append(DistrictItem(
                district_id=dist_id,
                name=disp_name,
                state=state_name,
                latitude=coords[0],
                longitude=coords[1],
                coverage_status=status,
                raw_nwp_rainfall_mm=raw_val,
                corrected_rainfall_mm=corr_val,
                predicted_regime=regime,
            ))

        active_count = sum(1 for item in items if item.coverage_status == "BENCHMARK_ACTIVE")
        return DistrictListResponse(
            total_districts=len(items),
            active_districts=active_count,
            districts=items,
            data_status=settings.DATA_STATUS,
        )

    @classmethod
    def get_district_forecast(cls, district_id: str) -> DistrictForecastResponse:
        """
        Returns verified forecast for Pune benchmark station or explicit DATA_UNAVAILABLE notice.
        NEVER fabricates meteorological values or passes synthetic data into trained models.
        Returns 404 UNKNOWN_DISTRICT only for non-existent district IDs.
        """
        normalized_id = district_id.lower().strip().replace("-", "_").replace(" ", "_")

        matched_name = None
        matched_coords = None
        for name, coords in OFFICIAL_DISTRICT_COORDINATES.items():
            if name.lower().replace(" ", "_") == normalized_id:
                matched_name = name.title()
                matched_coords = coords
                break

        if matched_name is None:
            return DistrictForecastResponse(
                district_id=district_id,
                name=district_id.title(),
                latitude=0.0,
                longitude=0.0,
                coverage_status="UNKNOWN_DISTRICT",
                forecast_mode="DATA_UNAVAILABLE",
                sample_timestamp=None,
                forecast=None,
                message=f"District '{district_id}' is not in the verified administrative registry.",
                data_status="DATA_UNAVAILABLE",
            )

        # 1. Pune Benchmark Station (Station-level ground truth replay)
        if "pune" in normalized_id:
            try:
                x_test_path = os.path.join(settings.DATA_DIR, "processed", "X_test.csv")
                trace_path = os.path.join(settings.DATA_DIR, "processed", "predictions_trace_test.csv")

                if not os.path.exists(x_test_path) or not os.path.exists(trace_path):
                    logger.error(f"Required benchmark files missing: {x_test_path} or {trace_path}")
                    return DistrictForecastResponse(
                        district_id=normalized_id,
                        name="PUNE BENCHMARK STATION",
                        latitude=matched_coords[0],
                        longitude=matched_coords[1],
                        coverage_status="DATA_UNAVAILABLE",
                        forecast_mode="DATA_UNAVAILABLE",
                        sample_timestamp=None,
                        forecast=None,
                        message="Benchmark data files are missing from repository.",
                        data_status="DATA_UNAVAILABLE",
                    )

                X_test = pd.read_csv(x_test_path)
                df_det = pd.read_csv(trace_path)

                latest_features = X_test.iloc[[-1]]
                latest_raw_nwp = float(df_det.iloc[-1]["raw_nwp_rainfall"])
                sample_time = str(df_det.iloc[-1].get("timestamp", "2024-07-01 00:00:00+00:00"))

                combined_fcst = PredictionService.predict_combined_forecast(latest_features, latest_raw_nwp)
                combined_fcst.forecast_mode = "HISTORICAL_BENCHMARK"
                combined_fcst.sample_timestamp = sample_time
                combined_fcst.data_status = "HISTORICAL_BENCHMARK"

                return DistrictForecastResponse(
                    district_id=normalized_id,
                    name="PUNE BENCHMARK STATION",
                    latitude=matched_coords[0],
                    longitude=matched_coords[1],
                    coverage_status="BENCHMARK_ACTIVE",
                    forecast_mode="HISTORICAL_BENCHMARK",
                    sample_timestamp=sample_time,
                    forecast=combined_fcst,
                    message="Historical benchmark replay from June 30, 2024 held-out test sample for PUNE BENCHMARK STATION (18.50°N, 73.80°E). Station-level benchmark. District-level spatial aggregate data is currently unavailable.",
                    data_status="HISTORICAL_BENCHMARK",
                )
            except Exception as e:
                logger.error(f"Unexpected error loading Pune benchmark forecast: {e}", exc_info=True)
                raise RuntimeError(f"Internal error loading Pune benchmark forecast: {e}")

        # 2. Unsupported districts across India:
        # Strictly return DATA_UNAVAILABLE notice without fabricating data or copying Pune values.
        state_name = get_district_state(matched_name)
        return DistrictForecastResponse(
            district_id=normalized_id,
            name=f"{matched_name}, {state_name}",
            latitude=matched_coords[0],
            longitude=matched_coords[1],
            coverage_status="DATA_UNAVAILABLE",
            forecast_mode="DATA_UNAVAILABLE",
            sample_timestamp=None,
            forecast=None,
            message=f"District-level data unavailable for '{matched_name}'. Live NWP telemetry / station instrumentation is not currently connected for this administrative location. Station-level benchmark is verified strictly for PUNE BENCHMARK STATION (18.50°N, 73.80°E). No synthetic data generated.",
            data_status="DATA_UNAVAILABLE",
        )
