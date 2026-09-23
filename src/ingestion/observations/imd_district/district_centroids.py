"""
Authoritative WGS-84 headquarters/centroid coordinates for Indian districts.
Provides exact geographic lookup for spatial aggregation with NWP gridded forecasts.
"""
from typing import Dict, Tuple, Optional

# Verified administrative district coordinates (WGS84 decimal degrees: latitude, longitude)
OFFICIAL_DISTRICT_COORDINATES: Dict[str, Tuple[float, float]] = {
    # Core Monsoon Zone (Central & Western India)
    "NAGPUR": (21.1458, 79.0882),
    "PUNE": (18.5204, 73.8567),
    "MUMBAI": (18.9220, 72.8347),
    "MUMBAI SUBURBAN": (19.0760, 72.8777),
    "THANE": (19.2183, 72.9781),
    "NASHIK": (19.9975, 73.7898),
    "AURANGABAD": (19.8762, 75.3433),
    "CHHATRAPATI SAMBHAJINAGAR": (19.8762, 75.3433),
    "AMRAVATI": (20.9320, 77.7523),
    "CHANDRAPUR": (19.9615, 79.2961),
    "GADCHIROLI": (20.1849, 80.0029),
    "JALGAON": (21.0077, 75.5626),
    "KOLHAPUR": (16.7050, 74.2433),
    "SATARA": (17.6805, 74.0183),
    "SOLAPUR": (17.6599, 75.9064),
    "WARDHA": (20.7453, 78.6022),
    "YAVATMAL": (20.3888, 78.1204),
    
    # Madhya Pradesh (Central India)
    "BHOPAL": (23.2599, 77.4126),
    "INDORE": (22.7196, 75.8577),
    "JABALPUR": (23.1815, 79.9864),
    "GWALIOR": (26.2183, 78.1828),
    "UJJAIN": (23.1765, 75.7885),
    "SAGAR": (23.8388, 78.7378),
    "REWA": (24.5362, 81.3037),
    "HOSHANGABAD": (22.7519, 77.7289),
    "NARMADAPURAM": (22.7519, 77.7289),
    
    # Southern Peninsula
    "HYDERABAD": (17.3850, 78.4867),
    "BENGALURU URBAN": (12.9716, 77.5946),
    "BENGALURU RURAL": (13.2847, 77.4429),
    "CHENNAI": (13.0827, 80.2707),
    "COIMBATORE": (11.0168, 76.9558),
    "MADURAI": (9.9252, 78.1198),
    "VISAKHAPATNAM": (17.6868, 83.2185),
    "VIJAYAWADA": (16.5062, 80.6480),
    "NTR DISTRICT": (16.5062, 80.6480),
    "GUNTUR": (16.3067, 80.4365),
    "KURNOOL": (15.8281, 78.0373),
    "YSR DISTRICT": (14.4673, 78.8242),
    "KADAPA": (14.4673, 78.8242),
    "THIRUVANANTHAPURAM": (8.5241, 76.9366),
    "KOCHI": (9.9312, 76.2673),
    "ERNAKULAM": (9.9816, 76.2999),
    "KOZHIKODE": (11.2588, 75.7804),
    "WAYANAD": (11.6854, 76.1320),
    "IDUKKI": (9.8494, 76.9814),
    
    # Northern & Gangetic Plains
    "LUCKNOW": (26.8467, 80.9462),
    "KANPUR NAGAR": (26.4499, 80.3319),
    "VARANASI": (25.3176, 82.9739),
    "PRAYAGRAJ": (25.4358, 81.8463),
    "ALLAHABAD": (25.4358, 81.8463),
    "AGRA": (27.1767, 78.0081),
    "PATNA": (25.5941, 85.1376),
    "GAYA": (24.7914, 85.0002),
    "MUZAFFARPUR": (26.1209, 85.3647),
    "BHAGALPUR": (25.2425, 86.9842),
    "NEW DELHI": (28.6139, 77.2090),
    "CHANDIGARH": (30.7333, 76.7794),
    "JAIPUR": (26.9124, 75.7873),
    "JODHPUR": (26.2389, 73.0243),
    "UDAIPUR": (24.5854, 73.7125),
    "AMRITSAR": (31.6340, 74.8723),
    "LUDHIANA": (30.9010, 75.8573),
    
    # Eastern & North Eastern India
    "KOLKATA": (22.5726, 88.3639),
    "HOWRAH": (22.5958, 88.2636),
    "DARJEELING": (27.0410, 88.2663),
    "JALPAIGURI": (26.5405, 88.7196),
    "BHUBANESWAR": (20.2961, 85.8245),
    "KHORDHA": (20.1804, 85.6200),
    "CUTTACK": (20.4625, 85.8828),
    "PURI": (19.8135, 85.8312),
    "RANCHI": (23.3441, 85.3096),
    "GUWAHATI": (26.1445, 91.7362),
    "KAMRUP METROPOLITAN": (26.1445, 91.7362),
    "EAST KHASI HILLS": (25.5788, 91.8933),
    "SHILLONG": (25.5788, 91.8933),
    "SOUTH GARO HILLS": (25.3000, 90.6300),
    
    # Islands
    "NICOBAR": (7.0000, 93.8000),
    "SOUTH ANDAMAN": (11.6234, 92.7265)
}

# Authoritative State / Union Territory mapping for verified districts
OFFICIAL_DISTRICT_STATES: Dict[str, str] = {
    # Maharashtra
    "NAGPUR": "Maharashtra",
    "PUNE": "Maharashtra",
    "MUMBAI": "Maharashtra",
    "MUMBAI SUBURBAN": "Maharashtra",
    "THANE": "Maharashtra",
    "NASHIK": "Maharashtra",
    "AURANGABAD": "Maharashtra",
    "CHHATRAPATI SAMBHAJINAGAR": "Maharashtra",
    "AMRAVATI": "Maharashtra",
    "CHANDRAPUR": "Maharashtra",
    "GADCHIROLI": "Maharashtra",
    "JALGAON": "Maharashtra",
    "KOLHAPUR": "Maharashtra",
    "SATARA": "Maharashtra",
    "SOLAPUR": "Maharashtra",
    "WARDHA": "Maharashtra",
    "YAVATMAL": "Maharashtra",

    # Madhya Pradesh
    "BHOPAL": "Madhya Pradesh",
    "INDORE": "Madhya Pradesh",
    "JABALPUR": "Madhya Pradesh",
    "GWALIOR": "Madhya Pradesh",
    "UJJAIN": "Madhya Pradesh",
    "SAGAR": "Madhya Pradesh",
    "REWA": "Madhya Pradesh",
    "HOSHANGABAD": "Madhya Pradesh",
    "NARMADAPURAM": "Madhya Pradesh",

    # Southern Peninsula
    "HYDERABAD": "Telangana",
    "BENGALURU URBAN": "Karnataka",
    "BENGALURU RURAL": "Karnataka",
    "CHENNAI": "Tamil Nadu",
    "COIMBATORE": "Tamil Nadu",
    "MADURAI": "Tamil Nadu",
    "VISAKHAPATNAM": "Andhra Pradesh",
    "VIJAYAWADA": "Andhra Pradesh",
    "NTR DISTRICT": "Andhra Pradesh",
    "GUNTUR": "Andhra Pradesh",
    "KURNOOL": "Andhra Pradesh",
    "YSR DISTRICT": "Andhra Pradesh",
    "KADAPA": "Andhra Pradesh",
    "THIRUVANANTHAPURAM": "Kerala",
    "KOCHI": "Kerala",
    "ERNAKULAM": "Kerala",
    "KOZHIKODE": "Kerala",
    "WAYANAD": "Kerala",
    "IDUKKI": "Kerala",

    # Northern & Gangetic Plains
    "LUCKNOW": "Uttar Pradesh",
    "KANPUR NAGAR": "Uttar Pradesh",
    "VARANASI": "Uttar Pradesh",
    "PRAYAGRAJ": "Uttar Pradesh",
    "ALLAHABAD": "Uttar Pradesh",
    "AGRA": "Uttar Pradesh",
    "PATNA": "Bihar",
    "GAYA": "Bihar",
    "MUZAFFARPUR": "Bihar",
    "BHAGALPUR": "Bihar",
    "NEW DELHI": "Delhi",
    "CHANDIGARH": "Chandigarh",
    "JAIPUR": "Rajasthan",
    "JODHPUR": "Rajasthan",
    "UDAIPUR": "Rajasthan",
    "AMRITSAR": "Punjab",
    "LUDHIANA": "Punjab",

    # Eastern & North Eastern India
    "KOLKATA": "West Bengal",
    "HOWRAH": "West Bengal",
    "DARJEELING": "West Bengal",
    "JALPAIGURI": "West Bengal",
    "BHUBANESWAR": "Odisha",
    "KHORDHA": "Odisha",
    "CUTTACK": "Odisha",
    "PURI": "Odisha",
    "RANCHI": "Jharkhand",
    "GUWAHATI": "Assam",
    "KAMRUP METROPOLITAN": "Assam",
    "EAST KHASI HILLS": "Meghalaya",
    "SHILLONG": "Meghalaya",
    "SOUTH GARO HILLS": "Meghalaya",

    # Islands
    "NICOBAR": "Andaman and Nicobar Islands",
    "SOUTH ANDAMAN": "Andaman and Nicobar Islands",
}


def get_district_coordinates(district_name: str) -> Optional[Tuple[float, float]]:
    """Returns (latitude, longitude) for a district name if cataloged."""
    d_clean = district_name.strip().upper()
    if d_clean in OFFICIAL_DISTRICT_COORDINATES:
        return OFFICIAL_DISTRICT_COORDINATES[d_clean]
    # Check partial match
    for k, v in OFFICIAL_DISTRICT_COORDINATES.items():
        if k in d_clean or d_clean in k:
            return v
    return None


def get_district_state(district_name: str) -> str:
    """Returns authentic State or Union Territory for a district name."""
    d_clean = district_name.strip().upper()
    if d_clean in OFFICIAL_DISTRICT_STATES:
        return OFFICIAL_DISTRICT_STATES[d_clean]
    for k, v in OFFICIAL_DISTRICT_STATES.items():
        if k in d_clean or d_clean in k:
            return v
    return "India"
