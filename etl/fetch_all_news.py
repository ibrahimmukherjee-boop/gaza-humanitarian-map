#!/usr/bin/env python3
"""Fetch and merge all news sources — designed to run every minute."""

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

try:
    import feedparser
    import requests
except ImportError:
    feedparser = None
    requests = None

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
PUBLIC_DATA = DATA_DIR.parent / "frontend" / "public" / "data"

RELIEFWEB_URL = "https://api.reliefweb.int/v1/reports"
RELIEFWEB_PARAMS = {
    "appname": "gaza-humanitarian-map",
    "profile": "list",
    "slim": "1",
    "limit": "25",
    "query[value]": "Gaza",
    "query[operator]": "AND",
}

RSS_SOURCES = [
    ("ReliefWeb", "https://reliefweb.int/updates/rss.xml?language=267"),
    ("WHO", "https://www.who.int/rss-feeds/news-english.xml"),
    ("UN News", "https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml"),
]


def fetch_reliefweb() -> list[dict]:
    if requests is None:
        return []
    try:
        resp = requests.get(RELIEFWEB_URL, params=RELIEFWEB_PARAMS, timeout=25)
        resp.raise_for_status()
        data = resp.json().get("data", [])
    except Exception as e:
        print(f"ReliefWeb API failed: {e}")
        return []

    items = []
    for entry in data:
        fields = entry.get("fields", {})
        url = fields.get("url", "")
        if not url:
            continue
        title = fields.get("title", "Untitled")
        date = fields.get("date", {}).get("created", datetime.now(timezone.utc).isoformat())
        source = "ReliefWeb"
        if fields.get("source"):
            source = fields["source"][0].get("name", source)
        body = fields.get("body", "")
        excerpt = (body[:400] if isinstance(body, str) else "") or title
        items.append(_item(title, excerpt, source, date, url, ["humanitarian"]))
    return items


def fetch_rss() -> list[dict]:
    if feedparser is None:
        return []
    items = []
    for source_name, url in RSS_SOURCES:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:15]:
                link = entry.get("link", "")
                if not link:
                    continue
                title = entry.get("title", "Untitled")
                # Filter Gaza-relevant when possible
                text = f"{title} {entry.get('summary', '')}".lower()
                if source_name != "ReliefWeb" and "gaza" not in text and "palestin" not in text:
                    continue
                ts = entry.get("published_parsed") or entry.get("updated_parsed")
                if ts:
                    date = datetime(*ts[:6], tzinfo=timezone.utc).isoformat()
                else:
                    date = datetime.now(timezone.utc).isoformat()
                excerpt = entry.get("summary", "")[:400] or title
                tag = "humanitarian" if source_name != "WHO" else "health"
                items.append(_item(title, excerpt, source_name, date, link, [tag]))
        except Exception as e:
            print(f"RSS failed {source_name}: {e}")
    return items


def _item(title: str, excerpt: str, source: str, date: str, url: str, tags: list) -> dict:
    return {
        "id": hashlib.md5(url.encode()).hexdigest()[:12],
        "title_en": title,
        "title_ar": "",
        "excerpt_en": excerpt,
        "excerpt_ar": "",
        "source": source,
        "timestamp": date,
        "url": url,
        "tags": tags,
        "location_tags": ["Gaza Strip"],
        "credibility": "high" if source in ("ReliefWeb", "WHO", "UN News") else "medium",
    }


def dedupe_sort(items: list[dict]) -> list[dict]:
    seen: set[str] = set()
    unique = []
    for item in sorted(items, key=lambda x: x["timestamp"], reverse=True):
        if item["id"] not in seen:
            seen.add(item["id"])
            unique.append(item)
    return unique


def update_meta(news_count: int):
    meta_path = DATA_DIR / "meta.json"
    now = datetime.now(timezone.utc).isoformat()
    meta = {}
    if meta_path.exists():
        with open(meta_path, encoding="utf-8") as f:
            meta = json.load(f)
    meta["news_last_updated"] = now
    meta["last_updated"] = now
    meta["news_count"] = news_count
    meta.setdefault("sources", ["ReliefWeb", "WHO", "UN News", "RSS"])
    meta.setdefault("note_en", "Verify locally. News refreshes every minute from public feeds.")
    meta.setdefault("note_ar", "تحقق محلياً. يتم تحديث الأخبار كل دقيقة من مصادر عامة.")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)


def sync_public():
    if PUBLIC_DATA.parent.exists():
        PUBLIC_DATA.mkdir(parents=True, exist_ok=True)
        for name in ("news.json", "meta.json"):
            src = DATA_DIR / name
            if src.exists():
                import shutil
                shutil.copy2(src, PUBLIC_DATA / name)


def run() -> int:
    all_news = dedupe_sort(fetch_reliefweb() + fetch_rss())
    if not all_news:
        print("No news fetched; keeping existing file")
        return 0

    out = DATA_DIR / "news.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(all_news, f, indent=2, ensure_ascii=False)
    update_meta(len(all_news))
    sync_public()
    print(f"Wrote {len(all_news)} news items at {datetime.now(timezone.utc).isoformat()}")
    return len(all_news)


if __name__ == "__main__":
    run()
