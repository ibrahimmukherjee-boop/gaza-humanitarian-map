import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, formatRelativeTime } from "../services/api";
import { computeDiscourseMetrics } from "../services/discourseMetrics";
import DiscourseMetricsPanel from "../components/DiscourseMetricsPanel";
import type { PoliticalNewsItem, PoliticalSourceRegion } from "../types/political";

export default function PoliticalNewsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [regionFilter, setRegionFilter] = useState<PoliticalSourceRegion | "all">("all");
  const [showMethodology, setShowMethodology] = useState(false);

  const { data: articles = [], isLoading, error } = useQuery({
    queryKey: ["political_news"],
    queryFn: api.politicalNews,
  });

  const metrics = useMemo(() => computeDiscourseMetrics(articles, 48), [articles]);

  const filtered = useMemo(() => {
    const list =
      regionFilter === "all"
        ? articles
        : articles.filter((a) => a.source_region === regionFilter);
    return [...list].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [articles, regionFilter]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold">{t("political.title")}</h2>
        <p className="text-sm text-slate-500">{t("political.subtitle")}</p>
      </div>

      <div
        className="rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 leading-relaxed"
        role="note"
      >
        <strong>{t("political.disclaimer_title")}:</strong> {t("political.disclaimer")}
      </div>

      {!isLoading && !error && <DiscourseMetricsPanel metrics={metrics} />}

      <details
        className="card text-sm"
        open={showMethodology}
        onToggle={(e) => setShowMethodology((e.target as HTMLDetailsElement).open)}
      >
        <summary className="font-semibold cursor-pointer text-slate-800">
          {t("political.methodology_title")}
        </summary>
        <ul className="mt-2 space-y-1 text-slate-600 list-disc ps-4">
          {(t("political.methodology_items", { returnObjects: true }) as string[]).map(
            (item, i) => (
              <li key={i}>{item}</li>
            )
          )}
        </ul>
      </details>

      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-sm text-slate-600">{t("political.filter_region")}:</label>
        <select
          className="text-sm border border-slate-200 rounded-md px-3 py-1.5"
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value as PoliticalSourceRegion | "all")}
        >
          <option value="all">{t("all")}</option>
          <option value="israel">{t("political.regions.israel")}</option>
          <option value="palestine">{t("political.regions.palestine")}</option>
          <option value="international">{t("political.regions.international")}</option>
        </select>
      </div>

      {isLoading && <p className="text-slate-500">{t("loading")}</p>}
      {error && <p className="text-red-600">{t("error")}</p>}

      <div className="space-y-3">
        {filtered.map((item) => (
          <PoliticalCard key={item.id} item={item} isAr={isAr} />
        ))}
        {filtered.length === 0 && !isLoading && (
          <p className="text-slate-500">{t("no_results")}</p>
        )}
      </div>
    </div>
  );
}

function PoliticalCard({ item, isAr }: { item: PoliticalNewsItem; isAr: boolean }) {
  const { t, i18n } = useTranslation();
  const title = isAr ? item.title_ar || item.title_en : item.title_en;
  const excerpt = isAr ? item.excerpt_ar || item.excerpt_en : item.excerpt_en;

  return (
    <article className="card">
      <div className="flex flex-wrap gap-2 mb-1">
        <span className="badge bg-slate-100 text-slate-700">
          {t(`political.regions.${item.source_region}`)}
        </span>
        <span className="badge bg-purple-50 text-purple-800">
          {t(`political.statement_types.${item.statement_type}`)}
        </span>
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600 mt-1">{excerpt}</p>
      <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-2">
        <span>{item.source}</span>
        <span>·</span>
        <span>{formatRelativeTime(item.timestamp, i18n.language)}</span>
      </div>
      {item.url && item.url !== "#" && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline mt-2 inline-block"
        >
          {t("read_more")} →
        </a>
      )}
    </article>
  );
}
