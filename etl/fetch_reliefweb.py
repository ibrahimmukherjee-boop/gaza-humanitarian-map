#!/usr/bin/env python3
"""Fetch Gaza humanitarian news from ReliefWeb API."""

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

try:
    import requests
except ImportError:
    requests = None

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

RELIEFWEB_URL = "https://api.reliefweb.int/v1/reports"
PARAMS = {
    "appname": "gaza-humanitarian-map",
    "profile": "list",
    "slim": "1",
    "limit": "30",
    "query[value]": "Gaza",
    "query[operator]": "AND",
}


def run():
    if requests is None:
        return []

    try:
        resp = requests.get(RELIEFWEB_URL, params=PARAMS, timeout=30)
        resp.raise_for_status()
        data = resp.json().get("data", [])
    except Exception as e:
        print(f"ReliefWeb fetch failed: {e}")
        return []

    items = []
    for entry in data:
        fields = entry.get("fields", {})
        title = fields.get("title", "Untitled")
        date = fields.get("date", {}).get("created", datetime.now(timezone.utc).isoformat())
        url = fields.get("url", "")
        source = "ReliefWeb"
        if fields.get("source"):
            source = fields["source"][0].get("name", source)

        body = fields.get("body", "")
        excerpt = body[:400] if isinstance(body, str) else ""

        items.append({
            "id": hashlib.md5(url.encode()).hexdigest()[:12],
            "title_en": title,
            "title_ar": "",
            "excerpt_en": excerpt,
            "excerpt_ar": "",
            "source": source,
            "timestamp": date,
            "url": url,
            "tags": ["humanitarian"],
            "location_tags": ["Gaza Strip"],
            "credibility": "high",
        })

    print(f"Fetched {len(items)} ReliefWeb reports")
    return items


if __name__ == "__main__":
    news = run()
    if news:
        out = DATA_DIR / "news.json"
        with open(out, "w", encoding="utf-8") as f:
            json.dump(news, f, indent=2, ensure_ascii=False)
        print(f"Wrote {out}")
