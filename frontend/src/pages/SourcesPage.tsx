import { useTranslation } from "react-i18next";

const SOURCE_KEYS = ["ocha", "who", "unicef", "reliefweb", "osm", "rss"] as const;

export default function SourcesPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold">{t("sources.title")}</h2>
        <p className="text-sm text-slate-500">{t("sources.subtitle")}</p>
      </div>

      <p className="text-sm text-slate-700">{t("sources.description")}</p>

      <ul className="space-y-2">
        {SOURCE_KEYS.map((key) => (
          <li key={key} className="card py-3 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
            <span className="text-sm">{t(`sources.list.${key}`)}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-slate-500">{t("sources.update_frequency")}</p>
    </div>
  );
}
