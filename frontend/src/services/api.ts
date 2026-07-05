import { assetUrl, BASE_URL } from "../utils/baseUrl";
import { fetchLiveNews, fetchLivePolitical, mergeById } from "./liveNewsClient";
import { filterNewsItems } from "./newsFilter";

const API_BASE = import.meta.env.VITE_API_URL;
const OFFLINE_CACHE = "hssm-offline-v2";
const LIVE_TIMEOUT_MS = 10_000;

export interface FetchOpts {
  cacheBust?: boolean;
  lite?: boolean;
}

function dataFile(path: string, lite: boolean): string {
  const liteSuffix = lite ? "-lite" : "";
  if (path === "/facilities") return assetUrl(`data/facilities${liteSuffix}.geojson`);
  if (path === "/meta") return assetUrl(`data/meta${liteSuffix}.json`);
  if (path === "/news") return assetUrl(`data/news${liteSuffix}.json`);
  return assetUrl(`data${path}.json`);
}

async function fromOfflineCache(url: string): Promise<Response | null> {
  if (!("caches" in window)) return null;
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    return (await cache.match(url)) ?? null;
  } catch {
    return null;
  }
}

async function fetchJson<T>(path: string, opts?: FetchOpts): Promise<T> {
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        cache: opts?.cacheBust ? "no-store" : "default",
      });
      if (res.ok) return res.json();
    } catch {
      /* fall through */
    }
  }

  try {
    const res = await fetch(`${BASE_URL.replace(/\/$/, "")}/api${path}`, {
      cache: opts?.cacheBust ? "no-store" : "default",
    });
    if (res.ok) return res.json();
  } catch {
    /* fall through */
  }

  const file = dataFile(path, !!opts?.lite);
  const url = opts?.cacheBust ? `${file}?_=${Date.now()}` : file;

  try {
    const res = await fetch(url, { cache: opts?.cacheBust ? "no-store" : "default" });
    if (res.ok) return res.json();
  } catch {
    /* try offline cache only when not live-refreshing */
  }

  if (!opts?.cacheBust) {
    const cached = await fromOfflineCache(url);
    if (cached) return cached.json() as Promise<T>;
  }

  if (opts?.lite) {
    return fetchJson<T>(path, { ...opts, lite: false });
  }

  throw new Error(`Failed to fetch ${path}`);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

export const api = {
  facilities: (opts?: { lite?: boolean }) =>
    fetchJson<import("../types").GeoJSONCollection>("/facilities", { lite: opts?.lite }),
  news: async (opts?: { lite?: boolean; cacheBust?: boolean }) => {
    if (opts?.lite || !opts?.cacheBust) {
      const items = await fetchJson<import("../types").NewsItem[]>("/news", {
        lite: opts?.lite,
        cacheBust: opts?.cacheBust,
      });
      return filterNewsItems(items);
    }

    const [staticNews, liveItems] = await Promise.all([
      fetchJson<import("../types").NewsItem[]>("/news", { cacheBust: true }),
      withTimeout(fetchLiveNews([]), LIVE_TIMEOUT_MS).catch(
        () => [] as import("../types").NewsItem[]
      ),
    ]);

    return filterNewsItems(mergeById(staticNews, liveItems));
  },
  pressure: () => fetchJson<import("../types").PressureData>("/pressure"),
  politicalNews: async (opts?: { cacheBust?: boolean }) => {
    if (!opts?.cacheBust) {
      return fetchJson<import("../types/political").PoliticalNewsItem[]>("/political_news");
    }

    const [staticItems, liveItems] = await Promise.all([
      fetchJson<import("../types/political").PoliticalNewsItem[]>("/political_news", {
        cacheBust: true,
      }),
      withTimeout(fetchLivePolitical([]), LIVE_TIMEOUT_MS).catch(
        () => [] as import("../types/political").PoliticalNewsItem[]
      ),
    ]);

    return mergeById(staticItems, liveItems);
  },
  hotlines: () => fetchJson<import("../types").Hotline[]>("/hotlines"),
  meta: (opts?: { lite?: boolean; cacheBust?: boolean }) =>
    fetchJson<import("../types").MetaData>("/meta", {
      lite: opts?.lite,
      cacheBust: opts?.cacheBust,
    }),
  health: () => fetchJson<{ status: string }>("/health"),
};

export function formatRelativeTime(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "en", {
    numeric: "auto",
  });

  if (minutes < 1) return rtf.format(0, "minute");
  if (minutes < 60) return rtf.format(-minutes, "minute");
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-days, "day");
}

export function filterByTime<T extends { timestamp: string }>(
  items: T[],
  hours: number | null
): T[] {
  if (hours === null) return items;
  const cutoff = Date.now() - hours * 3600000;
  return items.filter((item) => new Date(item.timestamp).getTime() >= cutoff);
}

export { getLiveFeedMeta } from "./liveNewsClient";
