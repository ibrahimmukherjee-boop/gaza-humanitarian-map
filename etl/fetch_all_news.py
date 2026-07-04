#!/usr/bin/env python3
"""Fetch and merge all news sources — designed to run every minute."""

import hashlib
import json
import re
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

RELIEFWEB_URL = "https://api.reliefweb.int/v2/reports"
RELIEFWEB_PARAMS = [
    ("appname", "gaza-humanitarian-map"),
    ("limit", "30"),
    ("query[value]", "Gaza"),
    ("fields[include][]", "title"),
    ("fields[include][]", "url"),
    ("fields[include][]", "date.created"),
    ("fields[include][]", "body"),
    ("fields[include][]", "source.name"),
]

RSS_HEADERS = {
    "User-Agent": "GazaHumanitarianMap/1.0 (+https://ibrahimmukherjee-boop.github.io/gaza-humanitarian-map/)",
}

# (name, url, require_gaza_filter)
RSS_SOURCES = [
    ("ReliefWeb", "https://reliefweb.int/updates/rss.xml?language=267", False),
    ("WHO", "https://www.who.int/rss-feeds/news-english.xml", True),
    ("UN News", "https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml", False),
    ("OCHA", "https://www.unocha.org/rss.xml", True),
    ("UNICEF", "https://www.unicef.org/feed", True),
    ("UNRWA", "https://www.unrwa.org/newsroom/press-releases/rss.xml", False),
    ("ICRC", "https://www.icrc.org/en/rss", True),
    ("WFP", "https://www.wfp.org/rss.xml", True),
    ("UNHCR", "https://www.unhcr.org/rss.xml", True),
    ("BBC Middle East", "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", False),
]

GAZA_RE = re.compile(r"gaza|palestin|humanitarian|refugee|unrwa|rafah|khan younis", re.I)


def fetch_reliefweb() -> list[dict]:
    if requests is None:
        return []
    try:
        resp = requests.get(RELIEFWEB_URL, params=RELIEFWEB_PARAMS, timeout=25, headers=RSS_HEADERS)
        if resp.status_code == 403:
            print("ReliefWeb API: appname not approved yet — using RSS only")
            return []
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
        date_field = fields.get("date", {})
        date = date_field.get("created") if isinstance(date_field, dict) else date_field
        if not date:
            date = datetime.now(timezone.utc).isoformat()
        source = "ReliefWeb"
        sources = fields.get("source", [])
        if sources and isinstance(sources, list):
            source = sources[0].get("name", source) if isinstance(sources[0], dict) else source
        body = fields.get("body", "")
        excerpt = (body[:400] if isinstance(body, str) else "") or title
        tags = _tags_from_text(title + " " + excerpt)
        items.append(_item(title, excerpt, source, date, url, tags))
    return items


def _tags_from_text(text: str) -> list[str]:
    t = text.lower()
    if any(w in t for w in ("hospital", "health", "medical", "who")):
        return ["health", "humanitarian"]
    if any(w in t for w in ("water", "food", "shelter", "aid")):
        return ["aid", "humanitarian"]
    if any(w in t for w in ("displace", "refugee", "evacuat")):
        return ["displacement", "humanitarian"]
    if any(w in t for w in ("road", "infrastructure", "power", "fuel")):
        return ["infrastructure", "humanitarian"]
    return ["humanitarian"]


def fetch_rss() -> list[dict]:
    if feedparser is None:
        return []
    items = []
    for source_name, url, require_filter in RSS_SOURCES:
        try:
            feed = feedparser.parse(url, request_headers=RSS_HEADERS)
            for entry in feed.entries[:20]:
                link = entry.get("link", "")
                if not link:
                    continue
                title = entry.get("title", "Untitled")
                excerpt = entry.get("summary", "")[:400] or title
                text = f"{title} {excerpt}"
                if require_filter and not GAZA_RE.search(text):
                    continue
                ts = entry.get("published_parsed") or entry.get("updated_parsed")
                if ts:
                    date = datetime(*ts[:6], tzinfo=timezone.utc).isoformat()
                else:
                    date = datetime.now(timezone.utc).isoformat()
                tag = "health" if source_name == "WHO" else _tags_from_text(text)[0]
                items.append(_item(title, excerpt, source_name, date, link, [tag, "humanitarian"]))
        except Exception as e:
            print(f"RSS failed {source_name}: {e}")
    return items


def _item(title: str, excerpt: str, source: str, date: str, url: str, tags: list) -> dict:
    high_cred = {"ReliefWeb", "WHO", "UN News", "OCHA", "UNICEF", "UNRWA", "ICRC", "WFP", "UNHCR"}
    return {
        "id": hashlib.md5(url.encode()).hexdigest()[:12],
        "title_en": title,
        "title_ar": "",
        "excerpt_en": excerpt,
        "excerpt_ar": "",
        "source": source,
        "timestamp": date,
        "url": url,
        "tags": list(dict.fromkeys(tags)),
        "location_tags": ["Gaza Strip"],
        "credibility": "high" if source in high_cred else "medium",
    }


def dedupe_sort(items: list[dict]) -> list[dict]:
    seen: set[str] = set()
    unique = []
    for item in sorted(items, key=lambda x: x["timestamp"], reverse=True):
        if item["id"] not in seen:
            seen.add(item["id"])
            unique.append(item)
    return unique


def update_meta(news_count: int, force: bool = False):
    meta_path = DATA_DIR / "meta.json"
    now = datetime.now(timezone.utc).isoformat()
    meta = {}
    if meta_path.exists():
        with open(meta_path, encoding="utf-8") as f:
            meta = json.load(f)
    meta["news_last_updated"] = now
    meta["last_updated"] = now
    meta["refresh_heartbeat"] = now
    meta["news_count"] = news_count
    meta.setdefault(
        "sources",
        ["ReliefWeb", "WHO", "UN News", "OCHA", "UNICEF", "UNRWA", "ICRC", "WFP", "UNHCR", "BBC"],
    )
    meta.setdefault("note_en", "Verify locally. All feeds refresh every minute from public sources.")
    meta.setdefault("note_ar", "تحقق محلياً. جميع المصادر تتحدث كل دقيقة من مصادر عامة.")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
    if force:
        print(f"Meta heartbeat: {now}")


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
    now = datetime.now(timezone.utc).isoformat()

    if all_news:
        out = DATA_DIR / "news.json"
        with open(out, "w", encoding="utf-8") as f:
            json.dump(all_news, f, indent=2, ensure_ascii=False)
        update_meta(len(all_news))
        sync_public()
        print(f"Wrote {len(all_news)} news items at {now}")
        return len(all_news)

    # Always touch meta heartbeat even when feeds return nothing new
    existing_count = 0
    news_path = DATA_DIR / "news.json"
    if news_path.exists():
        with open(news_path, encoding="utf-8") as f:
            existing_count = len(json.load(f))
    update_meta(existing_count, force=True)
    sync_public()
    print(f"No new headlines; heartbeat updated at {now}")
    return 0


if __name__ == "__main__":
    run()
