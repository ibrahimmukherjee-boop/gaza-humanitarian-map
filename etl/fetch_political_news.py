#!/usr/bin/env python3
"""Fetch political / official discourse news from RSS — runs with minute pipeline."""

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

try:
    import feedparser
except ImportError:
    feedparser = None

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
PUBLIC_DATA = DATA_DIR.parent / "frontend" / "public" / "data"

GAZA_RE = re.compile(r"gaza|palestin|hamas|israeli|idf|west bank|rafah|unrwa", re.I)

RSS_HEADERS = {
    "User-Agent": "GazaHumanitarianMap/1.0 (+https://ibrahimmukherjee-boop.github.io/gaza-humanitarian-map/)",
}

POLITICAL_FEEDS = [
    ("UN News", "https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml", "international"),
    ("Al Jazeera", "https://www.aljazeera.com/xml/rss/all.xml", "international"),
    ("BBC Middle East", "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", "international"),
    ("ReliefWeb", "https://reliefweb.int/updates/rss.xml?language=267", "international"),
    ("Times of Israel", "https://www.timesofisrael.com/feed/", "israel"),
    ("Jerusalem Post", "https://www.jpost.com/rss/rssfeedsheadlines", "israel"),
    ("WAFA", "https://english.wafa.ps/rss.aspx", "palestine"),
    ("Ma'an News", "https://www.maannews.net/rss.aspx", "palestine"),
]

STATEMENT_KEYWORDS = {
    "military_announcement": re.compile(r"military|army|idf|forces|strike|operation|missile|rocket", re.I),
    "official_statement": re.compile(r"president|prime minister|ministry|official|government|spokesperson", re.I),
    "diplomatic": re.compile(r"un |diplomat|ceasefire|negotiat|embassy|treaty|resolution", re.I),
}


def classify_statement(title: str, excerpt: str) -> str:
    text = f"{title} {excerpt}"
    for stype, pattern in STATEMENT_KEYWORDS.items():
        if pattern.search(text):
            return stype
    return "media_report"


def fetch_political() -> list[dict]:
    if feedparser is None:
        return []
    items = []
    for source_name, url, region in POLITICAL_FEEDS:
        try:
            feed = feedparser.parse(url, request_headers=RSS_HEADERS)
            for entry in feed.entries[:20]:
                link = entry.get("link", "")
                if not link:
                    continue
                title = entry.get("title", "Untitled")
                excerpt = entry.get("summary", "")[:400] or title
                text = f"{title} {excerpt}"
                if not GAZA_RE.search(text):
                    continue
                ts = entry.get("published_parsed") or entry.get("updated_parsed")
                if ts:
                    date = datetime(*ts[:6], tzinfo=timezone.utc).isoformat()
                else:
                    date = datetime.now(timezone.utc).isoformat()
                items.append(
                    {
                        "id": hashlib.md5(link.encode()).hexdigest()[:12],
                        "title_en": title,
                        "title_ar": "",
                        "excerpt_en": excerpt,
                        "excerpt_ar": "",
                        "source": source_name,
                        "source_region": region,
                        "statement_type": classify_statement(title, excerpt),
                        "timestamp": date,
                        "url": link,
                        "credibility": "high"
                        if source_name in ("UN News", "BBC Middle East", "WAFA")
                        else "medium",
                    }
                )
        except Exception as e:
            print(f"Political RSS failed {source_name}: {e}")
    return dedupe(items)


def dedupe(items: list[dict]) -> list[dict]:
    seen: set[str] = set()
    out = []
    for item in sorted(items, key=lambda x: x["timestamp"], reverse=True):
        if item["id"] not in seen:
            seen.add(item["id"])
            out.append(item)
    return out[:40]


def sync_public():
    if PUBLIC_DATA.parent.exists():
        PUBLIC_DATA.mkdir(parents=True, exist_ok=True)
        src = DATA_DIR / "political_news.json"
        if src.exists():
            import shutil
            shutil.copy2(src, PUBLIC_DATA / "political_news.json")


def run() -> int:
    items = fetch_political()
    if not items:
        print("No political news fetched; keeping existing")
        return 0
    out = DATA_DIR / "political_news.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)
    sync_public()
    meta_path = DATA_DIR / "meta.json"
    if meta_path.exists():
        with open(meta_path, encoding="utf-8") as f:
            meta = json.load(f)
        meta["political_last_updated"] = datetime.now(timezone.utc).isoformat()
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(items)} political items")
    return len(items)


if __name__ == "__main__":
    run()
