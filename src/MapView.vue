<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from "vue";

import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import WebGLTile from "ol/layer/WebGLTile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import GeoTIFF from "ol/source/GeoTIFF";
import { ScaleLine, defaults as defaultControls } from "ol/control";
import { fromLonLat, toLonLat } from "ol/proj";
import { Draw, Modify, Select } from "ol/interaction";
import GeoJSON from "ol/format/GeoJSON";
import { Style, Stroke, Fill, Circle as CircleStyle, Text } from "ol/style";
import { getCenter } from "ol/extent";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";

const props = defineProps({
  mode: { type: String, required: true },            // "browse" | "modify" | "draw"
  drawShape: { type: String, required: true },       // "Point" | "LineString" | "Polygon"
  layersConfig: { type: Array, default: () => [] },
});
const emit = defineEmits(["features", "info", "request-layer-sync"]);

const mapEl = ref(null);
let map, featureLayer, featureSource, tempLayer, tempSource;
let selectInteraction, modifyInteraction, drawInteraction;
const gj = new GeoJSON();

function loadGeoJSON(geojson) { setFeaturesFromGeoJSON(geojson); }
function clearFeatures() { setFeaturesFromGeoJSON({ type: "FeatureCollection", features: [] }); }
function getFeaturesFC() {
  return gj.writeFeaturesObject(featureSource.getFeatures(), {
    dataProjection: "EPSG:4326", featureProjection: "EPSG:3857",
  });
}
const layerById = new Map();
function setLayerVisibility(id, visible) { const lyr = layerById.get(id); if (lyr) lyr.setVisible(!!visible); }
function flyTo(lat, lon, zoom = 13) {
  map.getView().animate(
    { zoom: 7, duration: 250 },
    { center: fromLonLat([lon, lat]), duration: 650 },
    { zoom, duration: 300 }
  );
}
defineExpose({ loadGeoJSON, clearFeatures, getFeaturesFC, setLayerVisibility, flyTo });

function pointStyle() {
  return new Style({
    image: new CircleStyle({ radius: 6, fill: new Fill({ color: "#ffffff" }), stroke: new Stroke({ color: "#000", width: 2 }) }),
  });
}
function linePolyStyle() {
  return new Style({ stroke: new Stroke({ color: "#ffff00", width: 2 }), fill: new Fill({ color: "rgba(0,0,0,0)" }) });
}
function crosshairStyle() {
  return new Style({ text: new Text({ text: "⌖", font: "bold 24px sans-serif", fill: new Fill({ color: "#ffffff" }), stroke: new Stroke({ color: "#000", width: 3 }) }) });
}

function featureCenter(f) {
  const g = f.getGeometry();
  const t = g.getType();
  if (t === "Point") return g.getCoordinates();
  if (t === "LineString") return g.getCoordinateAt(0.5);
  if (t === "Polygon") return g.getInteriorPoint().getCoordinates();
  try { return getCenter(g.getExtent()); } catch { return g.getFirstCoordinate(); }
}

function refreshStateFromSource() { emit("features", getFeaturesFC()); }

function applyMode() {
  const isModify = props.mode === "modify";
  const isDraw = props.mode === "draw";
  selectInteraction.setActive(!isDraw || isModify);
  modifyInteraction.setActive(isModify);
  if (drawInteraction) { map.removeInteraction(drawInteraction); drawInteraction = null; }
  if (isDraw) {
    drawInteraction = new Draw({ source: featureSource, type: props.drawShape });
    map.addInteraction(drawInteraction);
    drawInteraction.on("drawend", () => nextTick(refreshStateFromSource));
  }
}

function applyLayers() {
  map.getLayers().getArray().slice().forEach((lyr) => { if (lyr !== featureLayer && lyr !== tempLayer) map.removeLayer(lyr); });
  layerById.clear();
  for (const cfg of props.layersConfig) {
    const lyr = buildLayer(cfg);
    if (lyr) { lyr.setVisible(!!cfg.visible); map.addLayer(lyr); layerById.set(cfg.id, lyr); }
  }
}
function buildLayer(cfg) {
  const { type, url, attributionText, attributionUrl, maxZoom } = cfg;
  if (type === "osm") return new TileLayer({ source: new OSM() });
  if (type === "satellite") {
    return new TileLayer({
      source: new XYZ({
        url,
        attributions: attributionText && attributionUrl ? `Tiles © <a href="${attributionUrl}">${attributionText}</a>` : (attributionText || ""),
        maxZoom,
      }),
    });
  }
  if (type === "geotiff") return new WebGLTile({ source: new GeoTIFF({ sources: [{ url }], attributions: attributionText || "" }) });
  console.warn("Unknown layer type:", type);
  return null;
}

function setFeaturesFromGeoJSON(fc) {
  featureSource.clear();
  if (fc?.features?.length) {
    const feats = gj.readFeatures(fc, { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" });
    featureSource.addFeatures(feats);
  }
  refreshStateFromSource();
}

function fmtLatLon(c3857) {
  const [lon, lat] = toLonLat(c3857);
  return { lat, lon };
}

onMounted(() => {
  featureSource = new VectorSource();
  featureLayer = new VectorLayer({ source: featureSource, style: (f) => (f.getGeometry().getType() === "Point" ? pointStyle() : linePolyStyle()), zIndex: 1000 });
  tempSource = new VectorSource();
  tempLayer = new VectorLayer({ source: tempSource, style: crosshairStyle(), zIndex: 1100 });

  map = new Map({
    target: mapEl.value,
    layers: [featureLayer, tempLayer],
    view: new View({ center: fromLonLat([115.367526, -8.129998]), zoom: 18 }),
    controls: defaultControls().extend([ new ScaleLine({ units: "metric", bar: true, steps: 6, minWidth: 180 }) ]),
  });

  selectInteraction = new Select();
  modifyInteraction = new Modify({ source: featureSource }); modifyInteraction.setActive(false);
  map.addInteraction(selectInteraction); map.addInteraction(modifyInteraction);

  featureSource.on("addfeature", refreshStateFromSource);
  featureSource.on("changefeature", refreshStateFromSource);
  featureSource.on("removefeature", refreshStateFromSource);

  // Click → always show coords; if feature hit, include its properties & full feature JSON
  map.on("singleclick", (evt) => {
    const isBrowse = props.mode === "browse";
    tempSource.clear();

    // Find feature under cursor
    const hit = map.forEachFeatureAtPixel(evt.pixel, (f) => f, { layerFilter: (l) => l === featureLayer });

    // Choose which coordinate to show (center of feature or click location)
    const coord = hit ? featureCenter(hit) : evt.coordinate;
    const { lat, lon } = fmtLatLon(coord);

    // If no feature, drop a tiny temp marker at click (optional but helpful)
    if (!hit) tempSource.addFeature(new Feature(new Point(evt.coordinate)));

    // Package an optional GeoJSON Feature for the toast
    let geojsonFeature = null;
    if (hit) {
      geojsonFeature = gj.writeFeatureObject(hit, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });
    }

    // Only show toast automatically in browse mode; in other modes you can still wire it if you want
    emit("info", { visible: isBrowse, lat, lon, feature: geojsonFeature });
  });

  applyLayers();
  emit("request-layer-sync");
});

onBeforeUnmount(() => { if (map) map.setTarget(undefined); });

watch(() => [props.mode, props.drawShape], applyMode, { immediate: true });
watch(() => props.layersConfig, applyLayers);
</script>

<template>
  <div ref="mapEl" style="height:100%; width:100%;"></div>
</template>
