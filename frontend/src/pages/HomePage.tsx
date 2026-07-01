import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, formatRelativeTime } from "../services/api";
import { useAppStore } from "../store/appStore";
import {
  saveAllOffline,
  isDataCached,
  estimateLiteSizeKb,
  estimateFullSizeKb,
} from "../services/offline";
import HumanitarianToday from "../components/HumanitarianToday";

const primaryLinks = [
  { to: "/resources", key: "home.links.resources", icon: "🏥" },
  { to: "/survival", key: "home.links.survival", icon: "💧" },
  { to: "/hotlines", key: "home.links.hotlines", icon: "📞" },
  { to: "/islamic-guidance", key: "home.links.islamic", icon: "🤲" },
  { to: "/violence-safety", key: "home.links.violence", icon: "🛡️" },
] as const;

const secondaryLinks = [
  { to: "/map", key: "nav.map" },
  { to: "/news", key: "nav.news" },
  { to: "/political", key: "nav.political" },
  { to: "/timeline", key: "nav.timeline" },
] as const;

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { liteMode, setLiteMode, offlineSavedAt, markOfflineSaved, setOfflineReady } =
    useAppStore();
  const [saving, setSaving] = useState(false);

  const { data: meta } = useQuery({
    queryKey: ["meta", liteMode ? "lite" : "full"],
    queryFn: () => api.meta({ lite: liteMode }),
    staleTime: liteMode ? 30 * 60_000 : 5 * 60_000,
  });

  useEffect(() => {
    isDataCached(liteMode).then(setOfflineReady);
  }, [liteMode, offlineSavedAt, setOfflineReady]);

  async function handleSaveOffline() {
    setSaving(true);
    try {
      await saveAllOffline(liteMode);
      markOfflineSaved();
      setOfflineReady(true);
    } finally {
      setSaving(false);
    }
  }

  const sizeKb = liteMode ? estimateLiteSizeKb() : estimateFullSizeKb();

  return (
    <div className="max-w-lg mx-auto p-4 space-y-5">
      {meta && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
          <p className="font-medium">{t("home.data_updated")}</p>
          <p className="text-xs mt-0.5">
            {formatRelativeTime(meta.last_updated, i18n.language)} ·{" "}
            {meta.facilities_count} {t("home.facilities")} · {meta.news_count}{" "}
            {t("home.news_items")}
          </p>
          <p className="text-xs mt-1 opacity-80">{isAr ? meta.note_ar : meta.note_en}</p>
        </div>
      )}

      <HumanitarianToday />

      <div className="flex flex-wrap gap-2">
        <button
          className={`btn ${liteMode ? "btn-primary" : "btn-ghost border border-slate-200"}`}
          onClick={() => setLiteMode(!liteMode)}
        >
          {t("lite_mode.toggle")} {liteMode ? "✓" : ""}
        </button>
        <button className="btn btn-primary" onClick={handleSaveOffline} disabled={saving}>
          {saving ? t("loading") : t("offline.save")}
        </button>
      </div>

      {liteMode && (
        <p className="text-xs text-slate-600">{t("lite_mode.description", { size: sizeKb })}</p>
      )}

      {offlineSavedAt && (
        <p className="text-xs text-green-700">
          {t("offline.saved")} {formatRelativeTime(offlineSavedAt, i18n.language)}
          {liteMode ? ` (${t("lite_mode.active")})` : ""}
        </p>
      )}

      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
          {t("home.primary")}
        </h2>
        <div className="grid gap-2">
          {primaryLinks.map(({ to, key, icon }) => (
            <Link
              key={to}
              to={to}
              className="card flex items-center gap-3 py-4 hover:border-blue-300 transition-colors"
            >
              <span className="text-2xl" aria-hidden>
                {icon}
              </span>
              <span className="font-semibold text-slate-900">{t(key)}</span>
            </Link>
          ))}
        </div>
      </section>

      {!liteMode && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
            {t("home.secondary")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {secondaryLinks.map(({ to, key }) => (
              <Link key={to} to={to} className="btn btn-ghost border border-slate-200">
                {t(key)}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
