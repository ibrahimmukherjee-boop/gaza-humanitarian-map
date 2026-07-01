import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GazaArea, LayerType, ResourceCategory } from "../types";

interface AppStore {
  liteMode: boolean;
  selectedArea: GazaArea;
  resourceCategory: ResourceCategory;
  offlineSavedAt: string | null;
  setLiteMode: (v: boolean) => void;
  setSelectedArea: (area: GazaArea) => void;
  setResourceCategory: (cat: ResourceCategory) => void;
  markOfflineSaved: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      liteMode: false,
      selectedArea: "all",
      resourceCategory: "all",
      offlineSavedAt: null,
      setLiteMode: (liteMode) => set({ liteMode }),
      setSelectedArea: (selectedArea) => set({ selectedArea }),
      setResourceCategory: (resourceCategory) => set({ resourceCategory }),
      markOfflineSaved: () => set({ offlineSavedAt: new Date().toISOString() }),
    }),
    { name: "hssm-app" }
  )
);

interface MapStore {
  activeLayers: Set<LayerType>;
  timeFilterHours: number | null;
  showSatellite: boolean;
  showCluster: boolean;
  toggleLayer: (layer: LayerType) => void;
  setTimeFilter: (hours: number | null) => void;
  setShowSatellite: (show: boolean) => void;
  setShowCluster: (show: boolean) => void;
}

const DEFAULT_LAYERS: LayerType[] = ["hospitals", "clinics", "shelters", "water", "food"];

export const useMapStore = create<MapStore>((set) => ({
  activeLayers: new Set(DEFAULT_LAYERS),
  timeFilterHours: null,
  showSatellite: false,
  showCluster: true,
  toggleLayer: (layer) =>
    set((state) => {
      const next = new Set(state.activeLayers);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return { activeLayers: next };
    }),
  setTimeFilter: (hours) => set({ timeFilterHours: hours }),
  setShowSatellite: (show) => set({ showSatellite: show }),
  setShowCluster: (show) => set({ showCluster: show }),
}));

export const LAYER_COLORS: Record<LayerType, string> = {
  hospitals: "#2563eb",
  clinics: "#3b82f6",
  shelters: "#16a34a",
  water: "#0891b2",
  food: "#ea580c",
  sanitation: "#0d9488",
  roads: "#78716c",
  damage: "#44403c",
  incidents: "#dc2626",
  news: "#9333ea",
  pressure: "#f59e0b",
};
