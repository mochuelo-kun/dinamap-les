<script setup>
const props = defineProps({
  mode: { type: String, required: true },
  drawShape: { type: String, required: true },
});
const emit = defineEmits(["change"]);

function setMode(m) { emit("change", { mode: m }); }
function setDraw(shape) { emit("change", { mode: "draw", drawShape: shape }); }
</script>

<template>
  <div class="topbar">
    <div class="group" role="toolbar" aria-label="Mode">
      <button class="iconbtn" :aria-pressed="mode==='browse'" @click="setMode('browse')" title="Select">☝️</button>
      <button class="iconbtn" :aria-pressed="mode==='modify'" @click="setMode('modify')" title="Modify">✏️</button>
      <button class="iconbtn" :aria-pressed="mode==='draw'" @click="setMode('draw')" title="Draw">✚</button>
    </div>

    <div class="group" v-show="mode==='draw'" aria-label="Draw type">
      <button class="chip" :aria-pressed="drawShape==='Point'" @click="setDraw('Point')">•</button>
      <button class="chip" :aria-pressed="drawShape==='LineString'" @click="setDraw('LineString')">—</button>
      <button class="chip" :aria-pressed="drawShape==='Polygon'" @click="setDraw('Polygon')">⬠</button>
    </div>
  </div>
</template>
