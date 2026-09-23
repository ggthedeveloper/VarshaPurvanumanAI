"""
Parser for IMD District Rainfall observation bulletins.
"""
import re
import json
from typing import List, Dict, Any, Optional
import pandas as pd
from .validator import IMDDistrictValidator


class IMDDistrictParser:
    """Parses raw IMD HTML and embedded JSON records into clean DataFrames."""

    BALLOON_DATE_RE = re.compile(r"Date\s*:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})")
    BALLOON_ACTUAL_RE = re.compile(r"Actual\s*:\s*([0-9\.]+)\s*mm", re.IGNORECASE)
    BALLOON_NORMAL_RE = re.compile(r"Normal\s*:\s*([0-9\.]+)\s*mm", re.IGNORECASE)
    BALLOON_DEP_RE = re.compile(r"Departure\s*:\s*([\+\-0-9]+)\s*%", re.IGNORECASE)

    @classmethod
    def parse_raw_records(cls, records: List[Dict[str, Any]]) -> pd.DataFrame:
        """Parses a list of district record dictionaries."""
        rows = []
        for r in records:
            title = r.get("title", "").strip().upper()
            d_id = str(r.get("id", "")).strip()
            balloon = r.get("balloonText", "")

            # Extract date
            date_m = cls.BALLOON_DATE_RE.search(balloon)
            obs_date = date_m.group(1) if date_m else None

            # Extract actual rainfall
            act_m = cls.BALLOON_ACTUAL_RE.search(balloon)
            actual_mm = float(act_m.group(1)) if act_m else float("nan")

            # Extract normal rainfall
            norm_m = cls.BALLOON_NORMAL_RE.search(balloon)
            normal_mm = float(norm_m.group(1)) if norm_m else float("nan")

            # Extract departure %
            dep_m = cls.BALLOON_DEP_RE.search(balloon)
            if dep_m:
                dep_pct = float(dep_m.group(1))
            else:
                # Try from 'info' field
                info_val = r.get("info", "")
                info_m = re.search(r"([\+\-0-9]+)%", str(info_val))
                dep_pct = float(info_m.group(1)) if info_m else float("nan")

            rows.append({
                "district_name": title,
                "district_id": d_id,
                "observation_date": obs_date,
                "actual_rainfall_mm": actual_mm,
                "normal_rainfall_mm": normal_mm,
                "departure_pct": dep_pct
            })

        df = pd.DataFrame(rows)
        return df

    @classmethod
    def extract_and_parse_html(cls, html_content: str) -> pd.DataFrame:
        """Finds embedded JSON array in IMD HTML page and parses it."""
        idx = html_content.find('"title":')
        if idx == -1:
            raise ValueError("No district rainfall data records found in HTML content.")

        start = html_content.rfind('[', 0, idx)
        end = html_content.find('\n]          },\n', idx)
        if end != -1:
            end += 2
        else:
            # Fallback array close
            end = html_content.find('];', idx) + 1

        json_str = html_content[start:end]
        records = json.loads(json_str)
        df = cls.parse_raw_records(records)

        is_valid, errors = IMDDistrictValidator.validate(df)
        if not is_valid:
            raise ValueError(f"Parsed IMD district DataFrame failed validation: {'; '.join(errors)}")

        return df
