#!/usr/bin/env python3
"""Generate minimal lite data bundles for low-bandwidth / offline use."""

import json
from datetime import datetime, timezone
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
PUBLIC_DATA = Path(__file__).resolve().parent.parent / "frontend" / "public" / "data"


def lite_facilities():
    src = DATA_DIR / "facilities.geojson"
    if not src.exists():
        return
    with open(src, encoding="utf-8") as f:
        fc = json.load(f)

    lite_features = []
    for feat in fc.get("features", []):
        p = feat.get("properties", {})
        lite_features.append(
            {
                "type": "Feature",
                "id": p.get("id", feat.get("id")),
                "geometry": feat.get("geometry"),
                "properties": {
                    "id": p.get("id"),
                    "type": p.get("type"),
                    "title_en": p.get("title_en", "")[:80],
                    "title_ar": p.get("title_ar", "")[:80],
                    "description_en": "",
                    "description_ar": "",
                    "lat": p.get("lat"),
                    "lng": p.get("lng"),
                    "area": p.get("area"),
                    "status": p.get("status", "unknown"),
                    "source": p.get("source", ""),
                    "timestamp": p.get("timestamp"),
                    "verification_status": p.get("verification_status", "unverified"),
                    "confidence": p.get("confidence", "low"),
                },
            }
        )

    out = {"type": "FeatureCollection", "features": lite_features}
    for d in (DATA_DIR, PUBLIC_DATA):
        d.mkdir(parents=True, exist_ok=True)
        with open(d / "facilities-lite.geojson", "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"facilities-lite.geojson: {len(lite_features)} features")


def lite_news():
    src = DATA_DIR / "news.json"
    if not src.exists():
        return
    with open(src, encoding="utf-8") as f:
        items = json.load(f)

    lite = []
    for item in items[:12]:
        lite.append(
            {
                "id": item.get("id"),
                "title_en": (item.get("title_en") or "")[:120],
                "title_ar": (item.get("title_ar") or "")[:120],
                "excerpt_en": "",
                "excerpt_ar": "",
                "source": item.get("source", ""),
                "timestamp": item.get("timestamp"),
                "url": item.get("url", ""),
                "tags": (item.get("tags") or [])[:2],
                "location_tags": [],
                "credibility": item.get("credibility", "medium"),
            }
        )

    for d in (DATA_DIR, PUBLIC_DATA):
        with open(d / "news-lite.json", "w", encoding="utf-8") as f:
            json.dump(lite, f, ensure_ascii=False, separators=(",", ":"))
    print(f"news-lite.json: {len(lite)} items")


def lite_meta():
    meta_path = DATA_DIR / "meta.json"
    meta = {}
    if meta_path.exists():
        with open(meta_path, encoding="utf-8") as f:
            meta = json.load(f)

    lite = {
        "last_updated": meta.get("last_updated", datetime.now(timezone.utc).isoformat()),
        "news_last_updated": meta.get("news_last_updated"),
        "sources": (meta.get("sources") or [])[:3],
        "facilities_count": meta.get("facilities_count", 0),
        "news_count": min(meta.get("news_count", 0), 12),
        "note_en": "Lite data — verify locally. Full data available when not in lite mode.",
        "note_ar": "بيانات خفيفة — تحقق محلياً. البيانات الكاملة متاحة خارج الوضع الخفيف.",
        "lite": True,
    }
    for d in (DATA_DIR, PUBLIC_DATA):
        with open(d / "meta-lite.json", "w", encoding="utf-8") as f:
            json.dump(lite, f, ensure_ascii=False, separators=(",", ":"))
    print("meta-lite.json written")


if __name__ == "__main__":
    lite_facilities()
    lite_news()
    lite_meta()
