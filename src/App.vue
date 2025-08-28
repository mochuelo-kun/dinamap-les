<script setup>
import { reactive, ref } from "vue";
import MapView from "./components/MapView.vue";
import TopBar from "./components/TopBar.vue";
import ToolsDrawer from "./components/ToolsDrawer.vue";
import InfoToast from "./components/InfoToast.vue";

const mapRef = ref(null);
const drawerOpen = ref(false);

// UI state (serializable)
const ui = reactive({
  mode: "browse",                  // "browse" | "modify" | "draw"
  drawShape: "Point",              // "Point" | "LineString" | "Polygon"
  manifestUrl: "https://dinamap-les.s3.ap-southeast-1.amazonaws.com/metadata/layers_202507200627.json",
  layersConfig: [],
  infoHtml: "",
  infoVisible: false,
  features: { type: "FeatureCollection", features: [] },
});

// Relay: Top bar changed mode
function handleModeChange({ mode, drawShape }) {
  ui.mode = mode;
  if (drawShape) ui.drawShape = drawShape;
}

// Drawer actions call MapView imperatively via ref
async function loadManifest() {
  try {
    const res = await fetch(ui.manifestUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    ui.layersConfig = json.layers || [];
  } catch (e) {
    console.warn("Manifest load failed:", e);
    ui.layersConfig = [{ id: "osm", type: "osm", label: "OpenStreetMap", visible: true }];
  }
}

// MapView emits feature updates + info display
function onFeaturesChanged(fc) {
  ui.features = fc;
}
function onInfo({ html, visible }) {
  ui.infoHtml = html || "";
  ui.infoVisible = !!visible;
}

// File I/O
function handleLoadGeoJSON(geojson) {
  mapRef.value?.loadGeoJSON(geojson);
}
function handleSaveGeoJSON() {
  const blob = new Blob([JSON.stringify(ui.features, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `features-${new Date().toISOString().slice(0,10)}.geojson`;
  a.click();
  URL.revokeObjectURL(a.href);
}
function handleClearAll() {
  mapRef.value?.clearFeatures();
}

function toggleLayer(id, visible) {
  mapRef.value?.setLayerVisibility(id, visible);
}

function flyTo(lat, lon, zoom = 15) {
  mapRef.value?.flyTo(lat, lon, zoom);
}
</script>

<template>
  <div class="app">
    <TopBar
      :mode="ui.mode"
      :draw-shape="ui.drawShape"
      @change="handleModeChange"
    />

    <button class="drawer-toggle iconbtn" @click="drawerOpen=!drawerOpen" aria-label="Open tools">☰</button>
    <ToolsDrawer
      :open="drawerOpen"
      :layers="ui.layersConfig"
      :has-features="ui.features.features.length>0"
      :manifest-url="ui.manifestUrl"
      @close="drawerOpen=false"
      @refresh-manifest="loadManifest"
      @toggle-layer="toggleLayer"
      @load-geojson="handleLoadGeoJSON"
      @save-geojson="handleSaveGeoJSON"
      @clear-geojson="handleClearAll"
      @fly-to="flyTo"
    />

    <MapView
      ref="mapRef"
      class="map-wrap"
      :mode="ui.mode"
      :draw-shape="ui.drawShape"
      :layers-config="ui.layersConfig"
      @features="onFeaturesChanged"
      @info="onInfo"
      @request-layer-sync="loadManifest"
    />

    <InfoToast v-if="ui.infoVisible" :html="ui.infoHtml" @close="ui.infoVisible=false" />
  </div>
</template>
