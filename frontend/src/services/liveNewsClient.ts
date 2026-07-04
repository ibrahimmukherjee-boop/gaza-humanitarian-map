import type { NewsItem } from "../types";
import type { PoliticalNewsItem, PoliticalSourceRegion } from "../types/political";

const GAZA_RE = /gaza|palestin|humanitarian|refugee|unrwa|rafah|khan younis|hamas|israeli|idf|west bank/i;
const FETCH_TIMEOUT_MS = 6_000;

const NEWS_RSS: { name: string; url: string; filter?: boolean }[] = [
  { name: "UN News", url: "https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml" },
  { name: "BBC Middle East", url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml" },
  { name: "ReliefWeb", url: "https://reliefweb.int/updates/rss.xml?language=267", filter: true },
];

const POLITICAL_RSS: { name: string; url: string; region: PoliticalSourceRegion }[] = [
  {
    name: "UN News",
    url: "https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml",
    region: "international",
  },
  {
    name: "BBC Middle East",
    url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml",
    region: "international",
  },
  { name: "Times of Israel", url: "https://www.timesofisrael.com/feed/", region: "israel" },
];

function hashId(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0").slice(0, 12);
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

interface Rss2JsonItem {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
}

interface Rss2JsonResponse {
  status?: string;
  items?: Rss2JsonItem[];
}

/** rss2json works from the browser without a broken CORS proxy. */
async function fetchRssViaJson(
  feedUrl: string,
  source: string,
  filterGaza = false
): Promise<NewsItem[]> {
  try {
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
    const res = await fetchWithTimeout(apiUrl);
    if (!res.ok) return [];
    const data = (await res.json()) as Rss2JsonResponse;
    if (data.status !== "ok" || !data.items?.length) return [];

    return data.items
      .map((item): NewsItem | null => {
        const title = item.title?.trim() || "Untitled";
        const link = item.link?.trim() || "";
        const excerpt =
          item.description?.replace(/<[^>]+>/g, "").trim().slice(0, 400) || title;
        if (!link) return null;
        if (filterGaza && !GAZA_RE.test(`${title} ${excerpt}`)) return null;
        const ts = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
        return {
          id: hashId(link),
          title_en: title,
          title_ar: "",
          excerpt_en: excerpt,
          excerpt_ar: "",
          source,
          timestamp: ts,
          url: link,
          tags: ["humanitarian"],
          location_tags: ["Gaza Strip"],
          credibility: "high",
        };
      })
      .filter((item): item is NewsItem => item !== null);
  } catch {
    return [];
  }
}

function mergeById<T extends { id: string; timestamp: string }>(base: T[], live: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of [...base, ...live]) {
    const prev = map.get(item.id);
    if (!prev || new Date(item.timestamp) > new Date(prev.timestamp)) {
      map.set(item.id, item);
    }
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/** Fetch headlines in the browser — fast, with per-source timeouts. */
export async function fetchLiveNews(supplement: NewsItem[] = []): Promise<NewsItem[]> {
  const batches = await Promise.all(
    NEWS_RSS.map(({ name, url, filter }) => fetchRssViaJson(url, name, filter))
  );
  const live = batches.flat();
  return mergeById(supplement, live);
}

export async function fetchLivePolitical(
  supplement: PoliticalNewsItem[] = []
): Promise<PoliticalNewsItem[]> {
  const live: PoliticalNewsItem[] = [];

  await Promise.all(
    POLITICAL_RSS.map(async ({ name, url, region }) => {
      const items = await fetchRssViaJson(url, name, false);
      for (const item of items) {
        if (!GAZA_RE.test(`${item.title_en} ${item.excerpt_en}`)) continue;
        live.push({
          ...item,
          source: name,
          source_region: region,
          statement_type: "media_report",
        });
      }
    })
  );

  return mergeById(supplement, live);
}
