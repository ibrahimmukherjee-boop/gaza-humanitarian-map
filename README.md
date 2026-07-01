# Gaza Humanitarian Map

Practical humanitarian directory for Gaza — **Arabic-first**, offline-capable, low-bandwidth lite mode.

**Live site:** https://ibrahimmukherjee-boop.github.io/gaza-humanitarian-map/

## For people in Gaza

- **Home** — essentials first: resources, survival guides, hotlines
- **Resources by area** — Gaza City, North Gaza, Khan Younis, Rafah, Middle Area
- **Lite mode** — disables map tiles to save data
- **Save offline** — cache all data for use without internet
- **Hotlines** — humanitarian agency contacts (verify locally)
- **Survival guides** — water, no-power, infants, chronic illness, menstrual hygiene
- **Islamic guidance** & **violence safety** — offline-cacheable

## Run locally

```bash
cd frontend && npm install && npm run dev
```

## Update data

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r etl/requirements.txt
python etl/run_pipeline.py
```

Pulls from ReliefWeb API and OpenStreetMap (Gaza bbox).

## Ethics

No safe zones, no threat forecasts, no route recommendations. Verify all data locally.

## License

MIT
