<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from "vue";

import OLMap from "ol/Map";
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
const emit = defineEmits(["features", "info", "request-layer-sync", "suggest-mode"]);

const mapEl = ref(null);
let map, featureLayer, featureSource, tempLayer, tempSource;
let selectInteraction, modifyInteraction, drawInteraction;
let selectedFeature = null;
const ready = ref(false);
const gj = new GeoJSON();

function loadGeoJSON(geojson) { setFeaturesFromGeoJSON(geojson); }
function clearFeatures() { setFeaturesFromGeoJSON({ type: "FeatureCollection", features: [] }); }
function getFeaturesFC() {
  return gj.writeFeaturesObject(featureSource.getFeatures(), {
    dataProjection: "EPSG:4326", featureProjection: "EPSG:3857",
  });
}
const layerById = new Map();
function setLayerVisibility(id, visible) {
  if (!ready.value || !map) return;
  const lyr = layerById.get(id);
  if (lyr) lyr.setVisible(!!visible);
}
function flyTo(lat, lon, zoom = 13) {
  map.getView().animate(
    { zoom: 7, duration: 250 },
    { center: fromLonLat([lon, lat]), duration: 650 },
    { zoom, duration: 300 }
  );
}

/** NEW: update/delete selected feature */
function updateSelectedFeatureProps(partialProps = {}) {
  if (!selectedFeature) return null;
  const current = { ...selectedFeature.getProperties() }; // includes geometry; strip it
  delete current.geometry;
  const merged = { ...current, ...partialProps };
  selectedFeature.setProperties(merged); // geometry left intact
  refreshStateFromSource();

  const center = featureCenter(selectedFeature);
  const { lat, lon } = fmtLatLon(center);
  const updated = gj.writeFeatureObject(selectedFeature, { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" });
  // refresh visible toast with new props
  emit("info", { visible: true, lat, lon, feature: updated });
  return updated;
}
function deleteSelectedFeature() {
  if (!selectedFeature) return false;
  featureSource.removeFeature(selectedFeature);
  selectInteraction.getFeatures().clear();
  selectedFeature = null;
  refreshStateFromSource();
  emit("info", { visible: false, lat: 0, lon: 0, feature: null });
  return true;
}

defineExpose({
  loadGeoJSON, clearFeatures, getFeaturesFC, setLayerVisibility, flyTo,
  updateSelectedFeatureProps, deleteSelectedFeature
});

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
  if (!ready.value || !selectInteraction || !modifyInteraction) return;
  const isModify = props.mode === "modify";
  const isDraw = props.mode === "draw";
  selectInteraction.setActive(!isDraw || isModify);
  modifyInteraction.setActive(isModify);
  if (drawInteraction) { map.removeInteraction(drawInteraction); drawInteraction = null; }
  if (isDraw) {
    drawInteraction = new Draw({ source: featureSource, type: props.drawShape });
    map.addInteraction(drawInteraction);
    drawInteraction.on("drawend", (e) => {
      // Keep source state in sync
      nextTick(() => refreshStateFromSource());
    
      // Auto-select the feature that was just drawn
      const f = e.feature;
      selectedFeature = f;
      const sel = selectInteraction.getFeatures();
      sel.clear();
      sel.push(f);
    
      // Show toast for the new feature
      const center = featureCenter(f);
      const { lat, lon } = fmtLatLon(center);
      const fObj = gj.writeFeatureObject(f, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });
      emit("info", { visible: true, lat, lon, feature: fObj });
    
      // Ask parent to switch to modify mode
      emit("suggest-mode", { mode: "modify" });
    });
  }
}

function applyLayers() {
  if (!ready.value || !map) return;
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

  map = new OLMap({
    target: mapEl.value,
    layers: [featureLayer, tempLayer],
    view: new View({ center: fromLonLat([115.367526, -8.129998]), zoom: 18 }),
    controls: defaultControls().extend([ new ScaleLine({ units: "metric", bar: true, steps: 6, minWidth: 180 }) ]),
  });

  selectInteraction = new Select();
  modifyInteraction = new Modify({ source: featureSource });
  modifyInteraction.setActive(false);
  map.addInteraction(selectInteraction);
  map.addInteraction(modifyInteraction);

  featureSource.on("addfeature", refreshStateFromSource);
  featureSource.on("changefeature", refreshStateFromSource);
  featureSource.on("removefeature", refreshStateFromSource);

  // Selection → show toast (in browse OR modify, but modify requires a feature)
  selectInteraction.on("select", (e) => {
    selectedFeature = e.selected[0] || null;
    if (!selectedFeature) {
      if (props.mode === "modify") emit("info", { visible: false, lat: 0, lon: 0, feature: null });
      return;
    }
    const center = featureCenter(selectedFeature);
    const { lat, lon } = fmtLatLon(center);
    const fObj = gj.writeFeatureObject(selectedFeature, { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" });
    emit("info", { visible: true, lat, lon, feature: fObj });
  });

  // Click: show coords and feature (if any) in browse mode; in modify, rely on selection handler above
  map.on("singleclick", (evt) => {
    tempSource.clear();
    const hit = map.forEachFeatureAtPixel(evt.pixel, (f) => f, { layerFilter: (l) => l === featureLayer });

    if (props.mode === "browse") {
      const coord = hit ? featureCenter(hit) : evt.coordinate;
      const { lat, lon } = fmtLatLon(coord);
      if (!hit) tempSource.addFeature(new Feature(new Point(evt.coordinate)));
      const fObj = hit ? gj.writeFeatureObject(hit, { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" }) : null;
      emit("info", { visible: true, lat, lon, feature: fObj });
    }
  });

  ready.value = true;
  applyLayers();
  emit("request-layer-sync");
});

// UPDATED: watchers (no immediate); they bail if not ready
watch(() => [props.mode, props.drawShape], () => applyMode());
watch(() => props.layersConfig, () => applyLayers());

onBeforeUnmount(() => { if (map) map.setTarget(undefined); });
</script>

<template>
  <div ref="mapEl" style="height:100%; width:100%;"></div>
</template>
