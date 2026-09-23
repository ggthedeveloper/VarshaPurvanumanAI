"""
Boundary reader for official IMD District vector polygons.
"""
import os
import json
import geopandas as gpd
import pandas as pd


class IMDDistrictBoundaryReader:
    """Reads and manages official IMD district boundary geometries."""

    LOCAL_PATH = "data/raw/boundaries/INDIA_NEW_REDUCED1.json"

    def __init__(self, filepath: str = LOCAL_PATH):
        self.filepath = filepath

    def load_boundaries(self) -> gpd.GeoDataFrame:
        """Loads boundary polygons into a GeoDataFrame with calculated centroids."""
        if not os.path.exists(self.filepath):
            raise FileNotFoundError(f"Boundary file not found at: {self.filepath}")

        gdf = gpd.read_file(self.filepath)

        # Standardize district name column
        if "District" in gdf.columns:
            gdf["district_name"] = gdf["District"].str.strip().str.upper()
        elif "DISTRICT" in gdf.columns:
            gdf["district_name"] = gdf["DISTRICT"].str.strip().str.upper()
        elif "NAME_2" in gdf.columns:
            gdf["district_name"] = gdf["NAME_2"].str.strip().str.upper()

        # Ensure CRS is EPSG:4326
        if gdf.crs is None:
            gdf = gdf.set_crs(epsg=4326)
        elif gdf.crs.to_epsg() != 4326:
            gdf = gdf.to_crs(epsg=4326)

        # Compute centroid coordinates
        centroids = gdf.geometry.centroid
        gdf["centroid_lon"] = centroids.x
        gdf["centroid_lat"] = centroids.y

        return gdf
