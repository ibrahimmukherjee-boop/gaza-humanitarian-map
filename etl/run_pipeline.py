#!/usr/bin/env python3
"""Run all ETL pipelines and sync to frontend."""

import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ETL_DIR = Path(__file__).resolve().parent
DATA_DIR = ETL_DIR.parent / "data"
PUBLIC_DATA = ETL_DIR.parent / "frontend" / "public" / "data"


def run_script(name: str):
    script = ETL_DIR / name
    if script.exists():
        print(f"Running {name}...")
        subprocess.run([sys.executable, str(script)], check=False, cwd=str(ETL_DIR))


def write_meta():
    facilities = DATA_DIR / "facilities.geojson"
    news = DATA_DIR / "news.json"
    fc = 0
    nc = 0
    if facilities.exists():
        with open(facilities) as f:
            fc = len(json.load(f).get("features", []))
    if news.exists():
        with open(news) as f:
            nc = len(json.load(f))

    meta = {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "sources": ["OpenStreetMap", "ReliefWeb", "UN agencies", "Curated hotlines"],
        "facilities_count": fc,
        "news_count": nc,
        "note_en": "Verify all locations and phone numbers locally before acting. Data may be delayed.",
        "note_ar": "تحقق من جميع المواقع وأرقام الهاتف محلياً قبل التصرف. قد تتأخر البيانات.",
    }
    with open(DATA_DIR / "meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
    print("Updated meta.json")


def sync_to_frontend():
    if not PUBLIC_DATA.parent.exists():
        return
    PUBLIC_DATA.mkdir(parents=True, exist_ok=True)
    for f in DATA_DIR.iterdir():
        if f.suffix in (".json", ".geojson"):
            shutil.copy2(f, PUBLIC_DATA / f.name)
    print(f"Synced to {PUBLIC_DATA}")


if __name__ == "__main__":
    run_script("fetch_all_news.py")
    run_script("fetch_osm.py")
    run_script("pressure_engine.py")
    write_meta()
    run_script("generate_lite_data.py")
    sync_to_frontend()
    print("Pipeline complete.")
