<script setup>
const props = defineProps({ html: { type: String, default: "" } });
const emit = defineEmits(["close"]);
</script>

<template>
  <div class="info">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem;">
      <strong>Info</strong>
      <button class="iconbtn" @click="emit('close')">×</button>
    </div>
    <div style="margin-top:.5rem;" v-html="html"></div>
  </div>
</template>
