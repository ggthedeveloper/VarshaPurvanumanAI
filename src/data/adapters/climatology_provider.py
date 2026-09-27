"""
IMD Climatological Normal and Rainfall Anomaly Provider (SIH26080).
Provides Long Period Average (LPA) normals for monsoon months (June-September)
enabling scientific rainfall anomaly computation (Observation / Forecast - Climatology).
"""
from typing import Dict, Any, Optional, Tuple
from src.data.base_provider import ClimatologyProvider


class IMD_Climatology_Provider(ClimatologyProvider):
    """
    Supplies district-level climatological daily and monthly rainfall normals.
    Based on IMD 1981-2010 / 1971-2020 Long Period Averages (LPA).
    """

    # Representative Peninsular / Western Ghats / Core Monsoon Zone Daily Climatological Normals (mm/day)
    # Source: IMD Rainfall Statistics of India & District Climatological Tables
    REGIONAL_DAILY_NORMALS: Dict[str, Dict[int, float]] = {
        # Month: 6 (June), 7 (July), 8 (August), 9 (September)
        "PUNE": {6: 5.2, 7: 6.8, 8: 4.6, 9: 4.1},
        "RAYGAD": {6: 22.4, 7: 38.5, 8: 26.1, 9: 14.8},
        "THANE": {6: 18.6, 7: 32.1, 8: 21.4, 9: 11.9},
        "SATARA": {6: 6.8, 7: 10.4, 8: 7.2, 9: 5.5},
        "RATNAGIRI": {6: 28.5, 7: 42.0, 8: 27.6, 9: 16.2},
        "AHAMEDNAGAR": {6: 3.8, 7: 4.2, 8: 3.5, 9: 5.1},
        "DEFAULT_MONSOON": {6: 5.5, 7: 8.5, 8: 7.0, 9: 5.0},
    }

    def get_climatological_normal(
        self,
        district_id: str,
        month: int,
        day: Optional[int] = None,
    ) -> Optional[float]:
        """Returns daily rainfall normal in mm."""
        norm_key = district_id.upper().replace("-", "_").split("_")[-1]
        normals = self.REGIONAL_DAILY_NORMALS.get(norm_key, self.REGIONAL_DAILY_NORMALS["DEFAULT_MONSOON"])
        return normals.get(month, self.REGIONAL_DAILY_NORMALS["DEFAULT_MONSOON"].get(month, 5.0))

    def get_monthly_normal(self, district_id: str, month: int) -> float:
        """Returns monthly normal in mm (daily normal * 30.5)."""
        daily = self.get_climatological_normal(district_id, month) or 5.0
        return round(daily * 30.0, 1)

    def compute_anomaly(
        self,
        district_id: str,
        actual_rainfall_mm: float,
        month: int,
    ) -> Tuple[float, float, str]:
        """Returns (anomaly_mm, departure_pct, imd_category) based on monthly normal."""
        normal = self.get_monthly_normal(district_id, month)
        if normal <= 0:
            return 0.0, 0.0, "NORMAL"
        anom = round(actual_rainfall_mm - normal, 2)
        dep = round(((actual_rainfall_mm - normal) / normal) * 100.0, 1)
        if dep >= 60.0:
            cat = "LARGE_EXCESS"
        elif dep >= 20.0:
            cat = "EXCESS"
        elif dep >= -19.0:
            cat = "NORMAL"
        elif dep >= -59.0:
            cat = "DEFICIENT"
        elif actual_rainfall_mm == 0.0:
            cat = "LARGE_DEFICIENT"
        else:
            cat = "LARGE_DEFICIENT"
        return anom, dep, cat

    def compute_rainfall_anomaly(
        self,
        rainfall_mm: float,
        district_id: str,
        month: int,
    ) -> Dict[str, Any]:
        """
        Computes absolute anomaly (mm) and percentage departure (%) from IMD normal:
        Departure (%) = ((Rainfall - Normal) / Normal) * 100
        IMD Standard Classification:
        - Large Excess: >= +60%
        - Excess: +20% to +59%
        - Normal: -19% to +19%
        - Deficient: -59% to -20%
        - Large Deficient: <= -60%
        - No Rain: -100%
        """
        normal = self.get_climatological_normal(district_id, month)
        if normal is None or normal <= 0:
            return {
                "normal_mm": None,
                "anomaly_mm": None,
                "percentage_departure": None,
                "imd_departure_category": "UNAVAILABLE",
            }

        anomaly_mm = round(rainfall_mm - normal, 2)
        pct_departure = round(((rainfall_mm - normal) / normal) * 100.0, 1)

        if pct_departure >= 60.0:
            category = "LARGE_EXCESS"
        elif pct_departure >= 20.0:
            category = "EXCESS"
        elif pct_departure >= -19.0:
            category = "NORMAL"
        elif pct_departure >= -59.0:
            category = "DEFICIENT"
        elif rainfall_mm == 0.0:
            category = "NO_RAIN"
        else:
            category = "LARGE_DEFICIENT"

        return {
            "normal_mm": normal,
            "anomaly_mm": anomaly_mm,
            "percentage_departure": pct_departure,
            "imd_departure_category": category,
        }
