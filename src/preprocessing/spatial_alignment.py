"""
Spatial alignment module for mapping gridded NWP forecasts to IMD district geometries.
"""
from typing import Optional, List, Tuple
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point


class SpatialAligner:
    """Performs geometric point-in-polygon aggregation between NWP grid points and IMD districts."""

    def __init__(self, district_gdf: gpd.GeoDataFrame):
        self.district_gdf = district_gdf.copy()
        if "district_name" not in self.district_gdf.columns:
            if "DISTRICT" in self.district_gdf.columns:
                self.district_gdf["district_name"] = self.district_gdf["DISTRICT"].str.strip().str.upper()
            elif "NAME_2" in self.district_gdf.columns:
                self.district_gdf["district_name"] = self.district_gdf["NAME_2"].str.strip().str.upper()

        if self.district_gdf.crs is None:
            self.district_gdf = self.district_gdf.set_crs(epsg=4326)

    def assign_grid_points_to_districts(self, df_points: pd.DataFrame) -> pd.DataFrame:
        """
        Performs spatial join between GFS grid points (latitude, longitude) and district polygons.
        """
        if df_points.empty:
            return pd.DataFrame()

        # Create Point geometries
        geometry = [Point(xy) for xy in zip(df_points["longitude"], df_points["latitude"])]
        gdf_points = gpd.GeoDataFrame(df_points, geometry=geometry, crs="EPSG:4326")

        # Spatial join with districts
        joined = gpd.sjoin(
            gdf_points,
            self.district_gdf[["district_name", "geometry"]],
            how="inner",
            predicate="intersects"
        )

        return pd.DataFrame(joined.drop(columns=["geometry", "index_right"]))

    def aggregate_grid_to_district(
        self,
        df_grid_daily: pd.DataFrame,
        value_cols: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """
        Aggregates gridded daily forecasts into district-level forecasts.
        """
        if df_grid_daily.empty:
            return pd.DataFrame()

        matched = self.assign_grid_points_to_districts(df_grid_daily)
        if matched.empty:
            return pd.DataFrame()

        if value_cols is None:
            value_cols = [
                c for c in matched.columns
                if c not in ["district_name", "latitude", "longitude", "observation_date", "forecast_lead_time_days"]
                and pd.api.types.is_numeric_dtype(matched[c])
            ]

        group_cols = ["district_name", "observation_date", "forecast_lead_time_days"]
        agg_map = {col: "mean" for col in value_cols}

        df_district = matched.groupby(group_cols).agg(agg_map).reset_index()
        return df_district
