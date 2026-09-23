"""
Metadata provenance tracking module for ingested meteorological datasets.
"""
import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional


class ObservationMetadataTracker:
    """Records and persists provenance metadata for all ingested datasets."""

    def __init__(self, metadata_dir: str = "data/metadata"):
        self.metadata_dir = metadata_dir
        os.makedirs(self.metadata_dir, exist_ok=True)

    def record_provenance(
        self,
        dataset_name: str,
        provider: str,
        source_url: str,
        spatial_resolution: str,
        temporal_resolution: str,
        variables: list,
        units: Dict[str, str],
        record_count: int,
        raw_filepath: str,
        processed_filepath: Optional[str] = None,
        notes: str = ""
    ) -> Dict[str, Any]:
        """Creates and saves a structured provenance record."""
        record = {
            "dataset_name": dataset_name,
            "provider": provider,
            "source_url": source_url,
            "ingestion_timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "spatial_resolution": spatial_resolution,
            "temporal_resolution": temporal_resolution,
            "variables": variables,
            "units": units,
            "record_count": record_count,
            "raw_filepath": raw_filepath,
            "processed_filepath": processed_filepath,
            "notes": notes
        }

        clean_name = dataset_name.lower().replace(" ", "_").replace("/", "_")
        target_path = os.path.join(self.metadata_dir, f"{clean_name}_provenance.json")
        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(record, f, indent=2)

        return record
