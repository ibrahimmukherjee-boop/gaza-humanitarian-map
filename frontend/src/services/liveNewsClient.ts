import type { NewsItem } from "../types";
import type { PoliticalNewsItem, PoliticalSourceRegion } from "../types/political";

const GAZA_RE = /gaza|palestin|humanitarian|refugee|unrwa|rafah|khan younis|hamas|israeli|idf|west bank/i;

const RELIEFWEB =
  "https://api.reliefweb.int/v1/reports?appname=gaza-humanitarian-map&profile=list&slim=1&limit=25&query[value]=Gaza&query[operator]=AND";

const NEWS_RSS: { name: string; url: string; filter?: boolean }[] = [
  { name: "UN News", url: "https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml" },
  { name: "BBC Middle East", url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml" },
  { name: "ReliefWeb", url: "https://reliefweb.int/updates/rss.xml?language=267" },
];

const POLITICAL_RSS: { name: string; url: string; region: PoliticalSourceRegion }[] = [
  { name: "UN News", url: "https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml", region: "international" },
  { name: "BBC Middle East", url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", region: "international" },
  { name: "Times of Israel", url: "https://www.timesofisrael.com/feed/", region: "israel" },
];

function hashId(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0").slice(0, 12);
}

function parseRssItems(xml: string, source: string, filterGaza = false): NewsItem[] {
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
    const ts = pub ? new Date(pub).toISOString() : new Date().toISOString();

    if (!link) return;
    const text = `${title} ${excerpt}`;
    if (filterGaza && !GAZA_RE.test(text)) return;

    out.push({
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
    });
  });

  return out;
}

async function fetchRss(url: string): Promise<string | null> {
  try {
    const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxy, { cache: "no-store" });
    if (res.ok) return res.text();
  } catch {
    /* skip */
  }
  return null;
}

async function fetchReliefWeb(): Promise<NewsItem[]> {
  try {
    const res = await fetch(RELIEFWEB, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((entry: { fields: Record<string, unknown> }) => {
      const fields = entry.fields || {};
      const url = (fields.url as string) || "";
      const title = (fields.title as string) || "Untitled";
      const body = (fields.body as string) || "";
      const date =
        ((fields.date as { created?: string })?.created) || new Date().toISOString();
      const sourceArr = fields.source as { name?: string }[] | undefined;
      const source = sourceArr?.[0]?.name || "ReliefWeb";
      return {
        id: hashId(url),
        title_en: title,
        title_ar: "",
        excerpt_en: (body || title).slice(0, 400),
        excerpt_ar: "",
        source,
        timestamp: date,
        url,
        tags: ["humanitarian"],
        location_tags: ["Gaza Strip"],
        credibility: "high" as const,
      };
    });
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

/** Fetch headlines directly in the browser — runs every poll, no GitHub wait. */
export async function fetchLiveNews(supplement: NewsItem[] = []): Promise<NewsItem[]> {
  const live: NewsItem[] = [...(await fetchReliefWeb())];

  await Promise.all(
    NEWS_RSS.map(async ({ name, url, filter }) => {
      const xml = await fetchRss(url);
      if (xml) live.push(...parseRssItems(xml, name, filter));
    })
  );

  return mergeById(supplement, live);
}

export async function fetchLivePolitical(
  supplement: PoliticalNewsItem[] = []
): Promise<PoliticalNewsItem[]> {
  const live: PoliticalNewsItem[] = [];

  await Promise.all(
    POLITICAL_RSS.map(async ({ name, url, region }) => {
      const xml = await fetchRss(url);
      if (!xml) return;
      const doc = new DOMParser().parseFromString(xml, "text/xml");
      doc.querySelectorAll("item").forEach((item) => {
        const title = item.querySelector("title")?.textContent?.trim() || "Untitled";
        const link = item.querySelector("link")?.textContent?.trim() || "";
        const excerpt =
          item.querySelector("description")?.textContent?.replace(/<[^>]+>/g, "").trim().slice(0, 400) ||
          title;
        if (!link || !GAZA_RE.test(`${title} ${excerpt}`)) return;
        const pub = item.querySelector("pubDate")?.textContent?.trim();
        live.push({
          id: hashId(link),
          title_en: title,
          title_ar: "",
          excerpt_en: excerpt,
          excerpt_ar: "",
          source: name,
          source_region: region,
          statement_type: "media_report",
          timestamp: pub ? new Date(pub).toISOString() : new Date().toISOString(),
          url: link,
          credibility: "high",
        });
      });
    })
  );

  return mergeById(supplement, live);
}
