"""
Spatial District Aggregation Engine for VarshaPurvanumanAI (SIH26080).
Implements area-weighted polygon-grid intersection, multi-cell statistics,
spatial rainfall coverage, and IMD-aligned threshold warnings.
"""
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import box, Point, Polygon, MultiPolygon

from src.data.adapters.boundary_provider import IndiaDistrictBoundaryProvider


class SpatialDistrictAggregator:
    """
    Computes rigorous spatial aggregations of gridded NWP and AI-corrected
    rainfall forecasts over administrative district polygons.
    """

    def __init__(self, boundary_provider: Optional[IndiaDistrictBoundaryProvider] = None):
        self.boundary_provider = boundary_provider or IndiaDistrictBoundaryProvider.get_instance()

    @staticmethod
    def classify_warning_category(max_rainfall_mm: float, prob_heavy: float = 0.0) -> Dict[str, str]:
        """
        Determines advisory warning level following IMD rainfall thresholds.
        Strictly labels as MODEL PROBABILITY ADVISORY, not official government warning.
        """
        if max_rainfall_mm >= 115.6 or prob_heavy >= 0.70:
            return {
                "level": "RED_WARNING",
                "color": "#ef4444",
                "label": "Take Action (Very Heavy Rain Likely)",
                "imd_threshold_category": "VERY_HEAVY_RAIN",
            }
        elif max_rainfall_mm >= 64.5 or prob_heavy >= 0.40:
            return {
                "level": "ORANGE_ALERT",
                "color": "#f97316",
                "label": "Be Prepared (Heavy Rain Likely)",
                "imd_threshold_category": "HEAVY_RAIN",
            }
        elif max_rainfall_mm >= 15.6 or prob_heavy >= 0.20:
            return {
                "level": "YELLOW_WATCH",
                "color": "#eab308",
                "label": "Be Updated (Moderate Rain Likely)",
                "imd_threshold_category": "MODERATE_RAIN",
            }
        else:
            return {
                "level": "GREEN_NO_WARNING",
                "color": "#10b981",
                "label": "No Warning (Light / Dry)",
                "imd_threshold_category": "LIGHT_OR_DRY",
            }

    @staticmethod
    def calculate_confidence(
        regime_probs: Dict[str, float],
        spatial_spread_mm: float,
        mean_rainfall_mm: float
    ) -> Dict[str, Any]:
        """
        Calculates forecast confidence level (HIGH, MEDIUM, LOW) based on:
        1. Weather regime certainty (max class probability)
        2. Spatial coefficient of variation across district cells
        """
        max_reg_prob = max(regime_probs.values()) if regime_probs else 0.5
        cv = (spatial_spread_mm / (mean_rainfall_mm + 1.0))

        # Scoring index [0, 1]
        score = (max_reg_prob * 0.6) + (max(0.0, 1.0 - min(cv, 1.0)) * 0.4)

        if score >= 0.70:
            level = "HIGH"
        elif score >= 0.45:
            level = "MEDIUM"
        else:
            level = "LOW"

        return {
            "level": level,
            "score": round(score, 3),
            "regime_certainty": round(max_reg_prob, 3),
            "spatial_coherence": round(max(0.0, 1.0 - min(cv, 1.0)), 3),
        }

    def aggregate_grid_to_district(
        self,
        district_id: str,
        grid_cells: pd.DataFrame,
        cell_size_deg: float = 0.25,
    ) -> Optional[Dict[str, Any]]:
        """
        Performs polygon-grid spatial intersection and computes area-weighted statistics.

        Parameters:
        -----------
        district_id : str
            Unique district identifier.
        grid_cells : pd.DataFrame
            DataFrame of intersecting or regional cells with columns:
            ['latitude', 'longitude', 'raw_nwp_rainfall', 'corrected_rainfall', ...].
        cell_size_deg : float
            NWP grid resolution (default: 0.25 degrees).

        Returns:
        --------
        Dictionary of comprehensive spatial district statistics.
        """
        poly_gdf = self.boundary_provider.get_district_polygon(district_id)
        if poly_gdf is None or poly_gdf.empty:
            return None

        district_geom = poly_gdf.geometry.iloc[0]
        district_name = str(poly_gdf["district_name"].iloc[0])
        state_name = str(poly_gdf["state_name"].iloc[0])

        if isinstance(grid_cells, list):
            grid_cells = pd.DataFrame(grid_cells)

        if grid_cells is None or grid_cells.empty:
            return None

        # Build bounding boxes for candidate grid cells
        half_res = cell_size_deg / 2.0
        intersecting_rows = []
        weights = []

        for idx, row in grid_cells.iterrows():
            lat = float(row["latitude"])
            lon = float(row["longitude"])
            c_box = box(lon - half_res, lat - half_res, lon + half_res, lat + half_res)

            if district_geom.intersects(c_box):
                inter = district_geom.intersection(c_box)
                area = inter.area
                if area > 0:
                    intersecting_rows.append(row)
                    weights.append(area)

        if not intersecting_rows:
            # Fallback to nearest cell if polygon is smaller than 0.25 degree cell
            c_lat = float(poly_gdf["latitude"].iloc[0])
            c_lon = float(poly_gdf["longitude"].iloc[0])
            dists = np.hypot(grid_cells["latitude"] - c_lat, grid_cells["longitude"] - c_lon)
            if dists.min() > 2.0:
                # Far away non-intersecting grid
                return {
                    "district_id": district_id,
                    "district_name": district_name,
                    "state_name": state_name,
                    "grid_cells_intersected": 0,
                    "mean_rainfall_mm": 0.0,
                    "raw_nwp_mean_mm": 0.0,
                    "min_rainfall_mm": 0.0,
                    "max_rainfall_mm": 0.0,
                    "median_rainfall_mm": 0.0,
                    "percentile_10_mm": 0.0,
                    "percentile_50_mm": 0.0,
                    "percentile_75_mm": 0.0,
                    "percentile_90_mm": 0.0,
                    "spatial_coverage_pct": 0.0,
                    "area_exceeding_thresholds_pct": {
                        "light_2_5mm": 0.0,
                        "moderate_15_6mm": 0.0,
                        "heavy_64_5mm": 0.0,
                        "very_heavy_115_6mm": 0.0,
                    },
                    "warning_category": {
                        "level": "GREEN_NO_WARNING",
                        "color": "#10b981",
                        "label": "No Warning / Clear Weather",
                    },
                    "cell_intersections": [],
                }

            best_idx = dists.idxmin()
            intersecting_rows.append(grid_cells.loc[best_idx])
            weights.append(1.0)

        df_sub = pd.DataFrame(intersecting_rows)
        weights = np.array(weights, dtype=float)
        norm_weights = weights / np.sum(weights)

        raw_col = "raw_nwp_rainfall" if "raw_nwp_rainfall" in df_sub.columns else ("raw_nwp_rainfall_mm" if "raw_nwp_rainfall_mm" in df_sub.columns else "nwp_rainfall")
        corr_col = "corrected_rainfall" if "corrected_rainfall" in df_sub.columns else ("corrected_rainfall_mm" if "corrected_rainfall_mm" in df_sub.columns else "observed_rainfall")

        raw_vals = df_sub[raw_col].values.astype(float)
        corr_vals = df_sub[corr_col].values.astype(float)

        # Weighted Mean
        mean_raw = float(np.sum(raw_vals * norm_weights))
        mean_corr = float(np.sum(corr_vals * norm_weights))

        # Spatial Extrema & Percentiles
        max_corr = float(np.max(corr_vals))
        min_corr = float(np.min(corr_vals))
        median_corr = float(np.median(corr_vals))
        p10 = float(np.percentile(corr_vals, 10))
        p50 = float(np.percentile(corr_vals, 50))
        p75 = float(np.percentile(corr_vals, 75))
        p90 = float(np.percentile(corr_vals, 90))

        # Coverage percentage: Area with rainfall >= 0.1 mm
        wet_mask = corr_vals >= 0.1
        spatial_coverage_pct = float(np.sum(norm_weights[wet_mask]) * 100.0) if np.any(wet_mask) else 0.0
        affected_cells_pct = float(np.sum(wet_mask) / len(wet_mask) * 100.0)

        # Spatial spread
        spatial_std = float(np.sqrt(np.sum(norm_weights * (corr_vals - mean_corr) ** 2)))

        # Threshold exceedance (% of district area)
        thresholds = {
            "light_2_5mm": 2.5,
            "moderate_15_6mm": 15.6,
            "heavy_64_5mm": 64.5,
            "very_heavy_115_6mm": 115.6,
        }
        area_exceeding_thresholds_pct = {}
        for k, thresh in thresholds.items():
            mask = corr_vals >= thresh
            area_exceeding_thresholds_pct[k] = round(float(np.sum(norm_weights[mask]) * 100.0) if np.any(mask) else 0.0, 1)

        # IMD Warning Category determination
        if area_exceeding_thresholds_pct["very_heavy_115_6mm"] > 0 or max_corr >= 204.4:
            warning_category = {"level": "RED_WARNING", "color": "#ef4444", "label": "Red Warning: Take Action"}
        elif area_exceeding_thresholds_pct["heavy_64_5mm"] > 10.0 or max_corr >= 64.5:
            warning_category = {"level": "ORANGE_ALERT", "color": "#f97316", "label": "Orange Alert: Be Prepared"}
        elif area_exceeding_thresholds_pct["moderate_15_6mm"] > 25.0 or max_corr >= 15.6:
            warning_category = {"level": "YELLOW_WATCH", "color": "#eab308", "label": "Yellow Watch: Be Updated"}
        else:
            warning_category = {"level": "GREEN_NO_WARNING", "color": "#10b981", "label": "Green: No Warning"}

        cell_intersections = []
        for i, row in enumerate(intersecting_rows):
            cell_intersections.append({
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "effective_weight": float(norm_weights[i]),
            })

        return {
            "district_id": district_id,
            "district_name": district_name,
            "state_name": state_name,
            "centroid_latitude": float(poly_gdf["latitude"].iloc[0]),
            "centroid_longitude": float(poly_gdf["longitude"].iloc[0]),
            "grid_cells_intersected": len(df_sub),
            "mean_rainfall_mm": round(mean_corr, 2),
            "area_weighted_mean_raw_mm": round(mean_raw, 2),
            "area_weighted_mean_corrected_mm": round(mean_corr, 2),
            "raw_nwp_mean_mm": round(mean_raw, 2),
            "min_rainfall_mm": round(min_corr, 2),
            "max_rainfall_mm": round(max_corr, 2),
            "median_rainfall_mm": round(median_corr, 2),
            "spatial_median_mm": round(median_corr, 2),
            "spatial_min_mm": round(min_corr, 2),
            "spatial_max_mm": round(max_corr, 2),
            "percentile_10_mm": round(p10, 2),
            "percentile_50_mm": round(p50, 2),
            "percentile_75_mm": round(p75, 2),
            "percentile_90_mm": round(p90, 2),
            "spatial_std_mm": round(spatial_std, 2),
            "spatial_coverage_pct": round(spatial_coverage_pct, 1),
            "affected_cells_pct": round(affected_cells_pct, 1),
            "area_exceeding_thresholds_pct": area_exceeding_thresholds_pct,
            "warning_category": warning_category,
            "cell_intersections": cell_intersections,
            "aggregation_method": "AREA_WEIGHTED_POLYGON_INTERSECTION",
        }
