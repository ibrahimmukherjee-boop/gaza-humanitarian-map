import { NavLink, Outlet, useLocation } from "react-router-dom";
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
  { to: "/news", key: "nav.news", liteHidden: true },
  { to: "/survival", key: "nav.survival" },
  { to: "/hotlines", key: "nav.hotlines" },
  { to: "/islamic-guidance", key: "nav.islamic" },
  { to: "/violence-safety", key: "nav.violence_safety" },
  { to: "/political", key: "nav.political", liteHidden: true },
  { to: "/map", key: "nav.map", liteHidden: true },
  { to: "/about", key: "nav.about" },
  { to: "/about#ethics", key: "nav.ethics" },
  { to: "/children-game", key: "nav.children_game", liteHidden: true, subdued: true },
] as const;

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { pathname, hash } = useLocation();
  const { liteMode, offlineReady } = useAppStore();
  useLiveRefresh();

  const { data: meta } = useQuery({
    queryKey: ["meta", liteMode ? "lite" : "full"],
    queryFn: () => api.meta({ lite: liteMode, cacheBust: !liteMode }),
    ...(liteMode ? { staleTime: 30 * 60_000 } : LIVE_META_OPTS),
  });

  useEffect(() => {
    document.body.classList.toggle("lite-mode", liteMode);
    return () => document.body.classList.remove("lite-mode");
  }, [liteMode]);

  return (
    <div className="flex flex-col min-h-[100dvh] safe-area-padding">
      <EthicsBanner />
      {meta && (
        <div className="status-bar flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
          {!liteMode && <LiveIndicator />}
          {meta.news_last_updated && !liteMode && (
            <span>
              {t("news.title")}: {formatRelativeTime(meta.news_last_updated, i18n.language)}
            </span>
          )}
          {meta.political_last_updated && !liteMode && (
            <span>
              · {t("nav.political")}:{" "}
              {formatRelativeTime(meta.political_last_updated, i18n.language)}
            </span>
          )}
          {!meta.news_last_updated && (
            <span>
              {t("home.data_updated")}{" "}
              {formatRelativeTime(meta.last_updated, i18n.language)}
            </span>
          )}
          {liteMode && <span>· {t("lite_mode.active")}</span>}
          {offlineReady && <span>· {t("offline.ready")}</span>}
        </div>
      )}
      <header className="app-header">
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base leading-tight truncate page-title">
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
            .map(({ to, key, ...rest }) => {
              const subdued = "subdued" in rest && rest.subdued;
              const isEthics = to === "/about#ethics";
              const isAboutOnly = to === "/about";
              const isActiveManual = isEthics
                ? pathname === "/about" && hash === "#ethics"
                : isAboutOnly
                  ? pathname === "/about" && hash !== "#ethics"
                  : undefined;
              return (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) => {
                  const active = isActiveManual ?? isActive;
                  return `nav-link snap-start shrink-0 whitespace-nowrap px-3 py-2 rounded-lg min-h-[44px] flex items-center transition-colors ${
                    subdued
                      ? active
                        ? "text-sm font-normal bg-slate-100 text-slate-700 border border-slate-200"
                        : "text-sm font-normal text-slate-400 border border-transparent hover:text-slate-500"
                      : active
                        ? "text-sm font-medium nav-link-active"
                        : "text-sm font-medium nav-link-idle"
                  }`;
                }}
              >
                {t(key)}
              </NavLink>
            );
            })}
        </nav>
      </header>
      <main className="flex-1 overflow-auto overscroll-contain">
        <Outlet />
      </main>
    </div>
  );
}
