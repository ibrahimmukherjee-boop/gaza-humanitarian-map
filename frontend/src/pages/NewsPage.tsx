import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, formatRelativeTime } from "../services/api";
import type { NewsItem } from "../types";

export default function NewsPage() {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<"feed" | "timeline">("feed");
  const [topic, setTopic] = useState<string>("all");

  const { data: news = [], isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["news"],
    queryFn: api.news,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
  });

  const filtered = useMemo(() => {
    if (topic === "all") return news;
    return news.filter((n) => n.tags.includes(topic));
  }, [news, topic]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [filtered]
  );

  const isAr = i18n.language === "ar";

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold">{t("news.title")}</h2>
        <p className="text-sm text-slate-500">{t("news.subtitle")}</p>
        <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" aria-hidden />
          {t("news.auto_refresh")}{" "}
          {dataUpdatedAt > 0 && (
            <span className="text-slate-500">
              · {formatRelativeTime(new Date(dataUpdatedAt).toISOString(), i18n.language)}
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="text-sm border border-slate-200 rounded-md px-3 py-1.5"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          <option value="all">{t("all")}</option>
          {(["humanitarian", "infrastructure", "aid", "displacement", "health"] as const).map(
            (tag) => (
              <option key={tag} value={tag}>
                {t(`news.topics.${tag}`)}
              </option>
            )
          )}
        </select>
        <div className="flex gap-1 ms-auto">
          <button
            className={`btn ${view === "feed" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setView("feed")}
          >
            {t("news.feed")}
          </button>
          <button
            className={`btn ${view === "timeline" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setView("timeline")}
          >
            {t("news.timeline")}
          </button>
        </div>
      </div>

      {isLoading && <p className="text-slate-500">{t("loading")}</p>}
      {error && <p className="text-red-600">{t("error")}</p>}

      {view === "feed" ? (
        <div className="space-y-3">
          {sorted.map((item) => (
            <NewsCard key={item.id} item={item} isAr={isAr} />
          ))}
          {sorted.length === 0 && !isLoading && (
            <p className="text-slate-500">{t("no_results")}</p>
          )}
        </div>
      ) : (
        <div className="relative border-s border-slate-200 ms-3 space-y-4">
          {sorted.map((item) => (
            <div key={item.id} className="relative ps-6">
              <span className="absolute start-[-5px] top-2 w-2.5 h-2.5 rounded-full bg-blue-600" />
              <NewsCard item={item} isAr={isAr} compact />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewsCard({ item, isAr, compact }: { item: NewsItem; isAr: boolean; compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const title = isAr ? item.title_ar || item.title_en : item.title_en;
  const excerpt = isAr ? item.excerpt_ar || item.excerpt_en : item.excerpt_en;

  const credClass =
    item.credibility === "high"
      ? "bg-green-100 text-green-800"
      : item.credibility === "medium"
        ? "bg-yellow-100 text-yellow-800"
        : "bg-slate-100 text-slate-600";

  return (
    <article className={`card ${compact ? "py-3" : ""}`}>
      <div className="flex flex-wrap gap-2 items-start justify-between mb-1">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <span className={`badge ${credClass}`}>
          {t("news.credibility")}: {t(item.credibility)}
        </span>
      </div>
      {!compact && <p className="text-sm text-slate-600 mb-2">{excerpt}</p>}
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <span>{item.source}</span>
        <span>·</span>
        <span>{formatRelativeTime(item.timestamp, i18n.language)}</span>
        {item.tags.map((tag) => (
          <span key={tag} className="badge bg-blue-50 text-blue-700">
            {t(`news.topics.${tag as "humanitarian"}`, tag)}
          </span>
        ))}
      </div>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:underline mt-2 inline-block"
      >
        {t("read_more")} →
      </a>
    </article>
  );
}
