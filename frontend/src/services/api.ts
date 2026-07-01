const API_BASE = import.meta.env.VITE_API_URL;

async function fetchJson<T>(path: string): Promise<T> {
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}${path}`);
      if (res.ok) return res.json();
    } catch {
      /* fall through */
    }
  }

  try {
    const res = await fetch(`/api${path}`);
    if (res.ok) return res.json();
  } catch {
    /* fall through */
  }

  const file =
    path === "/facilities" ? "/data/facilities.geojson" : `/data${path}.json`;
  const res = await fetch(file);
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  return res.json();
}

export const api = {
  facilities: () => fetchJson<import("../types").GeoJSONCollection>("/facilities"),
  news: () => fetchJson<import("../types").NewsItem[]>("/news"),
  pressure: () => fetchJson<import("../types").PressureData>("/pressure"),
  politicalNews: () =>
    fetchJson<import("../types/political").PoliticalNewsItem[]>("/political_news"),
  hotlines: () => fetchJson<import("../types").Hotline[]>("/hotlines"),
  meta: () => fetchJson<import("../types").MetaData>("/meta"),
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
