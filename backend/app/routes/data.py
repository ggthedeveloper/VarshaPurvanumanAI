"""
Dataset Provenance & Acquisition Route Handlers for VarshaPurvanumanAI.
Provides API access to real-time status and verification of the 4 required datasets:
1. IMD Gridded Rainfall (0.25° & 0.1°)
2. NOAA GFS Forecasts (0.25°)
3. IMD Cyclone & Monsoon Reports (Synoptic Regimes)
4. India District GeoJSON (INDIA_NEW_REDUCED1.json)
"""
from fastapi import APIRouter
from scripts.acquire_datasets import get_all_datasets_status, check_url_connectivity

router = APIRouter(prefix="/api/data", tags=["Data Acquisition & Provenance"])


@router.get("/datasets-status", summary="Authoritative acquisition status of the 4 required datasets")
def get_datasets_status():
    """
    Returns the real-time acquisition, ingestion, and validation status of all 4 datasets
    specified in the SIH problem statement and meteorological requirements.
    """
    return get_all_datasets_status()


@router.get("/connectivity", summary="Live connectivity test to official meteorological portals")
def check_portals_connectivity():
    """
    Tests live network reachability to:
    - Open-Meteo GFS API / NOAA NOMADS
    - IMD Mausam National Portal
    - RSMC New Delhi Cyclone Reports
    - IMD Pune National Data Centre (NDC)
    """
    portals = [
        ("NOAA GFS Forecast API (0.25°)", "https://previous-runs-api.open-meteo.com/v1/forecast?latitude=18.52&longitude=73.86&hourly=precipitation&models=gfs_seamless"),
        ("IMD Mausam National Portal", "https://mausam.imd.gov.in/"),
        ("RSMC New Delhi Cyclone Reports", "https://rsmcnewdelhi.imd.gov.in/"),
        ("IMD Pune NDC (Binary Gridded)", "https://imdpune.gov.in/cmpg/Griddata/Rainfall_25_Bin.html"),
    ]
    results = []
    for name, url in portals:
        res = check_url_connectivity(url, timeout=4)
        res["portal_name"] = name
        results.append(res)
    return {"portals": results}
