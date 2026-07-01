import { TileLayer } from "react-leaflet";

interface SatelliteLayerProps {
  enabled: boolean;
}

export default function SatelliteLayer({ enabled }: SatelliteLayerProps) {
  if (!enabled) return null;

  return (
    <TileLayer
      url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_CityLights_2012/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg"
      attribution="NASA EarthData"
      opacity={0.6}
      zIndex={1}
    />
  );
}
