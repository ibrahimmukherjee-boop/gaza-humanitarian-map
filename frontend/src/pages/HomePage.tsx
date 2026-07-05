import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import LiveIndicator from "../components/LiveIndicator";
import { LIVE_META_OPTS, LIVE_QUERY_OPTS } from "../hooks/useLiveRefresh";

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
  const queryClient = useQueryClient();
  const { liteMode, setLiteMode, offlineSavedAt, markOfflineSaved, setOfflineReady } =
    useAppStore();
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const { data: meta } = useQuery({
    queryKey: ["meta", liteMode ? "lite" : "full"],
    queryFn: () => api.meta({ lite: liteMode, cacheBust: !liteMode }),
    ...(liteMode ? { staleTime: 30 * 60_000 } : LIVE_META_OPTS),
  });

  const { dataUpdatedAt: newsCheckedAt } = useQuery({
    queryKey: ["news", "full"],
    queryFn: () => api.news({ cacheBust: true }),
    enabled: !liteMode,
    ...LIVE_QUERY_OPTS,
  });

  useEffect(() => {
    isDataCached(liteMode).then(setOfflineReady);
  }, [liteMode, offlineSavedAt, setOfflineReady]);

  function toggleLiteMode() {
    const next = !liteMode;
    setLiteMode(next);
    queryClient.invalidateQueries();
  }

  async function handleSaveOffline() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const { saved, total } = await saveAllOffline(liteMode);
      markOfflineSaved();
      setOfflineReady(true);
      setSaveMsg(
        saved === total
          ? t("offline.saved")
          : `${t("offline.saved")} (${saved}/${total})`
      );
    } catch {
      setSaveMsg(t("error"));
    } finally {
      setSaving(false);
    }
  }

  const sizeKb = liteMode ? estimateLiteSizeKb() : estimateFullSizeKb();

  return (
    <div className="max-w-lg mx-auto p-4 space-y-5">
      {meta && (
        <div className="card">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="font-medium text-slate-800">{t("home.data_updated")}</p>
            {!liteMode && <LiveIndicator />}
          </div>
          <p className="text-xs mt-0.5 text-slate-500">
            {!liteMode && newsCheckedAt > 0 ? (
              <>
                {t("news.live_checked")}:{" "}
                {formatRelativeTime(new Date(newsCheckedAt).toISOString(), i18n.language)}
              </>
            ) : (
              formatRelativeTime(meta.last_updated, i18n.language)
            )}
            {" · "}
            {meta.facilities_count} {t("home.facilities")} · {meta.news_count}{" "}
            {t("home.news_items")}
          </p>
          <p className="text-xs mt-1 text-slate-400">
            {isAr ? meta.note_ar : meta.note_en}
          </p>
        </div>
      )}

      <HumanitarianToday />

      <div className="card space-y-3">
        <p className="text-sm font-medium text-slate-700">{t("home.settings")}</p>
        <div className="flex flex-wrap gap-2">
          <button
            className={`btn ${liteMode ? "btn-primary" : "btn-ghost"}`}
            onClick={toggleLiteMode}
          >
            {t("lite_mode.toggle")} {liteMode ? "✓" : ""}
          </button>
          <button className="btn btn-primary" onClick={handleSaveOffline} disabled={saving}>
            {saving ? t("loading") : t("offline.save")}
          </button>
        </div>
        {liteMode && (
          <p className="text-xs text-slate-500">{t("lite_mode.description", { size: sizeKb })}</p>
        )}
        {saveMsg && <p className="text-xs text-green-700">{saveMsg}</p>}
        {offlineSavedAt && !saveMsg && (
          <p className="text-xs text-green-700">
            {t("offline.saved")} {formatRelativeTime(offlineSavedAt, i18n.language)}
          </p>
        )}
      </div>

      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
          {t("home.primary")}
        </h2>
        <div className="grid gap-2">
          {primaryLinks.map(({ to, key, icon }) => (
            <Link key={to} to={to} className="card flex items-center gap-3 py-3">
              <span className="text-xl" aria-hidden>
                {icon}
              </span>
              <span className="font-medium text-slate-800">{t(key)}</span>
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
              <Link key={to} to={to} className="btn btn-ghost">
                {t(key)}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
