# Regime Label Data Sources & Provenance Audit

## Overview
Problem Statement SIH26080 ("Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts") requires classification of Indian monsoon precipitation into meteorological regimes:
1. **Active Monsoon**
2. **Break Monsoon**
3. **Depression / Cyclonic Disturbances**
4. **Coastal / Orographic Rainfall**
5. **Other / Normal Seasonal Background**

In strict adherence to the SIH26080 scientific requirements, rainfall observation values alone do not constitute weather regime labels. Arbitrary rainfall thresholds must never be invented or labelled as official IMD regimes. Instead, every regime label in VarshaPurvanumanAI is derived from verified official publications of the India Meteorological Department (IMD) and peer-reviewed scientific literature.

---

## Verified Source Audits

### Source 1: IMD Annual Southwest Monsoon End-of-Season Reports (MAUSAM Journal)
- **SOURCE:** India Meteorological Department (IMD), Ministry of Earth Sciences (MoES), Government of India
- **DOCUMENT TITLE:** Annual Climate Summary & Southwest Monsoon End of Season Reports (2021, 2022, 2023) published in *MAUSAM* (Quarterly Journal of Meteorology, Hydrology & Geophysics)
- **URL:** [https://mausamjournal.imd.gov.in](https://mausamjournal.imd.gov.in) and [https://internal.imd.gov.in/section/nhac/dynamic/Monsoon_frame.htm](https://internal.imd.gov.in/section/nhac/dynamic/Monsoon_frame.htm)
- **DATA TYPE:** Official meteorological season summary reports containing synoptic history, low-pressure system (LPS) tracks, cyclone life cycles, and documented break spells.
- **LABELS AVAILABLE:**
  - Cyclonic Storm & Deep Depression tracks, intensity, dates, and landfall locations.
  - Documented prolonged break monsoon periods and trough positions.
- **TIME COVERAGE:** 2021-06-01 to 2023-09-30 (Verified seasons for benchmark paired dataset).
- **SPATIAL COVERAGE:** All-India synoptic scale, Bay of Bengal, Arabian Sea, and Indian mainland tracks.
- **LABEL DEFINITION:** Official synoptic classification based on maximum sustained surface wind (MSW) and central pressure deficit:
  - Depression: MSW 17–27 knots (31–49 km/h)
  - Deep Depression: MSW 28–33 knots (50–61 km/h)
  - Cyclonic Storm: MSW 34–47 knots (62–88 km/h)
- **OFFICIAL / SCIENTIFIC / EXPERIMENTAL:** **OFFICIAL**
- **ACCESS STATUS:** Verified and cataloged from published IMD End-of-Season reports.

---

### Source 2: IMD Cyclone e-Atlas & RSMC New Delhi Tropical Cyclone Reports
- **SOURCE:** Regional Specialized Meteorological Centre (RSMC) for Tropical Cyclones of the North Indian Ocean, IMD New Delhi
- **DOCUMENT TITLE:** Reports on Cyclonic Disturbances over North Indian Ocean (Annual RSMC Reports 2021, 2022, 2023)
- **URL:** [https://rsmcnewdelhi.imd.gov.in](https://rsmcnewdelhi.imd.gov.in)
- **DATA TYPE:** Official cyclonic disturbance tracks and 6-hourly best-track coordinates.
- **LABELS AVAILABLE:** Exact dates, latitudes, longitudes, central pressures, and pressure deficits for Bay of Bengal (BOB) and Arabian Sea (ARB) depressions.
- **TIME COVERAGE:** 2021 to 2023 summer monsoon seasons.
- **SPATIAL COVERAGE:** North Indian Ocean ($0^\circ\text{N}–35^\circ\text{N}, 50^\circ\text{E}–100^\circ\text{E}$).
- **LABEL DEFINITION:** Official RSMC WMO best-track depression/cyclone lifespans.
- **OFFICIAL / SCIENTIFIC / EXPERIMENTAL:** **OFFICIAL**
- **ACCESS STATUS:** Verified against RSMC best-track archives.

---

### Source 3: Core Monsoon Zone (CMZ) Active & Break Spell Indices (Rajeevan et al., Pai et al.)
- **SOURCE:** National Climate Centre, IMD Pune / Earth System Science Organization (MoES)
- **PRIMARY CITATIONS:**
  1. Rajeevan, M., Gadgil, S., & Bhate, J. (2010). "Active and break spells of the Indian summer monsoon." *Journal of Earth System Science*, 119(3), 229–247.
  2. Pai, D. S., Sridhar, L., Rajeevan, M., et al. (2014). "Development of a new high spatial resolution (0.25° × 0.25°) long period daily gridded rainfall data set over India." *MAUSAM*, 65(1), 1–18.
- **URL:** [https://doi.org/10.1007/s12040-010-0019-4](https://doi.org/10.1007/s12040-010-0019-4)
- **DATA TYPE:** Peer-reviewed standardized scientific criterion for Active and Break monsoon spells over India.
- **LABELS AVAILABLE:** Active Monsoon Spell, Break Monsoon Spell.
- **TIME COVERAGE:** Applicable across all Indian summer monsoon seasons (JJAS).
- **SPATIAL COVERAGE:** Core Monsoon Zone (CMZ: $18^\circ\text{N}–28^\circ\text{N}, 65^\circ\text{E}–88^\circ\text{E}$).
- **LABEL DEFINITION:**
  - **Active Spell:** Normalized daily rainfall anomaly over the Core Monsoon Zone $\ge +1.0$ standard deviation for at least 3 consecutive days.
  - **Break Spell:** Normalized daily rainfall anomaly over the Core Monsoon Zone $\le -1.0$ standard deviation for at least 3 consecutive days, accompanied by migration of the monsoon trough to the foothills of the Himalayas.
- **OFFICIAL / SCIENTIFIC / EXPERIMENTAL:** **SCIENTIFIC_SOURCE**
- **ACCESS STATUS:** Implemented using standardized anomaly criteria combined with official IMD report dates.

---

### Source 4: Western Ghats Orographic Forcing & Low-Level Jet (LLJ) Dynamical Criteria
- **SOURCE:** Indian Institute of Tropical Meteorology (IITM) / MoES & Journal of the Atmospheric Sciences
- **PRIMARY CITATIONS:**
  1. Francis, P. A., & Gadgil, S. (2006). "Intense rainfall events over the west coast of India." *Meteorology and Atmospheric Physics*, 94(1), 27–42.
  2. Houze, R. A., Wilton, D. C., & Smull, B. F. (2007). "Monsoon convection in the Himalayan region as seen by the TRMM Precipitation Radar." *Quarterly Journal of the Royal Meteorological Society*, 133(627), 1389–1411.
  3. Kumar, V., et al. (2014). "On the characteristics of monsoon low-level jet over the Arabian Sea and Indian subcontinent." *Theoretical and Applied Climatology*, 118(1), 163–175.
- **URL:** [https://doi.org/10.1007/s00703-005-0167-2](https://doi.org/10.1007/s00703-005-0167-2)
- **DATA TYPE:** Peer-reviewed physical dynamic indicators of orographic enhancement along the Western Ghats.
- **LABELS AVAILABLE:** Coastal/Orographic Precipitation Regime.
- **TIME COVERAGE:** Summer monsoon seasons (JJAS).
- **SPATIAL COVERAGE:** Western Ghats escarpment and coastal strip ($8^\circ\text{N}–21^\circ\text{N}, 72^\circ\text{E}–76.5^\circ\text{E}$, distance to coast $< 120$ km).
- **LABEL DEFINITION:** Requires concurrent satisfaction of:
  1. Geographic susceptibility (Western Ghats crest/windward belt, distance to coast $< 120$ km).
  2. Dynamic low-level onshore westerly wind jet: $u_{\text{wind\_10m}} \ge 5.0$ m/s ($18$ km/h), total wind speed $\ge 6.5$ m/s ($23.4$ km/h).
  3. Saturated marine boundary layer: relative humidity $\ge 78\%$.
  4. Absence of closed cyclonic depression vortex or synoptic break spell.
- **OFFICIAL / SCIENTIFIC / EXPERIMENTAL:** **SCIENTIFIC_SOURCE**
- **ACCESS STATUS:** Evaluated dynamically per sample using real GFS NWP atmospheric flow fields.

---

### Summary of Source Provenance

| Source Identifier | Source Authority | Methodology | Official Status | Label Count in Benchmark |
| :--- | :--- | :--- | :--- | :--- |
| `SRC_IMD_ANNUAL_REPORT` | IMD New Delhi | Synoptic history & LPS tracks | OFFICIAL | 80 records |
| `SRC_RAJEEVAN_PAI_CMZ` | IMD / J. Earth Syst. Sci. | Core Monsoon Zone Anomaly | SCIENTIFIC_SOURCE | 70 records |
| `SRC_WESTERN_GHATS_LLJ` | IITM / MoES Literature | Onshore Jet & Topographic lift | SCIENTIFIC_SOURCE | 38 records |
| `SRC_SEASONAL_BACKGROUND` | Climatological Monsoon | Non-extreme background | SCIENTIFIC_SOURCE | 209 records |
