#!/usr/bin/env python3
"""Write meta.json with news and political feed timestamps."""

import json
from datetime import datetime, timezone
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
PUBLIC_DATA = Path(__file__).resolve().parent.parent / "frontend" / "public" / "data"


def _file_mtime(path: Path) -> str | None:
    if not path.exists():
        return None
    return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).isoformat()


def write_meta():
    facilities = DATA_DIR / "facilities.geojson"
    news = DATA_DIR / "news.json"
    political = DATA_DIR / "political_news.json"

    fc = 0
    nc = 0
    if facilities.exists():
        with open(facilities, encoding="utf-8") as f:
            fc = len(json.load(f).get("features", []))
    if news.exists():
        with open(news, encoding="utf-8") as f:
            nc = len(json.load(f))

    now = datetime.now(timezone.utc).isoformat()
    meta = {
        "last_updated": now,
        "refresh_heartbeat": now,
        "news_last_updated": _file_mtime(news) or now,
        "political_last_updated": _file_mtime(political) or now,
        "sources": ["OpenStreetMap", "ReliefWeb", "UN agencies", "Curated hotlines"],
        "facilities_count": fc,
        "news_count": nc,
        "note_en": "Verify all locations and phone numbers locally before acting. Data may be delayed.",
        "note_ar": "تحقق من جميع المواقع وأرقام الهاتف محلياً قبل التصرف. قد تتأخر البيانات.",
    }

    for d in (DATA_DIR, PUBLIC_DATA):
        d.mkdir(parents=True, exist_ok=True)
        with open(d / "meta.json", "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2, ensure_ascii=False)
    print("Updated meta.json with live feed timestamps")


if __name__ == "__main__":
    write_meta()
