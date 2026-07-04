import type { NewsItem } from "../types";
import type { PoliticalNewsItem, PoliticalSourceRegion } from "../types/political";

const GAZA_RE =
  /gaza|palestin|humanitarian|refugee|unrwa|rafah|khan younis|hamas|israeli|idf|west bank|ceasefire|hostage/i;

const FETCH_TIMEOUT_MS = 5_000;

export interface LiveFeedMeta {
  lastSuccessAt: number;
  liveItemCount: number;
  failedSources: string[];
}

let newsMeta: LiveFeedMeta = { lastSuccessAt: 0, liveItemCount: 0, failedSources: [] };
let politicalMeta: LiveFeedMeta = { lastSuccessAt: 0, liveItemCount: 0, failedSources: [] };

export function getLiveFeedMeta(kind: "news" | "political"): LiveFeedMeta {
  return kind === "news" ? { ...newsMeta } : { ...politicalMeta };
}

function setLiveFeedMeta(kind: "news" | "political", meta: LiveFeedMeta): void {
  if (kind === "news") newsMeta = meta;
  else politicalMeta = meta;
}

const NEWS_RSS: { name: string; url: string; filter?: boolean }[] = [
  { name: "UN News", url: "https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml" },
  { name: "BBC Middle East", url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", filter: true },
  { name: "ReliefWeb", url: "https://reliefweb.int/updates/rss.xml?language=267", filter: true },
  { name: "UNRWA", url: "https://www.unrwa.org/newsroom/press-releases/rss.xml", filter: true },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", filter: true },
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
  { name: "ReliefWeb", url: "https://reliefweb.int/updates/rss.xml?language=267", region: "international" },
  { name: "Times of Israel", url: "https://www.timesofisrael.com/feed/", region: "israel" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", region: "international" },
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

function parseRssXml(xml: string, source: string, filterGaza = false): NewsItem[] {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const nodes = doc.querySelectorAll("item");
  const out: NewsItem[] = [];

  nodes.forEach((item) => {
    const title = item.querySelector("title")?.textContent?.trim() || "Untitled";
    const link = item.querySelector("link")?.textContent?.trim() || "";
    const excerpt =
      item.querySelector("description")?.textContent?.replace(/<[^>]+>/g, "").trim().slice(0, 400) ||
      title;
    const pub = item.querySelector("pubDate")?.textContent?.trim();
    if (!link) return;
    if (filterGaza && !GAZA_RE.test(`${title} ${excerpt}`)) return;

    out.push({
      id: hashId(link),
      title_en: title,
      title_ar: "",
      excerpt_en: excerpt,
      excerpt_ar: "",
      source,
      timestamp: pub ? new Date(pub).toISOString() : new Date().toISOString(),
      url: link,
      tags: ["humanitarian"],
      location_tags: ["Gaza Strip"],
      credibility: "high",
    });
  });

  return out;
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

async function fetchViaRss2Json(
  feedUrl: string,
  source: string,
  filterGaza: boolean
): Promise<NewsItem[]> {
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
  const res = await fetchWithTimeout(apiUrl);
  if (!res.ok) throw new Error(`rss2json ${res.status}`);
  const data = (await res.json()) as Rss2JsonResponse;
  if (data.status !== "ok" || !data.items?.length) throw new Error("rss2json empty");

  return data.items
    .map((item): NewsItem | null => {
      const title = item.title?.trim() || "Untitled";
      const link = item.link?.trim() || "";
      const excerpt =
        item.description?.replace(/<[^>]+>/g, "").trim().slice(0, 400) || title;
      if (!link) return null;
      if (filterGaza && !GAZA_RE.test(`${title} ${excerpt}`)) return null;
      return {
        id: hashId(link),
        title_en: title,
        title_ar: "",
        excerpt_en: excerpt,
        excerpt_ar: "",
        source,
        timestamp: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        url: link,
        tags: ["humanitarian"],
        location_tags: ["Gaza Strip"],
        credibility: "high",
      };
    })
    .filter((item): item is NewsItem => item !== null);
}

async function fetchViaDirectXml(
  feedUrl: string,
  source: string,
  filterGaza: boolean
): Promise<NewsItem[]> {
  const res = await fetchWithTimeout(feedUrl, { mode: "cors" });
  if (!res.ok) throw new Error(`direct ${res.status}`);
  const xml = await res.text();
  const items = parseRssXml(xml, source, filterGaza);
  if (!items.length) throw new Error("direct empty");
  return items;
}

/** Try rss2json, then direct RSS — whichever responds first with data. */
async function fetchRssFeed(
  feedUrl: string,
  source: string,
  filterGaza = false
): Promise<NewsItem[]> {
  const strategies = [
    () => fetchViaRss2Json(feedUrl, source, filterGaza),
    () => fetchViaDirectXml(feedUrl, source, filterGaza),
  ];

  let lastError: unknown;
  for (const strategy of strategies) {
    try {
      const items = await strategy();
      if (items.length > 0) return items;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError ?? new Error("no data");
}

export function mergeById<T extends { id: string; timestamp: string }>(base: T[], live: T[]): T[] {
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

async function fetchAllRssFeeds(
  feeds: { name: string; url: string; filter?: boolean }[]
): Promise<{ items: NewsItem[]; failed: string[] }> {
  const results = await Promise.allSettled(
    feeds.map(({ name, url, filter }) => fetchRssFeed(url, name, !!filter))
  );

  const items: NewsItem[] = [];
  const failed: string[] = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled" && result.value.length > 0) {
      items.push(...result.value);
    } else {
      failed.push(feeds[i].name);
    }
  });

  return { items, failed };
}

/** Fetch headlines in the browser — parallel sources, independent failures. */
export async function fetchLiveNews(supplement: NewsItem[] = []): Promise<NewsItem[]> {
  const { items, failed } = await fetchAllRssFeeds(NEWS_RSS);
  const merged = mergeById(supplement, items);
  setLiveFeedMeta("news", {
    lastSuccessAt: items.length > 0 ? Date.now() : newsMeta.lastSuccessAt,
    liveItemCount: items.length,
    failedSources: failed,
  });
  return merged;
}

export async function fetchLivePolitical(
  supplement: PoliticalNewsItem[] = []
): Promise<PoliticalNewsItem[]> {
  const { items, failed } = await fetchAllRssFeeds(
    POLITICAL_RSS.map(({ name, url }) => ({ name, url }))
  );

  const live: PoliticalNewsItem[] = [];
  for (const item of items) {
    if (!GAZA_RE.test(`${item.title_en} ${item.excerpt_en}`)) continue;
    const feed = POLITICAL_RSS.find((f) => f.name === item.source);
    live.push({
      ...item,
      source_region: feed?.region ?? "international",
      statement_type: "media_report",
    });
  }

  const merged = mergeById(supplement, live);
  setLiveFeedMeta("political", {
    lastSuccessAt: live.length > 0 ? Date.now() : politicalMeta.lastSuccessAt,
    liveItemCount: live.length,
    failedSources: failed,
  });
  return merged;
}
