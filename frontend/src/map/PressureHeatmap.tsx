import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import type { PressureRegion } from "../types";

interface PressureHeatmapProps {
  regions: PressureRegion[];
  enabled: boolean;
}

export default function PressureHeatmap({ regions, enabled }: PressureHeatmapProps) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || regions.length === 0) return;

    const points: [number, number, number][] = regions.map((r) => {
      const intensity =
        r.activity_level === "high" ? 1 : r.activity_level === "medium" ? 0.6 : 0.3;
      return [r.lat, r.lng, intensity * (r.reports_6h / 10 + 0.5)];
    });

    // @ts-expect-error leaflet.heat plugin
    const heatLayer = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 12,
      gradient: {
        0.2: "#fef3c7",
        0.5: "#f59e0b",
        0.8: "#ea580c",
        1.0: "#dc2626",
      },
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, regions, enabled]);

  return null;
}
