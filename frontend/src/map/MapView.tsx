import { useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, filterByTime } from "../services/api";
import { useMapStore, useAppStore, LAYER_COLORS } from "../store/appStore";
import FeaturePopup from "../components/FeaturePopup";
import LayerToggle from "../components/LayerToggle";
import SatelliteLayer from "./SatelliteLayer";
import PressureHeatmap from "./PressureHeatmap";
import { createLayerIcon, GAZA_CENTER, GAZA_ZOOM } from "./icons";
import type { GeoJSONFeature, LayerType } from "../types";

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function TimeFilter() {
  const { t } = useTranslation();
  const { timeFilterHours, setTimeFilter } = useMapStore();

  const options: { label: string; hours: number | null }[] = [
    { label: t("map.all_time"), hours: null },
    { label: t("map.last_hour"), hours: 1 },
    { label: t("map.last_6h"), hours: 6 },
    { label: t("map.last_24h"), hours: 24 },
    { label: t("map.last_7d"), hours: 168 },
  ];

  return (
    <div className="card">
      <h3 className="font-semibold text-sm text-slate-800 mb-2">{t("map.time_filter")}</h3>
      <select
        className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white"
        value={timeFilterHours ?? ""}
        onChange={(e) =>
          setTimeFilter(e.target.value === "" ? null : Number(e.target.value))
        }
      >
        {options.map((o) => (
          <option key={o.label} value={o.hours ?? ""}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function MapMarkers({ features }: { features: GeoJSONFeature[] }) {
  const { activeLayers } = useMapStore();

  const visible = features.filter((f) =>
    activeLayers.has(f.properties.type as LayerType)
  );

  return (
    <>
      {visible.map((f) => {
        const layerType = f.properties.type as LayerType;
        const color = LAYER_COLORS[layerType] ?? "#64748b";
        return (
          <Marker
            key={f.id}
            position={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
            icon={createLayerIcon(color)}
          >
            <Popup>
              <FeaturePopup feature={f.properties} />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function MapView() {
  const { t } = useTranslation();
  const { liteMode } = useAppStore();

  if (liteMode) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center space-y-4">
        <p className="text-slate-600">{t("lite_mode.map_disabled")}</p>
        <Link to="/resources" className="btn btn-primary inline-block">
          {t("nav.resources")}
        </Link>
      </div>
    );
  }

  return <MapViewFull />;
}

function MapViewFull() {
  const { t } = useTranslation();
  const { activeLayers, showSatellite, timeFilterHours } = useMapStore();

  const { data: facilities, isLoading, error } = useQuery({
    queryKey: ["facilities"],
    queryFn: api.facilities,
  });

  const { data: pressure } = useQuery({
    queryKey: ["pressure"],
    queryFn: api.pressure,
  });

  const features = useMemo(() => {
    if (!facilities?.features) return [];
    const props = facilities.features.map((f) => f.properties);
    const filtered = filterByTime(props, timeFilterHours);
    const ids = new Set(filtered.map((p) => p.id));
    return facilities.features.filter((f) => ids.has(f.properties.id));
  }, [facilities, timeFilterHours]);

  return (
    <div className="relative h-[calc(100vh-140px)] min-h-[400px]">
      <div className="absolute top-3 start-3 z-[1000] w-56 space-y-2">
        <LayerToggle />
        <TimeFilter />
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 z-[500]">
          <p className="text-slate-600">{t("loading")}</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-[500]">
          <p className="text-red-600">{t("error")}</p>
        </div>
      )}

      <MapContainer
        center={GAZA_CENTER}
        zoom={GAZA_ZOOM}
        className="h-full w-full"
        scrollWheelZoom
      >
        <MapResizer />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <SatelliteLayer enabled={showSatellite} />
        {activeLayers.has("pressure") && pressure?.regions && (
          <PressureHeatmap regions={pressure.regions} enabled />
        )}
        <MapMarkers features={features} />
      </MapContainer>
    </div>
  );
}
