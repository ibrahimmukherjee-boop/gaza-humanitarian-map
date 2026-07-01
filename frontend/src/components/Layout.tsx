import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import EthicsBanner from "./EthicsBanner";
import LanguageToggle from "./LanguageToggle";
import { useAppStore } from "../store/appStore";
import { api, formatRelativeTime } from "../services/api";

const navItems = [
  { to: "/", key: "nav.home" },
  { to: "/resources", key: "nav.resources" },
  { to: "/survival", key: "nav.survival" },
  { to: "/hotlines", key: "nav.hotlines" },
  { to: "/islamic-guidance", key: "nav.islamic" },
  { to: "/violence-safety", key: "nav.violence_safety" },
  { to: "/map", key: "nav.map" },
  { to: "/news", key: "nav.news" },
  { to: "/about", key: "nav.about" },
] as const;

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { liteMode } = useAppStore();
  const { data: meta } = useQuery({ queryKey: ["meta"], queryFn: api.meta });

  useEffect(() => {
    document.body.classList.toggle("lite-mode", liteMode);
    return () => document.body.classList.remove("lite-mode");
  }, [liteMode]);

  return (
    <div className="flex flex-col h-full min-h-screen">
      <EthicsBanner />
      {meta && (
        <div className="bg-slate-100 border-b border-slate-200 px-3 py-1 text-center text-xs text-slate-600">
          {t("home.data_updated")}{" "}
          {formatRelativeTime(meta.last_updated, i18n.language)}
          {liteMode && ` · ${t("lite_mode.active")}`}
        </div>
      )}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {t("title")}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">{t("subtitle")}</p>
          </div>
          <LanguageToggle />
        </div>
        <nav className="max-w-7xl mx-auto px-2 pb-2 flex gap-1 overflow-x-auto">
          {navItems.map(({ to, key }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `nav-link whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-700 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {t(key)}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
