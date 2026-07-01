#!/usr/bin/env python3
"""Assign Gaza area from coordinates."""

GAZA_AREAS = [
    ("gaza-city", 31.45, 31.55, 34.40, 34.50),
    ("north-gaza", 31.52, 31.58, 34.45, 34.52),
    ("middle-area", 31.45, 31.52, 34.30, 34.42),
    ("khan-younis", 31.30, 31.45, 34.25, 34.40),
    ("rafah", 31.20, 31.32, 34.20, 34.30),
]

AREA_NAMES = {
    "gaza-city": ("Gaza City", "مدينة غزة"),
    "north-gaza": ("North Gaza", "شمال غزة"),
    "middle-area": ("Middle Area", "المنطقة الوسطى"),
    "khan-younis": ("Khan Younis", "خان يونس"),
    "rafah": ("Rafah", "رفح"),
    "unknown": ("Gaza Strip", "قطاع غزة"),
}


def assign_area(lat: float, lng: float) -> str:
    for area_id, lat_min, lat_max, lng_min, lng_max in GAZA_AREAS:
        if lat_min <= lat <= lat_max and lng_min <= lng <= lng_max:
            return area_id
    if 31.2 <= lat <= 31.6 and 34.2 <= lng <= 34.6:
        return "middle-area"
    return "unknown"
