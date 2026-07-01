#!/usr/bin/env python3
"""Fetch humanitarian facilities from OpenStreetMap Overpass API (Gaza bbox)."""

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

try:
    import requests
except ImportError:
    requests = None

from areas import assign_area, AREA_NAMES

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
QUERY = """
[out:json][timeout:60];
(
  node["amenity"~"hospital|clinic|doctors|pharmacy|social_facility"](31.20,34.20,31.60,34.55);
  way["amenity"~"hospital|clinic|doctors|pharmacy|social_facility"](31.20,34.20,31.60,34.55);
);
out center tags;
"""

TYPE_MAP = {
    "hospital": "hospitals",
    "clinic": "clinics",
    "doctors": "clinics",
    "pharmacy": "clinics",
    "social_facility": "shelters",
}


def facility_type(tags: dict) -> str:
    amenity = tags.get("amenity", "")
    if amenity in TYPE_MAP:
        return TYPE_MAP[amenity]
    if tags.get("social_facility") == "shelter":
        return "shelters"
    if tags.get("man_made") == "water_well" or tags.get("amenity") == "drinking_water":
        return "water"
    return "clinics"


def run():
    if requests is None:
        print("requests not installed")
        return []

    try:
        resp = requests.post(OVERPASS_URL, data={"data": QUERY}, timeout=90)
        resp.raise_for_status()
        elements = resp.json().get("elements", [])
    except Exception as e:
        print(f"Overpass fetch failed: {e}")
        return []

    now = datetime.now(timezone.utc).isoformat()
    features = []

    for el in elements:
        tags = el.get("tags", {})
        lat = el.get("lat") or (el.get("center") or {}).get("lat")
        lng = el.get("lon") or (el.get("center") or {}).get("lon")
        if lat is None or lng is None:
            continue

        name = tags.get("name") or tags.get("name:en") or tags.get("amenity", "Facility")
        name_ar = tags.get("name:ar") or name
        area = assign_area(lat, lng)
        fid = hashlib.md5(f"{el['type']}-{el['id']}".encode()).hexdigest()[:12]

        features.append({
            "type": "Feature",
            "id": fid,
            "geometry": {"type": "Point", "coordinates": [lng, lat]},
            "properties": {
                "id": fid,
                "type": facility_type(tags),
                "title_en": name,
                "title_ar": name_ar,
                "description_en": f"OpenStreetMap {tags.get('amenity', 'facility')} — status unverified",
                "description_ar": f"من OpenStreetMap — الحالة غير موثقة",
                "lat": lat,
                "lng": lng,
                "area": area,
                "area_en": AREA_NAMES.get(area, AREA_NAMES["unknown"])[0],
                "area_ar": AREA_NAMES.get(area, AREA_NAMES["unknown"])[1],
                "status": "unknown",
                "source": "OpenStreetMap",
                "timestamp": now,
                "verification_status": "unverified",
                "confidence": "medium",
            },
        })

    print(f"Fetched {len(features)} OSM facilities")
    return features


if __name__ == "__main__":
    result = run()
    if result:
        out = DATA_DIR / "facilities.geojson"
        with open(out, "w", encoding="utf-8") as f:
            json.dump({"type": "FeatureCollection", "features": result}, f, indent=2, ensure_ascii=False)
        print(f"Wrote {out}")
