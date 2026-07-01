import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, formatRelativeTime } from "../services/api";
import { useAppStore } from "../store/appStore";
import type { GazaArea, ResourceCategory } from "../types";
import { GAZA_AREAS } from "../types";

const CATEGORIES: ResourceCategory[] = [
  "all",
  "hospitals",
  "clinics",
  "water",
  "food",
  "shelters",
];

export default function ResourcesPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { selectedArea, resourceCategory, setSelectedArea, setResourceCategory } = useAppStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["facilities"],
    queryFn: api.facilities,
  });

  const filtered = useMemo(() => {
    if (!data?.features) return [];
    return data.features
      .filter((f) => {
        const area = (f.properties.area || "unknown") as GazaArea;
        const areaOk = selectedArea === "all" || area === selectedArea;
        const typeOk =
          resourceCategory === "all" || f.properties.type === resourceCategory;
        return areaOk && typeOk;
      })
      .sort(
        (a, b) =>
          new Date(b.properties.timestamp).getTime() -
          new Date(a.properties.timestamp).getTime()
      );
  }, [data, selectedArea, resourceCategory]);

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold">{t("resources.title")}</h2>
        <p className="text-sm text-slate-500">{t("resources.subtitle")}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">{t("resources.area")}</label>
        <select
          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white"
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value as GazaArea)}
        >
          <option value="all">{t("resources.all_areas")}</option>
          {GAZA_AREAS.map((a) => (
            <option key={a} value={a}>
              {t(`resources.areas.${a}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`btn text-xs ${resourceCategory === cat ? "btn-primary" : "btn-ghost border border-slate-200"}`}
            onClick={() => setResourceCategory(cat)}
          >
            {t(`resources.categories.${cat}`)}
          </button>
        ))}
      </div>

      <p className="text-sm text-slate-600">
        {t("resources.count", { count: filtered.length })}
      </p>

      {isLoading && <p>{t("loading")}</p>}
      {error && <p className="text-red-600">{t("error")}</p>}

      <div className="space-y-2">
        {filtered.map((f) => {
          const p = f.properties;
          const title = isAr ? p.title_ar || p.title_en : p.title_en;
          const areaLabel = isAr
            ? p.area_ar || t(`resources.areas.${p.area || "unknown"}`)
            : p.area_en || t(`resources.areas.${p.area || "unknown"}`);
          const status = p.status || "unknown";
          return (
            <article key={f.id} className="card py-3">
              <div className="flex flex-wrap gap-1 mb-1">
                <span className="badge bg-blue-50 text-blue-800">{areaLabel}</span>
                <span
                  className={`badge ${
                    status === "open"
                      ? "bg-green-100 text-green-800"
                      : status === "closed"
                        ? "bg-red-100 text-red-800"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {t(`resources.status.${status}`)}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {t("source")}: {p.source} · {formatRelativeTime(p.timestamp, i18n.language)}
              </p>
              <p className="text-xs text-amber-700 mt-1">{t("resources.verify_locally")}</p>
            </article>
          );
        })}
        {filtered.length === 0 && !isLoading && (
          <p className="text-slate-500">{t("no_results")}</p>
        )}
      </div>
    </div>
  );
}
