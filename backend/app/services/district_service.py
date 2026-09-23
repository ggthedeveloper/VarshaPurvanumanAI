"""
District Geographic and Forecast Lookup Service for VarshaPurvanumanAI Backend.
Provides access to verified Indian district coordinates and historical benchmark forecasts.
Never fabricates data for districts lacking verified meteorological observations.
"""
import os
from typing import List, Optional, Dict, Any
import pandas as pd

from backend.app.config import settings
from backend.app.schemas.district import DistrictItem, DistrictListResponse, DistrictForecastResponse
from backend.app.services.feature_service import FeatureService
from backend.app.services.prediction_service import PredictionService
from backend.app.schemas.forecast import RainfallPredictionRequest
from backend.app.utils.logger import logger
from src.ingestion.observations.imd_district.district_centroids import OFFICIAL_DISTRICT_COORDINATES


class DistrictService:
    """
    Manages district catalog and station-specific forecast retrieval.
    """

    @staticmethod
    def get_all_districts() -> DistrictListResponse:
        """
        Returns all verified Indian districts from the authoritative coordinates registry.
        """
        items: List[DistrictItem] = []
        for name, coords in sorted(OFFICIAL_DISTRICT_COORDINATES.items()):
            dist_id = name.lower().replace(" ", "_")
            # Pune is the benchmark station with active verified real data
            if "pune" in dist_id:
                disp_name = "PUNE BENCHMARK STATION"
                status = "BENCHMARK_ACTIVE"
            else:
                disp_name = name.title()
                status = "REFERENCE_ONLY"

            items.append(DistrictItem(
                district_id=dist_id,
                name=disp_name,
                state="Maharashtra" if dist_id in ["pune", "mumbai", "nagpur", "nashik", "kolhapur", "satara", "solapur", "aurangabad", "amravati", "chandrapur", "gadchiroli", "jalgaon", "wardha", "yavatmal"] else "India",
                latitude=coords[0],
                longitude=coords[1],
                coverage_status=status,
            ))

        active_count = sum(1 for item in items if item.coverage_status == "BENCHMARK_ACTIVE")
        return DistrictListResponse(
            total_districts=len(items),
            active_districts=active_count,
            districts=items,
            data_status=settings.DATA_STATUS,
        )

    @staticmethod
    def get_district_forecast(district_id: str) -> DistrictForecastResponse:
        """
        Returns real forecast for districts with verified data.
        Returns a transparent 'unavailable' message for districts without active sensor/benchmark data.
        NEVER fabricates weather values.
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
                data_status=settings.DATA_STATUS,
            )

        # Pune Benchmark Station is the active verified point station
        if "pune" in normalized_id:
            # Load real test sample predictors from verified trace
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
                        data_status=settings.DATA_STATUS,
                    )

                X_test = pd.read_csv(x_test_path)
                df_det = pd.read_csv(trace_path)
                
                # Use the latest test sample (June 30, 2024 held-out test sample)
                latest_features = X_test.iloc[[-1]]
                latest_raw_nwp = float(df_det.iloc[-1]["raw_nwp_rainfall"])
                sample_time = str(df_det.iloc[-1].get("timestamp", "2024-07-01 00:00:00+00:00"))
                
                combined_fcst = PredictionService.predict_combined_forecast(latest_features, latest_raw_nwp)
                combined_fcst.forecast_mode = "HISTORICAL_BENCHMARK"
                combined_fcst.sample_timestamp = sample_time
                combined_fcst.data_status = settings.DATA_STATUS

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
                    data_status=settings.DATA_STATUS,
                )
            except Exception as e:
                logger.error(f"Unexpected error loading Pune benchmark forecast: {e}", exc_info=True)
                raise RuntimeError(f"Internal error loading Pune benchmark forecast: {e}")

        # For all other districts: transparently declare district-level data unavailable
        return DistrictForecastResponse(
            district_id=normalized_id,
            name=matched_name,
            latitude=matched_coords[0],
            longitude=matched_coords[1],
            coverage_status="DATA_UNAVAILABLE",
            forecast_mode="DATA_UNAVAILABLE",
            sample_timestamp=None,
            forecast=None,
            message=f"District-level data unavailable for '{matched_name}'. Real forecast data is currently available only for the PUNE BENCHMARK STATION at 18.50°N, 73.80°E (station-level benchmark). Forecasts are not fabricated.",
            data_status=settings.DATA_STATUS,
        )
