<script setup>
import { ref } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  layers: { type: Array, default: () => [] },
  hasFeatures: { type: Boolean, default: false },
  manifestUrl: { type: String, default: "" },
  remoteFeatureCollections: { type: Array, default: () => [] },
});
const emit = defineEmits([
  "close",
  "toggle-layer",
  "load-geojson",
  "save-geojson",
  "clear-geojson",
  "list-geojson-remote",
  "load-geojson-remote",
  "save-geojson-remote",
  "refresh-manifest",
  "fly-to",
]);

const fileEl = ref(null);
const search = ref("");
const searching = ref(false);
const results = ref([]);

function onFileChosen(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const json = JSON.parse(reader.result);
      if (json?.type !== "FeatureCollection") throw new Error("Must be a GeoJSON FeatureCollection");
      emit("load-geojson", json);
    } catch (err) {
      alert("Error loading GeoJSON: " + err.message);
    } finally {
      fileEl.value.value = "";
    }
  };
  reader.readAsText(file);
}

let t; // debounce
async function doSearch() {
  clearTimeout(t);
  const q = search.value.trim();
  if (q.length < 3) { results.value = []; return; }
  t = setTimeout(async () => {
    searching.value = true;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { "Accept-Language": navigator.language || "en" } });
      results.value = res.ok ? await res.json() : [];
    } catch {
      results.value = [];
    } finally {
      searching.value = false;
    }
  }, 350);
}
</script>

<template>
  <aside class="drawer" :class="{ open }" @keydown.esc.stop.prevent="emit('close')">
    <header>
      <strong>Tools</strong>
      <button class="iconbtn" @click="emit('close')">×</button>
    </header>

    <section>
      <details>
        <summary>Load / Save Features</summary>
        <div style="margin-top:.5rem; display:flex; gap:.5rem; flex-wrap:wrap;">
          <button class="chip" :disabled="!hasFeatures" @click="emit('save-geojson')">💾 Save GeoJSON (Local)</button>
          <button class="chip" @click="fileEl.click()">📁 Load GeoJSON (Local)</button>
          <input ref="fileEl" type="file" accept=".geojson,.json" class="hidden" @change="onFileChosen" />

          <button class="chip" @click="$emit('save-geojson-remote')">⬆️ Save GeoJSON (Remote) </button>
          <button class="chip" @click="$emit('list-geojson-remote')">📜 Load GeoJSON (Remote) </button>
          <div class="list" v-if="remoteFeatureCollections.length">
            <button v-for="k in remoteFeatureCollections" :key="k" @click="$emit('load-geojson-remote', k)">
              {{ k }}
            </button>
          </div>

          <button class="chip" :disabled="!hasFeatures" @click="emit('clear-geojson')">🧹 Clear all</button>
        </div>
      </details>

      <details>
        <summary>Search / Fly-to</summary>
        <div style="margin-top:.5rem;">
          <input type="search" placeholder="Search places (Nominatim)…" v-model="search" @input="doSearch" />
          <div class="list" v-if="results.length">
            <button v-for="r in results" :key="r.place_id"
              @click="emit('fly-to', parseFloat(r.lat), parseFloat(r.lon), 15); results=[]">
              {{ r.display_name }}
            </button>
          </div>
          <div v-else-if="searching" style="opacity:.7; padding:.5rem 0;">Searching…</div>
        </div>
      </details>

      <details open>
        <summary>Layers</summary>
        <div style="margin-top:.35rem;">
          <div class="switch" v-for="cfg in layers" :key="cfg.id">
            <input type="checkbox" :checked="!!cfg.visible" @change="emit('toggle-layer', cfg.id, $event.target.checked)" />
            <label>{{ cfg.label || cfg.id }}</label>
          </div>
          <div style="margin-top:.5rem;">
            <button class="chip" @click="emit('refresh-manifest')">↻ Reload manifest</button>
          </div>
        </div>
      </details>
    </section>
  </aside>
</template>
