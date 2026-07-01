/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module "leaflet.heat" {
  import * as L from "leaflet";
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: object
  ): L.Layer;
}
