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

const props = defineProps({
  mode: { type: String, required: true },            // "browse" | "modify" | "draw"
  drawShape: { type: String, required: true },       // "Point" | "LineString" | "Polygon"
  layersConfig: { type: Array, default: () => [] },  // [{ id, type, url?, label?, visible?, ... }]
});
const emit = defineEmits(["features", "info", "request-layer-sync"]);

const mapEl = ref(null);
let map, featureLayer, featureSource, tempLayer, tempSource;
let selectInteraction, modifyInteraction, drawInteraction;
const gj = new GeoJSON();

// expose imperative API for parent
function loadGeoJSON(geojson) {
  setFeaturesFromGeoJSON(geojson);
}
function clearFeatures() {
  setFeaturesFromGeoJSON({ type: "FeatureCollection", features: [] });
}
function getFeaturesFC() {
  return gj.writeFeaturesObject(featureSource.getFeatures(), {
    dataProjection: "EPSG:4326", featureProjection: "EPSG:3857",
  });
}
function setLayerVisibility(id, visible) {
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
defineExpose({ loadGeoJSON, clearFeatures, getFeaturesFC, setLayerVisibility, flyTo });

const layerById = new Map();

function pointStyle() {
  return new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({ color: "#ffffff" }),
      stroke: new Stroke({ color: "#000", width: 2 }),
    }),
  });
}
function linePolyStyle() {
  return new Style({
    stroke: new Stroke({ color: "#ffff00", width: 2 }),
    fill: new Fill({ color: "rgba(0,0,0,0)" }),
  });
}
function crosshairStyle() {
  return new Style({
    text: new Text({
      text: "⌖",
      font: "bold 24px sans-serif",
      fill: new Fill({ color: "#ffffff" }),
      stroke: new Stroke({ color: "#000", width: 3 }),
    }),
  });
}

function featureCenter(f) {
  const g = f.getGeometry();
  const t = g.getType();
  if (t === "Point") return g.getCoordinates();
  if (t === "LineString") return g.getCoordinateAt(0.5);
  if (t === "Polygon") return g.getInteriorPoint().getCoordinates();
  try { return getCenter(g.getExtent()); } catch { return g.getFirstCoordinate(); }
}

function refreshStateFromSource() {
  emit("features", getFeaturesFC());
}

function applyMode() {
  const isModify = props.mode === "modify";
  const isDraw = props.mode === "draw";

  selectInteraction.setActive(!isDraw || isModify);
  modifyInteraction.setActive(isModify);

  if (drawInteraction) {
    map.removeInteraction(drawInteraction);
    drawInteraction = null;
  }
  if (isDraw) {
    drawInteraction = new Draw({ source: featureSource, type: props.drawShape });
    map.addInteraction(drawInteraction);
    drawInteraction.on("drawend", () => nextTick(refreshStateFromSource));
  }
}

function applyLayers() {
  // remove previous non-feature layers
  map.getLayers().getArray().slice().forEach((lyr) => {
    if (lyr !== featureLayer && lyr !== tempLayer) map.removeLayer(lyr);
  });
  layerById.clear();

  for (const cfg of props.layersConfig) {
    const lyr = buildLayer(cfg);
    if (lyr) {
      lyr.setVisible(!!cfg.visible);
      // insert below feature layers
      map.addLayer(lyr);
      layerById.set(cfg.id, lyr);
    }
  }
}

function buildLayer(cfg) {
  const { type, url, attributionText, attributionUrl, maxZoom } = cfg;
  if (type === "osm") {
    return new TileLayer({ source: new OSM() });
  }
  if (type === "satellite") {
    return new TileLayer({
      source: new XYZ({
        url,
        attributions: attributionText && attributionUrl
          ? `Tiles © <a href="${attributionUrl}">${attributionText}</a>`
          : (attributionText || ""),
        maxZoom,
      }),
    });
  }
  if (type === "geotiff") {
    return new WebGLTile({
      source: new GeoTIFF({ sources: [{ url }], attributions: attributionText || "" }),
    });
  }
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

function fmtLatLon(coord3857) {
  const [lon, lat] = toLonLat(coord3857);
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

onMounted(() => {
  featureSource = new VectorSource();
  featureLayer = new VectorLayer({
    source: featureSource,
    style: (feat) => (feat.getGeometry().getType() === "Point" ? pointStyle() : linePolyStyle()),
    zIndex: 1000,
  });
  tempSource = new VectorSource();
  tempLayer = new VectorLayer({ source: tempSource, style: crosshairStyle(), zIndex: 1100 });

  map = new Map({
    target: mapEl.value,
    layers: [featureLayer, tempLayer], // base layers inserted later
    view: new View({ center: fromLonLat([115.367526, -8.129998]), zoom: 18 }),
    controls: defaultControls().extend([
      new ScaleLine({ units: "metric", bar: true, steps: 6, minWidth: 180 }),
    ]),
  });

  selectInteraction = new Select();
  modifyInteraction = new Modify({ source: featureSource });
  modifyInteraction.setActive(false);
  map.addInteraction(selectInteraction);
  map.addInteraction(modifyInteraction);

  featureSource.on("addfeature", refreshStateFromSource);
  featureSource.on("changefeature", refreshStateFromSource);
  featureSource.on("removefeature", refreshStateFromSource);

  // click info
  map.on("singleclick", (evt) => {
    const isBrowse = props.mode === "browse";
    tempSource.clear();
    if (!isBrowse) { emit("info", { html: "", visible: false }); return; }

    const hit = map.forEachFeatureAtPixel(evt.pixel, (f, l) => f, { layerFilter: (l) => l === featureLayer });
    let html = "";
    if (hit) {
      const center = featureCenter(hit);
      const props = { ...hit.getProperties() }; delete props.geometry;
      const propsHtml = Object.keys(props).length
        ? Object.entries(props).map(([k, v]) => `<div><b>${k}</b>: ${String(v)}</div>`).join("")
        : "<em>No properties</em>";
      html = `<div>Center: ${fmtLatLon(center)}</div>${propsHtml}`;
    } else {
      tempSource.addFeature(new ol.Feature(new ol.geom.Point(evt.coordinate))); // fallback if ol is global absent; but we can skip
      tempSource.clear(); // keep UI minimal: just show coords chip
      html = `Coords: ${fmtLatLon(evt.coordinate)}`;
    }
    emit("info", { html, visible: true });
  });

  // initial
  applyLayers();
  emit("request-layer-sync"); // in case parent wants to fetch manifest on mount
});

onBeforeUnmount(() => {
  if (map) { map.setTarget(undefined); }
});

// react to props
watch(() => [props.mode, props.drawShape], applyMode, { immediate: true });
watch(() => props.layersConfig, applyLayers);
</script>

<template>
  <div ref="mapEl" style="height:100%; width:100%;"></div>
</template>
