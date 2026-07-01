from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import json

app = FastAPI(title="HSSM API", description="Humanitarian Situation & Survival Map API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


def load_json(filename: str):
    path = DATA_DIR / filename
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/health")
def health():
    return {"status": "ok", "service": "hssm-api"}


@app.get("/news")
def news():
    return load_json("news.json")


@app.get("/pressure")
def pressure():
    return load_json("pressure.json")


@app.get("/facilities")
def facilities():
    return load_json("facilities.geojson")


@app.get("/political_news")
def political_news():
    return load_json("political_news.json")


@app.get("/hotlines")
def hotlines():
    return load_json("hotlines.json")


@app.get("/meta")
def meta():
    return load_json("meta.json")
