import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, formatRelativeTime } from "../services/api";

export default function TimelinePage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const { data: news = [] } = useQuery({
    queryKey: ["news", "full"],
    queryFn: () => api.news(),
  });
  const { data: facilities } = useQuery({
    queryKey: ["facilities", "full"],
    queryFn: () => api.facilities(),
  });

  const events = useMemo(() => {
    const items: {
      id: string;
      timestamp: string;
      title: string;
      source: string;
      kind: "news" | "facility";
    }[] = [];

    for (const n of news) {
      items.push({
        id: `news-${n.id}`,
        timestamp: n.timestamp,
        title: isAr ? n.title_ar || n.title_en : n.title_en,
        source: n.source,
        kind: "news",
      });
    }

    for (const f of facilities?.features ?? []) {
      items.push({
        id: `fac-${f.id}`,
        timestamp: f.properties.timestamp,
        title: isAr
          ? f.properties.title_ar || f.properties.title_en
          : f.properties.title_en,
        source: f.properties.source,
        kind: "facility",
      });
    }

    return items.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [news, facilities, isAr]);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold">{t("timeline.title")}</h2>
        <p className="text-sm text-slate-500">{t("timeline.subtitle")}</p>
        <p className="text-xs text-slate-400 mt-1">
          {events.length} {t("timeline.events")}
        </p>
      </div>

      <div className="space-y-0 border-s-2 border-slate-200 ms-2">
        {events.map((e) => (
          <div key={e.id} className="relative ps-6 pb-4">
            <span
              className={`absolute start-[-5px] top-1.5 w-2.5 h-2.5 rounded-full ${
                e.kind === "news" ? "bg-purple-500" : "bg-blue-500"
              }`}
            />
            <time className="text-xs text-slate-500">
              {formatRelativeTime(e.timestamp, i18n.language)}
            </time>
            <p className="font-medium text-slate-900">{e.title}</p>
            <p className="text-xs text-slate-500">{e.source}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
