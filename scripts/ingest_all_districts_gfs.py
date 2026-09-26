"""
Batch Ingestion Script for SIH26080 / VarshaPurvanumanAI.
Ingests authentic NOAA GFS 0.25° NWP forecasts for all 81 Indian administrative districts
via the Open-Meteo GFS seamless archive.
Enforces zero synthetic data policy: all values are directly retrieved from NOAA GFS.
"""
import time
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from concurrent.futures import ThreadPoolExecutor, as_completed
from src.ingestion.observations.imd_district.district_centroids import OFFICIAL_DISTRICT_COORDINATES
from src.ingestion.gfs.downloader import GFSDownloader
from backend.app.services.district_service import DistrictService


def ingest_all_districts():
    print("=" * 70)
    print("NOAA GFS 0.25° Operational Forecast Batch Ingestion for All Districts")
    print("=" * 70)

    dl = GFSDownloader(output_dir="data/raw/gfs", timeout=20)

    # Find unique coordinates that don't have a file within 0.5 degrees
    coords_to_fetch = set()
    district_map = {}
    for name, (lat, lon) in OFFICIAL_DISTRICT_COORDINATES.items():
        f = DistrictService._find_raw_gfs_file(lat, lon, max_dist_deg=0.5)
        if not f:
            coords_to_fetch.add((lat, lon))
            district_map.setdefault((lat, lon), []).append(name)
        else:
            print(f"[CACHED] {name} ({lat:.2f}N, {lon:.2f}E) -> {os.path.basename(f)}")

    print(f"\nTotal unique coordinates to download: {len(coords_to_fetch)}")

    if not coords_to_fetch:
        print("All districts already have verified GFS raw files!")
        return

    def fetch_one(coord):
        lat, lon = coord
        names = district_map.get(coord, ["Unknown"])
        t0 = time.time()
        try:
            df = dl.fetch_point_forecast(
                latitude=lat,
                longitude=lon,
                start_date="2024-06-06",
                end_date="2024-06-07",
                lead_time_days=1,
                models="gfs_seamless",
                save_raw=True,
            )
            elapsed = time.time() - t0
            return (True, names, lat, lon, len(df), elapsed, None)
        except Exception as e:
            elapsed = time.time() - t0
            return (False, names, lat, lon, 0, elapsed, str(e))

    successful = 0
    failed = 0
    t_start = time.time()

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(fetch_one, c): c for c in sorted(coords_to_fetch)}
        for future in as_completed(futures):
            ok, names, lat, lon, rows, elapsed, err = future.result()
            names_str = ", ".join(names[:2])
            if ok:
                successful += 1
                print(f"[{successful + failed}/{len(coords_to_fetch)}] OK ({elapsed:.2f}s): {names_str} ({lat:.2f}N, {lon:.2f}E) - {rows} hourly steps")
            else:
                failed += 1
                print(f"[{successful + failed}/{len(coords_to_fetch)}] FAILED ({elapsed:.2f}s): {names_str} ({lat:.2f}N, {lon:.2f}E) - Error: {err}")

    total_time = time.time() - t_start
    print(f"\nFinished in {total_time:.2f}s. Successful: {successful}, Failed: {failed}")


if __name__ == "__main__":
    ingest_all_districts()
