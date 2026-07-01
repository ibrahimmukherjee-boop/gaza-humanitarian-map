import { assetUrl } from "../utils/baseUrl";

const FULL_DATA_FILES = [
  "data/facilities.geojson",
  "data/news.json",
  "data/pressure.json",
  "data/political_news.json",
  "data/hotlines.json",
  "data/meta.json",
].map(assetUrl);

const LITE_DATA_FILES = [
  "data/facilities-lite.geojson",
  "data/news-lite.json",
  "data/hotlines.json",
  "data/meta-lite.json",
].map(assetUrl);

const CACHE_NAME = "hssm-offline-v2";

async function cacheUrls(urls: string[]): Promise<number> {
  if (!("caches" in window)) return 0;
  const cache = await caches.open(CACHE_NAME);
  let saved = 0;
  await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { cache: "no-cache" });
        if (res.ok) {
          await cache.put(url, res);
          saved++;
        }
      } catch {
        /* skip failed */
      }
    })
  );
  return saved;
}

export async function saveAllOffline(lite = false): Promise<{ saved: number; total: number }> {
  const urls = lite ? LITE_DATA_FILES : FULL_DATA_FILES;
  const saved = await cacheUrls(urls);

  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    reg?.active?.postMessage({ type: "CACHE_URLS", urls });
  }

  return { saved, total: urls.length };
}

export async function isDataCached(lite = false): Promise<boolean> {
  if (!("caches" in window)) return false;
  const cache = await caches.open(CACHE_NAME);
  const key = lite ? assetUrl("data/meta-lite.json") : assetUrl("data/meta.json");
  return !!(await cache.match(key));
}

export function estimateLiteSizeKb(): number {
  return 45;
}

export function estimateFullSizeKb(): number {
  return 280;
}
