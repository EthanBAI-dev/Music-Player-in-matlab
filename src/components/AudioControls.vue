<template>
  <section id="audio" class="panel-card">
    <div class="panel-header">
      <div class="flex items-center gap-3">
        <h2 class="text-base sm:text-lg font-semibold" style="color: #d4cfc8;">Audio Controls</h2>
        <span class="text-[11px] px-2.5 py-0.5 rounded-full font-medium" style="background: rgba(196,149,106,0.08); color: #d0ae8c;">音频控制</span>
      </div>
      <span class="status-badge" :class="statusClass">{{ statusLabel }}</span>
    </div>
    <div class="panel-body">
      <div class="flex flex-wrap items-center gap-3">
        <div class="file-input-wrap">
          <button class="btn btn-secondary">Load Audio</button>
          <input type="file" accept="audio/*" @change="onFileChange">
        </div>
        <button class="btn btn-primary" @click="$emit('play-original')">Play Original</button>
        <button class="btn btn-accent" @click="$emit('play-equalized')">Play Equalized</button>
        <button class="btn btn-secondary" @click="$emit('stop')">Stop</button>
        <button class="btn btn-outline" @click="$emit('save')">Save WAV</button>
        <span v-if="fileName" class="text-sm font-mono" style="color: #666360;">{{ fileName }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ status: String, fileName: String })
defineEmits(['file-loaded', 'play-original', 'play-equalized', 'stop', 'save'])

const statusMap = {
  idle: { label: 'Idle', class: '' },
  loading: { label: 'Loading', class: '' },
  ready: { label: 'Ready', class: '' },
  playing: { label: 'Playing', class: '' },
  error: { label: 'Error', class: '' }
}

const statusLabel = computed(() => {
  const s = statusMap[props.status]
  return s ? s.label : props.status
})

const statusClass = computed(() => {
  if (props.status === 'playing') return 'status-playing'
  if (props.status === 'error') return 'status-error'
  if (props.status === 'loading') return 'status-loading'
  return ''
})

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) this.$emit('file-loaded', file)
}
</script>

<style scoped>
.file-input-wrap { position: relative; }
.file-input-wrap input[type="file"] {
  position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%;
}
.status-badge {
  @apply font-mono text-xs px-3 py-1 rounded-lg border min-w-[100px] text-center;
  background: rgba(5, 5, 5, 0.6);
  border-color: rgba(196, 149, 106, 0.08);
  color: #8a857e;
}
.status-playing {
  border-color: rgba(196, 149, 106, 0.2);
  background: rgba(196, 149, 106, 0.08);
  color: #d0ae8c;
}
.status-error {
  border-color: rgba(255, 51, 85, 0.2);
  background: rgba(255, 51, 85, 0.06);
  color: #ff5577;
}
.status-loading {
  border-color: rgba(255, 179, 0, 0.2);
  background: rgba(255, 179, 0, 0.06);
  color: #ffb300;
}
</style>
