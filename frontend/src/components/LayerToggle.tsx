import { useTranslation } from "react-i18next";
import { useMapStore, LAYER_COLORS } from "../store/appStore";
import type { LayerType } from "../types";

const ALL_LAYERS: LayerType[] = [
  "hospitals",
  "clinics",
  "shelters",
  "water",
  "food",
  "sanitation",
  "roads",
  "damage",
  "incidents",
  "news",
  "pressure",
];

export default function LayerToggle() {
  const { t } = useTranslation();
  const { activeLayers, toggleLayer, showSatellite, setShowSatellite, showCluster, setShowCluster } =
    useMapStore();

  return (
    <div className="card space-y-3 max-h-[60vh] overflow-y-auto">
      <h3 className="font-semibold text-sm text-slate-800">{t("map.layers")}</h3>
      <div className="space-y-1">
        {ALL_LAYERS.map((layer) => (
          <label
            key={layer}
            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5"
          >
            <input
              type="checkbox"
              checked={activeLayers.has(layer)}
              onChange={() => toggleLayer(layer)}
              className="rounded"
            />
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: LAYER_COLORS[layer] }}
            />
            <span>{t(`layers.${layer}`)}</span>
          </label>
        ))}
      </div>
      <hr className="border-slate-200" />
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={showSatellite}
          onChange={(e) => setShowSatellite(e.target.checked)}
          className="rounded"
        />
        <span>{t("map.satellite")}</span>
      </label>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={showCluster}
          onChange={(e) => setShowCluster(e.target.checked)}
          className="rounded"
        />
        <span>{t("map.cluster")}</span>
      </label>
    </div>
  );
}
