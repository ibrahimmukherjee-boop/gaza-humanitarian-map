import { assetUrl } from "../utils/baseUrl";

const DATA_FILES = [
  "data/facilities.geojson",
  "data/news.json",
  "data/pressure.json",
  "data/political_news.json",
  "data/hotlines.json",
  "data/meta.json",
].map(assetUrl);

const CACHE_NAME = "hssm-offline-v1";

export async function saveAllOffline(): Promise<void> {
  if (!("caches" in window)) return;

  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    DATA_FILES.map(async (url) => {
      try {
        const res = await fetch(url);
        if (res.ok) await cache.put(url, res);
      } catch {
        /* skip failed */
      }
    })
  );

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "CACHE_URLS", urls: DATA_FILES });
  }
}

export async function isDataCached(): Promise<boolean> {
  if (!("caches" in window)) return false;
  const cache = await caches.open(CACHE_NAME);
  const match = await cache.match(assetUrl("data/meta.json"));
  return !!match;
}
