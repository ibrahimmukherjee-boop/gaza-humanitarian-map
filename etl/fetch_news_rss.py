#!/usr/bin/env python3
"""Fetch humanitarian news from verified RSS feeds."""

import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path

try:
    import feedparser
except ImportError:
    feedparser = None

SOURCES = [
    "https://reliefweb.int/updates/rss.xml?language=267",
    "https://www.who.int/rss-feeds/news-english.xml",
]

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def fetch_rss(url: str) -> list[dict]:
    if feedparser is None:
        return []
    feed = feedparser.parse(url)
    items = []
    for entry in feed.entries[:20]:
        entry_id = entry.get("id", entry.get("link", ""))
        items.append({
            "id": hashlib.md5(entry_id.encode()).hexdigest()[:12],
            "title_en": entry.get("title", "Untitled"),
            "title_ar": "",
            "excerpt_en": entry.get("summary", "")[:500],
            "excerpt_ar": "",
            "source": url.split("/")[2],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "url": entry.get("link", ""),
            "tags": ["humanitarian"],
            "location_tags": [],
            "credibility": "high",
        })
    return items


def run():
    all_news: list[dict] = []
    for source in SOURCES:
        try:
            all_news.extend(fetch_rss(source))
        except Exception as e:
            print(f"Warning: failed to fetch {source}: {e}")

    if not all_news:
        print("No RSS data fetched; keeping existing news.json")
        return

    seen = set()
    unique = []
    for item in all_news:
        if item["id"] not in seen:
            seen.add(item["id"])
            unique.append(item)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    out = DATA_DIR / "news.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(unique, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(unique)} news items to {out}")


if __name__ == "__main__":
    run()
