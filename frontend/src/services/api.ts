import { assetUrl, BASE_URL } from "../utils/baseUrl";

const API_BASE = import.meta.env.VITE_API_URL;

export interface FetchOpts {
  cacheBust?: boolean;
  lite?: boolean;
}

async function fetchJson<T>(path: string, opts?: FetchOpts): Promise<T> {
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}${path}`);
      if (res.ok) return res.json();
    } catch {
      /* fall through */
    }
  }

  try {
    const res = await fetch(`${BASE_URL.replace(/\/$/, "")}/api${path}`);
    if (res.ok) return res.json();
  } catch {
    /* fall through */
  }

  const liteSuffix = opts?.lite ? "-lite" : "";
  let file: string;
  if (path === "/facilities") {
    file = assetUrl(`data/facilities${liteSuffix}.geojson`);
  } else if (path === "/meta") {
    file = assetUrl(`data/meta${liteSuffix}.json`);
  } else if (path === "/news") {
    file = assetUrl(`data/news${liteSuffix}.json`);
  } else {
    file = assetUrl(`data${path}.json`);
  }

  const url = opts?.cacheBust ? `${file}?t=${Math.floor(Date.now() / 60000)}` : file;
  const res = await fetch(url);
  if (!res.ok) {
    if (opts?.lite) {
      return fetchJson<T>(path, { ...opts, lite: false });
    }
    throw new Error(`Failed to fetch ${path}`);
  }
  return res.json();
}

export const api = {
  facilities: (opts?: { lite?: boolean }) =>
    fetchJson<import("../types").GeoJSONCollection>("/facilities", { lite: opts?.lite }),
  news: (opts?: { lite?: boolean; cacheBust?: boolean }) =>
    fetchJson<import("../types").NewsItem[]>("/news", {
      lite: opts?.lite,
      cacheBust: opts?.cacheBust,
    }),
  pressure: () => fetchJson<import("../types").PressureData>("/pressure"),
  politicalNews: (opts?: { cacheBust?: boolean }) =>
    fetchJson<import("../types/political").PoliticalNewsItem[]>("/political_news", {
      cacheBust: opts?.cacheBust,
    }),
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
