import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import EthicsBanner from "./EthicsBanner";
import LanguageToggle from "./LanguageToggle";
import LiveIndicator from "./LiveIndicator";
import { useAppStore } from "../store/appStore";
import { api, formatRelativeTime } from "../services/api";
import { useLiveRefresh, LIVE_META_OPTS } from "../hooks/useLiveRefresh";

const navItems = [
  { to: "/", key: "nav.home" },
  { to: "/resources", key: "nav.resources" },
  { to: "/children-game", key: "nav.children_game", highlight: true },
  { to: "/news", key: "nav.news", liteHidden: true },
  { to: "/survival", key: "nav.survival" },
  { to: "/hotlines", key: "nav.hotlines" },
  { to: "/islamic-guidance", key: "nav.islamic" },
  { to: "/violence-safety", key: "nav.violence_safety" },
  { to: "/political", key: "nav.political", liteHidden: true },
  { to: "/map", key: "nav.map", liteHidden: true },
  { to: "/about", key: "nav.about" },
] as const;

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { liteMode, offlineReady } = useAppStore();
  useLiveRefresh();

  const { data: meta } = useQuery({
    queryKey: ["meta", liteMode ? "lite" : "full"],
    queryFn: () => api.meta({ lite: liteMode, cacheBust: !liteMode }),
    ...(!liteMode ? LIVE_META_OPTS : { staleTime: 30 * 60_000 }),
  });

  useEffect(() => {
    document.body.classList.toggle("lite-mode", liteMode);
    return () => document.body.classList.remove("lite-mode");
  }, [liteMode]);

  return (
    <div className="flex flex-col min-h-[100dvh] safe-area-padding">
      <EthicsBanner />
      {meta && (
        <div className="status-bar-glass px-3 py-1.5 text-center text-xs text-slate-700 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
          {!liteMode && <LiveIndicator />}
          {meta.news_last_updated ? (
            <span>
              {t("news.title")}: {formatRelativeTime(meta.news_last_updated, i18n.language)}
            </span>
          ) : (
            <span>
              {t("home.data_updated")}{" "}
              {formatRelativeTime(meta.last_updated, i18n.language)}
            </span>
          )}
          {liteMode && <span>· {t("lite_mode.active")}</span>}
          {offlineReady && <span>· {t("offline.ready")}</span>}
        </div>
      )}
      <header className="glass-header sticky top-0 z-50 shrink-0">
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-lg font-bold leading-tight truncate page-title">
              {t("title")}
            </h1>
          </div>
          <LanguageToggle />
        </div>
        <nav
          className="max-w-7xl mx-auto px-2 pb-2 flex gap-1.5 overflow-x-auto snap-x snap-mandatory scrollbar-none"
          aria-label="Main navigation"
        >
          {navItems
            .filter((item) => !liteMode || !("liteHidden" in item && item.liteHidden))
            .map(({ to, key, ...rest }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `nav-link snap-start shrink-0 whitespace-nowrap px-3 py-2 rounded-xl text-sm font-medium min-h-[44px] flex items-center transition-all ${
                    isActive
                      ? "glass-nav-active"
                      : "highlight" in rest && rest.highlight
                        ? "glass-nav-idle ring-2 ring-amber-300/60"
                        : "glass-nav-idle"
                  }`
                }
              >
                {"highlight" in rest && rest.highlight ? "🐿️ " : ""}
                {t(key)}
              </NavLink>
            ))}
        </nav>
      </header>
      <main className="flex-1 overflow-auto overscroll-contain">
        <Outlet />
      </main>
    </div>
  );
}
