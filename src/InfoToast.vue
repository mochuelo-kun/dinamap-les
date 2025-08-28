<script setup>
import { computed } from "vue";

/**
 * Props:
 *  - lat, lon: numbers (always provided when the toast is shown)
 *  - feature: optional GeoJSON Feature (in EPSG:4326), may be null
 */
const props = defineProps({
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  feature: { type: Object, default: null },
});
const emit = defineEmits(["close"]);

const p = computed(() => props.feature?.properties ?? null);
const title = computed(() => p.value?.name || p.value?.id || "Selected feature");
const descr = computed(() => p.value?.description || "");
const tags = computed(() => {
  const t = p.value?.tags;
  if (!t) return [];
  return Array.isArray(t) ? t : String(t).split(",").map(s => s.trim()).filter(Boolean);
});
const dates = computed(() => ({
  added: p.value?.dateAdded || null,
  removed: p.value?.dateRemoved || null,
}));

const hasProps = computed(() => !!p.value && Object.keys(p.value).length > 0);
const featureJSON = computed(() =>
  props.feature ? JSON.stringify(props.feature, null, 2) : ""
);
function fmt(n) {
  return (typeof n === "number" && isFinite(n)) ? n.toFixed(6) : String(n ?? "");
}
</script>

<template>
  <div class="info" role="dialog" aria-label="Map info">
    <div class="info__hdr">
      <strong>Info</strong>
      <button class="iconbtn info__close" @click="emit('close')" aria-label="Close">×</button>
    </div>

    <div class="info__coords">
      <span>Lat {{ fmt(lat) }}, Lon {{ fmt(lon) }}</span>
    </div>

    <template v-if="hasProps">
      <div class="info__section">
        <div class="info__title">{{ title }}</div>
        <div v-if="descr" class="info__descr">{{ descr }}</div>

        <div v-if="tags.length" class="info__tags">
          <span class="tag" v-for="t in tags" :key="t">#{{ t }}</span>
        </div>

        <div class="info__dates" v-if="dates.added || dates.removed">
          <small v-if="dates.added">added: {{ dates.added }}</small>
          <small v-if="dates.removed"> • removed: {{ dates.removed }}</small>
        </div>
      </div>

      <!-- Optional: compact, collapsible raw feature view -->
      <details class="info__raw" v-if="featureJSON">
        <summary>Feature JSON</summary>
        <pre><code>{{ featureJSON }}</code></pre>
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

  /* Mobile-first bounds: keep footprint small */
  max-height: 38vh;                 /* ~≤ 40% of screen */
  width: clamp(240px, 88vw, 380px); /* mobile width cap */
}

/* On larger screens: keep within lower-left ~1/9th */
@media (min-width: 1024px) {
  .info {
    max-height: 33vh;
    max-width: 33vw;
  }
}

.info__hdr {
  display:flex; align-items:center; justify-content:space-between; gap:.5rem;
  margin-bottom: .25rem;
}
.info__close { line-height: 1; }

.info__coords { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; opacity: .9; }

.info__section { margin-top: .5rem; }
.info__title { font-weight: 600; margin-bottom: .25rem; }
.info__descr { font-size: 14px; opacity: .95; }

.info__tags { display:flex; flex-wrap: wrap; gap: .35rem; margin-top: .25rem; }
.tag {
  padding: 2px 8px; border-radius: 999px; border: 1px solid var(--panel-border);
  font-size: 12px; background: #fff;
}

.info__dates { margin-top: .35rem; color: #444; }

.info__raw { margin-top: .35rem; }
.info__raw > summary { cursor: pointer; font-size: 12px; opacity: .85; }
.info__raw pre { margin: .35rem 0 0; max-height: 26vh; overflow:auto; font-size: 12px; }
</style>
