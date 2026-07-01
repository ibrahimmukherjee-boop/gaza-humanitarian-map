import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";
import type { Hotline } from "../types";

export default function HotlinesPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const { data: hotlines = [], isLoading } = useQuery({
    queryKey: ["hotlines"],
    queryFn: api.hotlines,
  });

  const grouped = hotlines.reduce<Record<string, Hotline[]>>((acc, h) => {
    if (!acc[h.category]) acc[h.category] = [];
    acc[h.category].push(h);
    return acc;
  }, {});

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold">{t("hotlines.title")}</h2>
        <p className="text-sm text-slate-500">{t("hotlines.subtitle")}</p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        {t("hotlines.verify_note")}
      </div>

      {isLoading && <p>{t("loading")}</p>}

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category}>
          <h3 className="font-semibold text-slate-800 mb-2">
            {t(`hotlines.categories.${category as "medical"}`)}
          </h3>
          <div className="space-y-2">
            {items.map((h) => (
              <div key={h.id} className="card py-3">
                <h4 className="font-semibold text-lg text-slate-900">
                  {isAr ? h.name_ar || h.name_en : h.name_en}
                </h4>
                {h.number_display && (
                  <a
                    href={h.number ? `tel:${h.number.replace(/\s/g, "")}` : h.url}
                    className="block text-2xl font-bold text-blue-700 my-2 tracking-wide"
                  >
                    {h.number_display}
                  </a>
                )}
                <p className="text-sm text-slate-600">
                  {isAr ? h.description_ar || h.description_en : h.description_en}
                </p>
                <p className="text-xs text-slate-400 mt-1">{h.source}</p>
                {h.url && (
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 mt-1 inline-block"
                  >
                    {t("read_more")} →
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
