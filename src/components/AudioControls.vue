<template>
  <section class="panel-card">
    <div class="panel-header">
      <div class="flex items-center gap-3">
        <h2 class="text-base sm:text-lg font-semibold" style="color: #e0e0e0;">Audio Control</h2>
        <span class="text-[11px] px-2.5 py-0.5 rounded-full font-medium" style="background: rgba(0,255,65,0.1); color: #00ff41;">通信面板</span>
      </div>
      <span class="status-badge" :style="statusStyle">{{ status }}</span>
    </div>
    <div class="panel-body">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div class="flex items-center gap-2 shrink-0">
          <label for="audioFile" class="btn btn-outline btn-sm cursor-pointer">Load Audio</label>
          <input type="file" id="audioFile" accept=".mp3,.wav,.ogg" hidden @change="onFileChange">
          <span class="text-sm max-w-[140px] sm:max-w-[200px] truncate" style="color: #666666;">{{ fileName || 'No file selected' }}</span>
        </div>
        <div class="flex items-center gap-2 flex-wrap justify-center">
          <button class="btn btn-primary btn-sm" @click="$emit('playOriginal')">Play Original</button>
          <button class="btn btn-accent btn-sm" @click="$emit('playEqualized')">Play EQ</button>
          <button class="btn btn-danger btn-sm" @click="$emit('stop')">Stop</button>
        </div>
        <div class="flex items-center gap-2 shrink-0 justify-center sm:justify-end">
          <button class="btn btn-outline btn-sm" @click="$emit('save')">Save WAV</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ status: String, fileName: String })
const emit = defineEmits(['fileLoaded', 'playOriginal', 'playEqualized', 'stop', 'save'])

const statusStyle = computed(() => {
  const s = props.status || ''
  if (s.includes('Error')) return { color: '#ff3355', borderColor: 'rgba(255,51,85,0.2)', background: 'rgba(255,51,85,0.06)' }
  if (s.includes('...') || s.includes('ing')) return { color: '#ffb300', borderColor: 'rgba(255,179,0,0.2)', background: 'rgba(255,179,0,0.06)' }
  if (s.includes('playing') || s.includes('Playing')) return { color: '#00ff41', borderColor: 'rgba(0,255,65,0.2)', background: 'rgba(0,255,65,0.06)' }
  return { color: '#a0a0a0', borderColor: 'rgba(0,255,65,0.12)', background: 'rgba(5,5,5,0.6)' }
})

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) emit('fileLoaded', file)
}
</script>
