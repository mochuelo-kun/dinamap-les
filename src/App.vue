<script setup>
import { reactive, ref } from "vue";
import * as s3Adapter from "./lib/s3";
import MapView from "./components/MapView.vue";
import TopBar from "./components/TopBar.vue";
import ToolsDrawer from "./components/ToolsDrawer.vue";
import InfoToast from "./components/InfoToast.vue";

const MANIFEST_CONFIG  = import.meta.env.VITE_DEFAULT_CONFIG_MANIFEST;

const mapRef = ref(null);
const drawerOpen = ref(false);

const ui = reactive({
  mode: "browse",
  drawShape: "Point",
  manifestUrl: MANIFEST_CONFIG,
  layersConfig: [],
  features: { type: "FeatureCollection", features: [] },
});

const info = reactive({
  visible: false,
  lat: 0,
  lon: 0,
  feature: null,
});

function handleModeChange({ mode, drawShape }) {
  ui.mode = mode;
  if (drawShape) ui.drawShape = drawShape;
}

async function loadManifest() {
  try {
    const res = await fetch(ui.manifestUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    ui.layersConfig = json.layers || [];
  } catch {
    ui.layersConfig = [{ id: "osm", type: "osm", label: "OpenStreetMap", visible: true }];
  }
}

function onFeaturesChanged(fc) { ui.features = fc; }
function onInfo(payload) {
  info.visible = !!payload.visible;
  info.lat = payload.lat ?? 0;
  info.lon = payload.lon ?? 0;
  info.feature = payload.feature ?? null;
}

function applySuggestedMode({ mode }) {
  if (mode) ui.mode = mode;
}

function handleLoadGeoJSON(geojson) { mapRef.value?.loadGeoJSON(geojson); }
function handleSaveGeoJSON() {
  const blob = new Blob([JSON.stringify(ui.features, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `features-${new Date().toISOString().slice(0,10)}.geojson`;
  a.click(); URL.revokeObjectURL(a.href);
}
function handleClearGeoJSON() { mapRef.value?.clearFeatures(); }

const remoteFeatureCollections = ref([]);

async function saveRemoteGeoJSON() {
  const fc = mapRef.value?.getFeaturesFC();
  if (!fc) return;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const key = `features-${timestamp}.geojson`;
  const url = await s3Adapter.putRemoteGeoJSON(key, fc);
  // optional: surface to user
  alert(`Saved to S3:\n${url}`);
}

async function listRemoteGeoJSON() {
  remoteFeatureCollections.value = await s3Adapter.listRemoteGeoJSON();
}

async function loadRemoteGeoJSON(key) {
  const fc = await s3Adapter.getRemoteGeoJSON(key);
  // append with dedupe (your MapView already supports this)
  mapRef.value?.loadGeoJSON(fc, { dedupe: true, prefer: "incoming" });
}

function toggleLayer(id, visible) { mapRef.value?.setLayerVisibility(id, visible); }
function flyTo(lat, lon, zoom = 15) { mapRef.value?.flyTo(lat, lon, zoom); }

/** NEW: Editor actions from InfoToast */
function saveProps(payload) {
  const updated = mapRef.value?.updateSelectedFeatureProps(payload);
  if (updated) info.feature = updated; // refresh view
  // Natural transition: modify -> browse after saving
  ui.mode = "browse";
}
function deleteSelected() {
  const ok = mapRef.value?.deleteSelectedFeature();
  if (ok) {
    // Natural transition: modify -> browse after deleting
    ui.mode = "browse";
    info.visible = false;
  }
}
</script>

<template>
  <div class="app">
    <TopBar :mode="ui.mode" :draw-shape="ui.drawShape" @change="handleModeChange" />

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
      :remote-feature-collections="remoteFeatureCollections"
      @save-geojson-remote="saveRemoteGeoJSON"
      @list-geojson-remote="listRemoteGeoJSON"
      @load-geojson-remote="loadRemoteGeoJSON"
      @clear-geojson="handleClearGeoJSON"
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
      @suggest-mode="applySuggestedMode"
    />

    <InfoToast
      v-if="info.visible"
      :mode="ui.mode"
      :lat="info.lat"
      :lon="info.lon"
      :feature="info.feature"
      @close="info.visible=false"
      @save-props="saveProps"
      @delete="deleteSelected"
    />
  </div>
</template>
