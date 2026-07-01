import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { api, formatRelativeTime } from "../services/api";
import { useAppStore } from "../store/appStore";
import { useGeolocation } from "../hooks/useGeolocation";
import { resourcesFromGeoJSON, safeLabel, formatDistance } from "../lib/resources";
import { buildGeoContext, locationConfidence } from "../lib/geoContext";
import { generateAIResponse } from "../lib/aiAssistant";
import type { ScenarioNeed } from "../types/resource";

const SCENARIOS: { id: ScenarioNeed; icon: string; key: string }[] = [
  { id: "general", icon: "📍", key: "today.scenarios.general" },
  { id: "water", icon: "💧", key: "today.scenarios.water" },
  { id: "food", icon: "🍞", key: "today.scenarios.food" },
  { id: "medical", icon: "🏥", key: "today.scenarios.medical" },
  { id: "safety", icon: "🛡️", key: "today.scenarios.safety" },
  { id: "information", icon: "ℹ️", key: "today.scenarios.information" },
];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    limited: "bg-amber-100 text-amber-800",
    uncertain: "bg-slate-100 text-slate-600",
    unknown: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${colors[status] ?? colors.unknown}`}>
      {status}
    </span>
  );
}

export default function HumanitarianToday() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { liteMode, scenarioNeed, setScenarioNeed } = useAppStore();
  const { location, loading: locLoading, error: locError, requestLocation } = useGeolocation();

  const { data: facilities, isLoading } = useQuery({
    queryKey: ["facilities", liteMode ? "lite" : "full"],
    queryFn: () => api.facilities({ lite: liteMode }),
    staleTime: liteMode ? 30 * 60_000 : 5 * 60_000,
  });

  const resources = useMemo(
    () => (facilities ? resourcesFromGeoJSON(facilities, isAr) : []),
    [facilities, isAr]
  );

  const geoContext = useMemo(
    () => buildGeoContext(resources, location, scenarioNeed),
    [resources, location, scenarioNeed]
  );

  const ai = useMemo(
    () => generateAIResponse(location, geoContext, isAr),
    [location, geoContext, isAr]
  );

  const confLabel = location
    ? t(`today.location_confidence.${locationConfidence(location.accuracy)}`)
    : null;

  return (
    <section className="space-y-4" aria-labelledby="today-heading">
      <div>
        <h2 id="today-heading" className="text-lg font-bold text-slate-900">
          {t("today.title")}
        </h2>
        <p className="text-sm text-slate-600">{t("today.subtitle")}</p>
      </div>

      {/* Scenario filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {SCENARIOS.map(({ id, icon, key }) => (
          <button
            key={id}
            onClick={() => setScenarioNeed(id)}
            className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium min-h-[44px] flex items-center gap-1.5 transition-colors ${
              scenarioNeed === id
                ? "bg-blue-700 text-white"
                : "bg-white border border-slate-200 text-slate-700"
            }`}
          >
            <span aria-hidden>{icon}</span>
            {t(key)}
          </button>
        ))}
      </div>

      {/* Location */}
      <div className="card space-y-2">
        <h3 className="font-semibold text-slate-900">{t("today.your_situation")}</h3>
        {location ? (
          <p className="text-sm text-slate-600">
            {t("today.location_set")} · {confLabel}
            {location.accuracy > 0 && (
              <span className="text-xs block mt-0.5 opacity-70">
                ±{Math.round(location.accuracy)}m
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm text-slate-600">{t("today.location_prompt")}</p>
        )}
        <button
          className="btn btn-primary w-full sm:w-auto"
          onClick={requestLocation}
          disabled={locLoading}
        >
          {locLoading ? t("loading") : t("today.use_location")}
        </button>
        {locError === "denied" && (
          <p className="text-xs text-amber-700">{t("today.location_denied")}</p>
        )}
        {locError === "unsupported" && (
          <p className="text-xs text-amber-700">{t("today.location_unsupported")}</p>
        )}
      </div>

      {/* AI summary */}
      <div className="card border-blue-200 bg-blue-50/50 space-y-2">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <span aria-hidden>🤖</span> {t("today.ai_summary")}
        </h3>
        <p className="text-sm text-slate-800">{ai.summary}</p>
        {ai.immediateActions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
              {t("today.immediate_actions")}
            </p>
            <ul className="text-sm space-y-1">
              {ai.immediateActions.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-blue-600 shrink-0">→</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Nearest essentials */}
      {!isLoading && (
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { r: geoContext.nearestWater, icon: "💧", key: "today.nearest_water" },
            { r: geoContext.nearestMedical, icon: "🏥", key: "today.nearest_medical" },
            { r: geoContext.nearestFood, icon: "🍞", key: "today.nearest_food" },
            { r: geoContext.nearestShelter, icon: "🏠", key: "today.nearest_shelter" },
          ].map(({ r, icon, key }) =>
            r ? (
              <div key={key} className="card py-3">
                <p className="text-xs text-slate-500">{icon} {t(key)}</p>
                <p className="font-medium text-sm mt-0.5">{safeLabel(r, isAr)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {location && r.distanceKm != null
                    ? formatDistance(r.distanceKm, i18n.language)
                    : "—"}{" "}
                  · {formatRelativeTime(r.lastUpdated, i18n.language)}
                </p>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Ranked nearby */}
      {geoContext.nearbyAid.length > 0 && (
        <div className="card space-y-2">
          <h3 className="font-semibold text-slate-900">{t("today.nearby_resources")}</h3>
          <ul className="divide-y divide-slate-100">
            {geoContext.nearbyAid.slice(0, 6).map((r) => (
              <li key={r.id} className="py-2 flex justify-between gap-2 items-start">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{safeLabel(r, isAr)}</p>
                  <p className="text-xs text-slate-500">
                    {r.source} · {formatRelativeTime(r.lastUpdated, i18n.language)}
                  </p>
                </div>
                <div className="text-end shrink-0">
                  {r.distanceKm != null && (
                    <p className="text-sm font-medium text-blue-700">
                      {formatDistance(r.distanceKm, i18n.language)}
                    </p>
                  )}
                  <StatusBadge status={r.status} />
                </div>
              </li>
            ))}
          </ul>
          <Link to="/resources" className="btn btn-ghost border border-slate-200 w-full">
            {t("today.browse_all")}
          </Link>
        </div>
      )}

      {/* Warnings */}
      {ai.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 space-y-1">
          <p className="text-xs font-semibold text-amber-900">{t("today.warnings")}</p>
          {ai.warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-800">
              ⚠️ {w}
            </p>
          ))}
        </div>
      )}

      {isLoading && <p className="text-sm text-slate-500">{t("loading")}</p>}
    </section>
  );
}
