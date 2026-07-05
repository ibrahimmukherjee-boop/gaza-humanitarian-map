import type { NewsItem } from "../types";
import type { PoliticalNewsItem, PoliticalSourceRegion } from "../types/political";
import { isRelevantNews } from "./newsFilter";

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

const NEWS_RSS: { name: string; url: string }[] = [
  { name: "UN News", url: "https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml" },
  { name: "BBC Middle East", url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml" },
  { name: "ReliefWeb", url: "https://reliefweb.int/updates/rss.xml?language=267" },
  { name: "UNRWA", url: "https://www.unrwa.org/newsroom/press-releases/rss.xml" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "OCHA", url: "https://www.unocha.org/rss.xml" },
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
  { name: "WAFA", url: "https://english.wafa.ps/rss.aspx", region: "palestine" },
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

function toNewsItem(
  title: string,
  link: string,
  excerpt: string,
  source: string,
  timestamp: string
): NewsItem | null {
  if (!link || !isRelevantNews(title, excerpt, source)) return null;
  return {
    id: hashId(link),
    title_en: title,
    title_ar: "",
    excerpt_en: excerpt,
    excerpt_ar: "",
    source,
    timestamp,
    url: link,
    tags: ["humanitarian"],
    location_tags: ["Gaza Strip"],
    credibility: "high",
  };
}

function parseRssXml(xml: string, source: string): NewsItem[] {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const out: NewsItem[] = [];

  doc.querySelectorAll("item").forEach((item) => {
    const title = item.querySelector("title")?.textContent?.trim() || "Untitled";
    const link = item.querySelector("link")?.textContent?.trim() || "";
    const excerpt =
      item.querySelector("description")?.textContent?.replace(/<[^>]+>/g, "").trim().slice(0, 400) ||
      title;
    const pub = item.querySelector("pubDate")?.textContent?.trim();
    const ts = pub ? new Date(pub).toISOString() : new Date().toISOString();
    const newsItem = toNewsItem(title, link, excerpt, source, ts);
    if (newsItem) out.push(newsItem);
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

async function fetchViaRss2Json(feedUrl: string, source: string): Promise<NewsItem[]> {
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
      const ts = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
      return toNewsItem(title, link, excerpt, source, ts);
    })
    .filter((item): item is NewsItem => item !== null);
}

async function fetchViaDirectXml(feedUrl: string, source: string): Promise<NewsItem[]> {
  const res = await fetchWithTimeout(feedUrl, { mode: "cors" });
  if (!res.ok) throw new Error(`direct ${res.status}`);
  const items = parseRssXml(await res.text(), source);
  if (!items.length) throw new Error("direct empty");
  return items;
}

async function fetchRssFeed(feedUrl: string, source: string): Promise<NewsItem[]> {
  for (const strategy of [
    () => fetchViaRss2Json(feedUrl, source),
    () => fetchViaDirectXml(feedUrl, source),
  ]) {
    try {
      const items = await strategy();
      if (items.length > 0) return items;
    } catch {
      /* try next */
    }
  }
  throw new Error("no data");
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
  feeds: { name: string; url: string }[]
): Promise<{ items: NewsItem[]; failed: string[] }> {
  const results = await Promise.allSettled(
    feeds.map(({ name, url }) => fetchRssFeed(url, name))
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
