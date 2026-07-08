<template>
  <div class="min-h-screen" style="background: var(--bg-primary);">
    <!-- Header -->
    <header class="sticky top-0 z-50" style="background: var(--bg-secondary); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border-primary); box-shadow: var(--shadow-sm);">
      <div class="flex items-center justify-between px-4 h-12">
        <div class="flex items-center gap-3">
          <svg viewBox="0 0 32 32" class="w-7 h-7">
            <ellipse cx="16" cy="16" rx="11" ry="4" fill="#c4956a" opacity="0.6"/>
            <ellipse cx="16" cy="14" rx="6" ry="4.5" fill="#a37a52"/>
            <ellipse cx="16" cy="14" rx="3" ry="2.5" fill="#d0ae8c" opacity="0.4"/>
          </svg>
          <span class="text-sm font-semibold" style="color: var(--text-primary);">Music Player</span>
        </div>
        <nav class="flex items-center gap-1">
          <button v-for="tab in tabs" :key="tab.id"
            class="nav-btn"
            :class="{ active: currentTab === tab.id }"
            @click="currentTab = tab.id"
          >{{ tab.label }}</button>
        </nav>
      </div>
    </header>

    <!-- Main -->
    <main class="px-4 py-4" style="max-width: 1400px; margin: 0 auto;">
      <!-- Player Tab -->
      <MusicPlayer
        v-if="currentTab === 'player'"
        :audio="audio"
        :gains="eqGains"
        @update:gains="eqGains.value = $event"
        @file-loaded="onFileLoaded"
        @play-original="audio.playOriginal(currentFs)"
        @save="onSave"
      />

      <!-- Synthesizer Tab -->
      <Synthesizer v-if="currentTab === 'synth'" />

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useFFT } from './composables/useFFT.js'
import { useAudio } from './composables/useAudio.js'
import MusicPlayer from './components/MusicPlayer.vue'
import Synthesizer from './components/Synthesizer.vue'

const fft = useFFT()
const audio = useAudio()
const currentTab = ref('player')
const currentFs = ref(44100)
const eqGains = ref([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

const tabs = [
  { id: 'player', label: 'Player' },
  { id: 'synth', label: 'Synth' },
]

async function onFileLoaded(file) {
  const decoded = await audio.loadFile(file)
  if (decoded) currentFs.value = decoded.sampleRate
}

function onSave() {
  const data = audio.exportEQ(eqGains.value, currentFs.value)
  if (!data) return
  const buf = new ArrayBuffer(44 + data.length * 2)
  const v = new DataView(buf)
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  w(0, 'RIFF'); v.setUint32(4, buf.byteLength - 8, true); w(8, 'WAVE')
  w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true)
  v.setUint16(22, 1, true); v.setUint32(24, currentFs.value, true)
  v.setUint32(28, currentFs.value * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true)
  w(36, 'data'); v.setUint32(40, data.length * 2, true)
  let o = 44
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]))
    v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2
  }
  const blob = new Blob([buf], { type: 'audio/wav' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = `${(audio.loadedFileName.value || 'signal').replace(/\.[^.]+$/, '')}_equalized.wav`
  a.click(); URL.revokeObjectURL(url)
}

onMounted(() => { fft.compute() })
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif; background: var(--bg-primary); color: var(--text-primary); -webkit-font-smoothing: antialiased; }
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: var(--scrollbar-track); }
::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 9999px; }
</style>

<style scoped>
.nav-btn {
  @apply px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150;
  color: var(--text-secondary); background: transparent; border: none; cursor: pointer;
}
.nav-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); }
.nav-btn.active { background: var(--accent-copper-light); color: var(--accent-copper); }
</style>
