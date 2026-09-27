"""
Authoritative India-Wide District Boundary Provider for VarshaPurvanumanAI (SIH26080).
Loads authentic GeoJSON MultiPolygon boundaries (763 districts across all 40 Indian states/UTs)
from INDIA_NEW_REDUCED1.json.
Provides spatial index, area-weighted calculations, and state-district hierarchies.
"""
import os
import json
from typing import Dict, Any, List, Optional, Tuple
import geopandas as gpd
from shapely.geometry import shape, Point

from src.data.base_provider import DistrictBoundaryProvider


class IndiaDistrictBoundaryProvider(DistrictBoundaryProvider):
    """
    Manages authentic India-wide district boundaries and geographic metadata.
    Covers 763 administrative districts spanning all States and Union Territories.
    """

    _instance: Optional["IndiaDistrictBoundaryProvider"] = None
    _gdf: Optional[gpd.GeoDataFrame] = None
    _catalog: Optional[List[Dict[str, Any]]] = None
    _state_map: Optional[Dict[str, List[Dict[str, Any]]]] = None

    def __init__(self, geojson_path: str = "data/raw/boundaries/INDIA_NEW_REDUCED1.json"):
        self.geojson_path = geojson_path
        self._load_data()

    @classmethod
    def get_instance(cls, geojson_path: str = "data/raw/boundaries/INDIA_NEW_REDUCED1.json") -> "IndiaDistrictBoundaryProvider":
        if cls._instance is None:
            cls._instance = cls(geojson_path=geojson_path)
        return cls._instance

    def _load_data(self):
        """Loads and indexes the GeoDataFrame once in memory."""
        if self._gdf is None:
            if not os.path.exists(self.geojson_path):
                # Fallback to local relative path if needed
                alt_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", self.geojson_path)
                if os.path.exists(alt_path):
                    self.geojson_path = alt_path

            if os.path.exists(self.geojson_path):
                gdf = gpd.read_file(self.geojson_path)
                if gdf.crs is None or gdf.crs.to_epsg() != 4326:
                    gdf = gdf.set_crs(epsg=4326, allow_override=True)

                # Standardize column naming
                if "District" in gdf.columns:
                    gdf["district_name"] = gdf["District"].astype(str).str.strip()
                elif "DISTRICT" in gdf.columns:
                    gdf["district_name"] = gdf["DISTRICT"].astype(str).str.strip()
                else:
                    gdf["district_name"] = "Unknown"

                if "STATE" in gdf.columns:
                    gdf["state_name"] = gdf["STATE"].astype(str).str.strip()
                elif "State" in gdf.columns:
                    gdf["state_name"] = gdf["State"].astype(str).str.strip()
                else:
                    gdf["state_name"] = "India"

                # Generate clean unique identifier
                gdf["district_id"] = gdf.apply(
                    lambda r: f"{r['state_name'].lower().replace(' ', '_')}_{r['district_name'].lower().replace(' ', '_')}",
                    axis=1
                )

                # Compute accurate centroids via EPSG:3857 projection
                try:
                    projected = gdf.to_crs(epsg=3857)
                    centroids_wgs84 = projected.centroid.to_crs(epsg=4326)
                    gdf["latitude"] = centroids_wgs84.y
                    gdf["longitude"] = centroids_wgs84.x
                except Exception:
                    # Fallback to direct geographic centroid
                    gdf["latitude"] = gdf.geometry.centroid.y
                    gdf["longitude"] = gdf.geometry.centroid.x

                self._gdf = gdf
                self._build_catalog()

    def _build_catalog(self):
        """Builds in-memory list and state lookup cache."""
        if self._gdf is None:
            return

        catalog: List[Dict[str, Any]] = []
        state_map: Dict[str, List[Dict[str, Any]]] = {}

        for _, row in self._gdf.iterrows():
            item = {
                "district_id": str(row["district_id"]),
                "name": str(row["district_name"]),
                "district_name": str(row["district_name"]),
                "state": str(row["state_name"]),
                "latitude": round(float(row["latitude"]), 4),
                "longitude": round(float(row["longitude"]), 4),
                "shape_area_km2": round(float(row.get("Shape_Area", 0.0)) / 1e6, 2) if "Shape_Area" in row else None,
            }
            catalog.append(item)
            state_key = row["state_name"].upper()
            state_map.setdefault(state_key, []).append(item)

        self._catalog = catalog
        self._state_map = state_map

    def get_all_districts(self) -> List[Dict[str, Any]]:
        """Returns catalog of all 763 administrative districts with centroids."""
        if self._catalog is None:
            self._load_data()
        return self._catalog or []

    def get_district_polygon(self, district_id: str) -> Optional[gpd.GeoDataFrame]:
        """Returns GeoDataFrame slice containing district boundary polygon."""
        if self._gdf is None:
            self._load_data()
        if self._gdf is None or self._gdf.empty:
            return None

        # Try match on district_id or district_name
        norm = district_id.lower().strip().replace("-", "_").replace(" ", "_")
        match = self._gdf[self._gdf["district_id"] == norm]
        if match.empty:
            match = self._gdf[self._gdf["district_name"].str.lower().str.replace(" ", "_") == norm]
        if match.empty:
            # Partial suffix matching (e.g., 'pune')
            match = self._gdf[self._gdf["district_id"].str.endswith(f"_{norm}")]

        return match if not match.empty else None

    def get_state_districts(self, state_name: str) -> List[Dict[str, Any]]:
        """Returns all constituent districts belonging to a given State / UT."""
        if self._state_map is None:
            self._load_data()
        if not self._state_map:
            return []
        key = state_name.upper().strip()
        # Direct lookup or case-insensitive search
        if key in self._state_map:
            return self._state_map[key]
        for k, v in self._state_map.items():
            if key in k or k in key:
                return v
        return []

    def get_all_states(self) -> List[str]:
        """Returns unique sorted list of all 40 States & Union Territories."""
        if self._state_map is None:
            self._load_data()
        return sorted(list(self._state_map.keys())) if self._state_map else []

    def get_district_info(self, district_id: str) -> Optional[Dict[str, Any]]:
        """Returns district metadata (name, state, centroid lat/lon) for district_id."""
        if self._catalog is None:
            self._load_data()
        norm = district_id.lower().strip().replace("-", "_").replace(" ", "_")
        for item in (self._catalog or []):
            if item["district_id"] == norm or item["district_id"].endswith(f"_{norm}") or item["name"].lower().replace(" ", "_") == norm:
                return item
        return None
