<script setup>
import { reactive, watch, computed } from "vue";

/**
 * Props:
 *  - mode: "browse" | "modify" | "draw"
 *  - lat, lon: numbers (always provided when toast is visible)
 *  - feature: optional GeoJSON Feature (EPSG:4326), may be null
 */
const props = defineProps({
  mode: { type: String, required: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  feature: { type: Object, default: null },
});
const emit = defineEmits(["close", "save-props", "delete"]);

const p = computed(() => props.feature?.properties ?? null);
const title = computed(() => p.value?.name || p.value?.id || "Selected feature");
const descr = computed(() => p.value?.description || "");
const tagsArr = computed(() => {
  const t = p.value?.tags;
  if (!t) return [];
  return Array.isArray(t) ? t : String(t).split(",").map(s => s.trim()).filter(Boolean);
});
const dates = computed(() => ({ added: p.value?.dateAdded || "", removed: p.value?.dateRemoved || "" }));
const canEdit = computed(() => props.mode === "modify" && !!props.feature);

// form model (only used in modify mode)
const form = reactive({
  name: "",
  description: "",
  tags: "",          // comma-separated string in the UI
  dateAdded: "",
  dateRemoved: "",
});

// hydrate form from feature when it changes
watch(() => props.feature, (f) => {
  const pr = f?.properties || {};
  form.name = pr.name || "";
  form.description = pr.description || "";
  form.tags = Array.isArray(pr.tags) ? pr.tags.join(", ") : (pr.tags || "");
  form.dateAdded = pr.dateAdded || "";
  form.dateRemoved = pr.dateRemoved || "";
}, { immediate: true });

function fmt(n) { return (typeof n === "number" && isFinite(n)) ? n.toFixed(6) : String(n ?? ""); }

function onSave() {
  // Build a minimal payload; include only fields the user set (or explicitly cleared)
  const payload = {};
  if (form.name !== "") payload.name = form.name;
  if (form.description !== "") payload.description = form.description;
  const t = form.tags.split(",").map(s => s.trim()).filter(Boolean);
  if (t.length) payload.tags = t;
  if (form.dateAdded !== "") payload.dateAdded = form.dateAdded;
  if (form.dateRemoved !== "") payload.dateRemoved = form.dateRemoved;

  emit("save-props", payload);
}

function onDelete() { emit("delete"); }
</script>

<template>
  <div class="info" role="dialog" aria-label="Map info">
    <div class="info__coords">
      <span>Lon/Lat: [ {{ fmt(lon) }}, {{ fmt(lat) }} ]</span>
      <button class="iconbtn info__close" @click="emit('close')" aria-label="Close">×</button>
    </div>

    <!-- Read-only view (browse / draw) -->
    <template v-if="!canEdit">
      <template v-if="feature && p">
        <div class="info__section">
          <div class="info__title">{{ title }}</div>
          <div v-if="descr" class="info__descr">{{ descr }}</div>

          <div v-if="tagsArr.length" class="info__tags">
            <span class="tag" v-for="t in tagsArr" :key="t">#{{ t }}</span>
          </div>

          <div class="info__dates" v-if="dates.added || dates.removed">
            <small v-if="dates.added">added: {{ dates.added }}</small>
            <small v-if="dates.removed"> • removed: {{ dates.removed }}</small>
          </div>
        </div>

        <details class="info__raw">
          <summary>Feature JSON</summary>
          <pre><code>{{ JSON.stringify(feature, null, 2) }}</code></pre>
        </details>
      </template>
    </template>

    <!-- Editor (modify mode + feature selected) -->
    <template v-else>
      <div class="info__section">
        <div class="actions">
          <button class="chip" @click="onSave">💾 Save</button>
          <button class="chip danger" @click="onDelete">🗑️ Delete</button>
        </div>

        <label class="field">
          <span class="label">Name</span>
          <input type="text" v-model="form.name" placeholder="—" />
        </label>

        <label class="field">
          <span class="label">Description</span>
          <textarea v-model="form.description" rows="2" placeholder="—" />
        </label>

        <label class="field">
          <span class="label">Tags (comma separated)</span>
          <input type="text" v-model="form.tags" placeholder="reef, coral, site-42" />
        </label>

        <div class="grid2">
          <label class="field">
            <span class="label">Date added</span>
            <input type="text" v-model="form.dateAdded" placeholder="YYYY-MM-DD" />
          </label>
          <label class="field">
            <span class="label">Date removed</span>
            <input type="text" v-model="form.dateRemoved" placeholder="YYYY-MM-DD" />
          </label>
        </div>
      </div>

      <details class="info__raw" v-if="feature">
        <summary>Feature JSON</summary>
        <pre><code>{{ JSON.stringify(feature, null, 2) }}</code></pre>
      </details>
    </template>
  </div>
</template>

<style scoped>
.info {
  position: absolute;
  left: .75rem; bottom: .75rem; z-index: 20;
  background: var(--panel-bg); border: 1px solid var(--panel-border);
  border-radius: 12px; box-shadow: var(--shadow);
  padding: 10px 12px; overflow: auto;
  max-height: 38vh; width: clamp(240px, 88vw, 380px);
}
@media (min-width: 1024px) { .info { max-height: 33vh; max-width: 33vw; } }

.info__coords { display:flex; align-items:center; justify-content:space-between; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; opacity:.9; gap:.5rem; margin-bottom:.25rem; font-style: italic; }
.info__section { margin-top:.5rem; }
.info__title { font-weight:600; margin-bottom:.25rem; }
.info__descr { font-size:14px; opacity:.95; }
.info__tags { display:flex; flex-wrap:wrap; gap:.35rem; margin-top:.25rem; }
.tag { padding:2px 8px; border-radius:999px; border:1px solid var(--panel-border); font-size:12px; background:#fff; }
.info__dates { margin-top:.35rem; color:#444; }

.field { display:flex; flex-direction:column; gap:.25rem; margin:.35rem 0; }
.field .label { font-size:12px; opacity:.8; }
.field input[type="text"], textarea {
  border:1px solid var(--panel-border); border-radius:10px; padding:8px 10px; font-size:14px; background:#fff; resize: vertical; min-width: 0; min-width:0; box-sizing:border-box; max-width:100%;
}

.grid2 { display:grid; grid-template-columns: 1fr 1fr; gap:.5rem; }

.actions { display:flex; gap:.5rem; margin-top:.5rem; }
.chip { padding:6px 10px; border-radius:999px; border:1px solid var(--panel-border); background:#fff; cursor:pointer; }
.chip.danger { border-color:#e08484; }
.info__raw { margin-top:.35rem; }
.info__raw > summary { cursor:pointer; font-size:12px; opacity:.85; }
.info__raw pre { margin:.35rem 0 0; max-height:26vh; overflow:auto; font-size:12px; }
</style>
