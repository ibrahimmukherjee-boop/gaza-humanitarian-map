/// <reference types="vite/client" />

declare module "leaflet.heat" {
  import * as L from "leaflet";
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: object
  ): L.Layer;
}
