"""Shared Gaza relevance filter for ETL news pipelines."""

import re

GAZA_CORE = re.compile(
    r"gaza|gaza strip|palestin|unrwa|rafah|khan younis|deir al.?balah|jabalia|"
    r"beit hanoun|north gaza|west bank|occupied territor",
    re.I,
)

HUMANITARIAN = re.compile(
    r"humanitarian|refugee|aid convoy|food aid|medical aid|displaced|shelter|"
    r"un agency|unrwa|ocha|wfp|unicef|icrc",
    re.I,
)

OFF_TOPIC = re.compile(
    r"tehran|\biran\b|khamenei|\bsyria\b|damascus|\blebanon\b|\byemen\b|"
    r"\bsudan\b|ukraine|russia|mali|congo|myanmar|afghanistan",
    re.I,
)

TRUSTED = {"UNRWA", "ReliefWeb", "OCHA", "WAFA", "Ma'an News"}


def is_relevant(title: str, excerpt: str, source: str = "") -> bool:
    text = f"{title} {excerpt}"
    if OFF_TOPIC.search(text) and not GAZA_CORE.search(text):
        return False
    if GAZA_CORE.search(text):
        return True
    if source in TRUSTED and HUMANITARIAN.search(text):
        return True
    return False
