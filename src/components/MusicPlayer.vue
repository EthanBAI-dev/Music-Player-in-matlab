<template>
  <div class="flex flex-col gap-3 select-none" style="min-height: calc(100vh - 120px);">
    <!-- Transport Bar -->
    <div class="flex items-center gap-2 px-4 py-3 rounded-xl border" style="background: var(--bg-secondary); border-color: var(--border-primary); box-shadow: var(--shadow-sm);">
      <div class="file-input-wrap">
        <button class="btn btn-sm btn-secondary" @click="$refs.fileInput.click()">Load</button>
        <input ref="fileInput" type="file" accept="audio/*" style="display:none" @change="onFileChange">
      </div>
      <button class="btn btn-sm btn-primary" @click="play" :disabled="!audio.audioBuffer.value">▶</button>
      <button class="btn btn-sm btn-secondary" @click="pause" :disabled="!audio.isPlaying.value">⏸</button>
      <button class="btn btn-sm btn-secondary" @click="audio.stop()" :disabled="!audio.audioBuffer.value">⏹</button>
      <button class="btn btn-sm btn-outline" @click="save" :disabled="!audio.equalizedData.value">Save</button>
      <span v-if="audio.loadedFileName.value" class="text-xs font-mono ml-2 truncate max-w-[200px]" style="color: var(--text-secondary);">{{ audio.loadedFileName.value }}</span>
      <span class="text-xs font-mono ml-auto" style="color: var(--text-secondary);">{{ timeStr }}</span>
    </div>

    <!-- Waveform + Spectrum -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0" style="min-height: 300px;">
      <!-- Waveform -->
      <div class="rounded-xl border overflow-hidden flex flex-col" style="background: var(--bg-secondary); border-color: var(--border-primary); box-shadow: var(--shadow-xs);">
        <div class="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary); border-bottom: 1px solid var(--border-secondary);">Waveform</div>
        <div class="flex-1 relative" style="min-height: 200px;">
          <canvas ref="waveCanvas" class="absolute inset-0 w-full h-full"></canvas>
        </div>
      </div>

      <!-- Spectrum + Particle -->
      <div class="rounded-xl border overflow-hidden flex flex-col" style="background: var(--bg-secondary); border-color: var(--border-primary); box-shadow: var(--shadow-xs);">
        <div class="px-3 py-1.5 flex items-center justify-between" style="border-bottom: 1px solid var(--border-secondary);">
          <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">{{ viewMode === 'spectrum' ? 'Spectrum' : 'Particles' }}</span>
          <div class="flex gap-1">
            <button
              class="view-toggle"
              :class="{ active: viewMode === 'spectrum' }"
              @click="viewMode = 'spectrum'"
              title="频谱视图">〰</button>
            <button
              class="view-toggle"
              :class="{ active: viewMode === 'particles' }"
              @click="viewMode = 'particles'"
              title="粒子视图">✦</button>
          </div>
        </div>
        <div class="flex-1 relative" style="min-height: 200px;">
          <canvas ref="specCanvas" class="absolute inset-0 w-full h-full" @click="onSpecClick"></canvas>
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="relative h-5 cursor-pointer rounded" style="background: var(--bg-tertiary);" @click="onSeek">
      <div class="absolute inset-y-0 left-0 rounded transition-all duration-100" :style="`width: ${progressPct}%; background: var(--accent-copper); opacity: 0.25;`"></div>
    </div>

    <!-- EQ Sliders -->
    <div class="rounded-xl border overflow-hidden" style="background: var(--bg-secondary); border-color: var(--border-primary); box-shadow: var(--shadow-xs);">
      <div class="flex items-center justify-between px-3 py-1.5 border-b" style="border-color: var(--border-secondary);">
        <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">Equalizer</span>
        <button class="text-[10px] px-2 py-0.5 rounded font-medium" style="background: var(--accent-copper-light); color: var(--accent-copper);" @click="flatEq">Flat</button>
      </div>
      <div class="flex items-end justify-around px-2 py-3 gap-0.5" style="height: 150px;">
        <div v-for="(band, i) in bands" :key="band.name" class="flex flex-col items-center gap-1 flex-1 max-w-[50px]">
          <input type="range" class="eq-slider" min="-30" max="30" :value="gains[i]" @input="updateGain(i, $event)">
          <span class="font-mono text-[9px]" style="color: var(--text-tertiary);">{{ band.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  audio: Object,
  gains: Array
})
const emit = defineEmits(['update:gains', 'file-loaded', 'play-original', 'play-equalized', 'save'])

const bands = [
  { name: '31', freq: 31 }, { name: '62', freq: 62 }, { name: '125', freq: 125 },
  { name: '250', freq: 250 }, { name: '500', freq: 500 },
  { name: '1k', freq: 1000 }, { name: '2k', freq: 2000 }, { name: '4k', freq: 4000 },
  { name: '8k', freq: 8000 }, { name: '16k', freq: 16000 }
]

const waveCanvas = ref(null)
const specCanvas = ref(null)
const fileInput = ref(null)
const viewMode = ref('spectrum') // 'spectrum' | 'particles'

let animId = null
let audioCtx = null
let isPaused = false
let frameCount = 0

const progressPct = computed(() => {
  if (!props.audio.duration.value) return 0
  return (props.audio.currentTime.value / props.audio.duration.value) * 100
})

const timeStr = computed(() => {
  const t = props.audio.currentTime.value || 0
  const d = props.audio.duration.value || 0
  const fmt = (s) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, '0')}` }
  return `${fmt(t)} / ${fmt(d)}`
})

function updateGain(i, e) {
  const g = [...props.gains]
  g[i] = parseFloat(e.target.value)
  emit('update:gains', g)
}

function flatEq() {
  const g = new Array(10).fill(0)
  emit('update:gains', g)
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) emit('file-loaded', file)
}

function play() {
  if (isPaused && audioCtx) {
    audioCtx.resume()
    isPaused = false
    return
  }
  emit('play-original')
}

function pause() {
  if (audioCtx && audioCtx.state === 'running') {
    audioCtx.suspend()
    isPaused = true
  }
}

function save() { emit('save') }

function onSeek(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const pct = (e.clientX - rect.left) / rect.width
  if (props.audio.duration.value) {
    props.audio.seek(pct * props.audio.duration.value)
  }
}

function onSpecClick(e) {
  if (viewMode.value !== 'spectrum') return
  const canvas = specCanvas.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const pct = (e.clientX - rect.left) / rect.width
  const freq = 31 * Math.pow(16000 / 31, pct)
  let nearest = 0
  let minDist = Infinity
  for (let i = 0; i < bands.length; i++) {
    const d = Math.abs(bands[i].freq - freq)
    if (d < minDist) { minDist = d; nearest = i }
  }
  const g = [...props.gains]
  g[nearest] = g[nearest] <= 0 ? 12 : 0
  emit('update:gains', g)
}

// Canvas rendering
function render() {
  drawWaveform()
  if (viewMode.value === 'spectrum') {
    drawSpectrum()
  } else {
    drawParticles()
  }
  animId = requestAnimationFrame(render)
}

function drawWaveform() {
  const canvas = waveCanvas.value
  const analyser = props.audio.analyserNode.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth, H = canvas.clientHeight
  if (!W || !H) return
  canvas.width = W * dpr; canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H)
  if (!analyser || !props.audio.isPlaying.value) return
  const bufLen = analyser.frequencyBinCount
  const data = new Uint8Array(bufLen)
  analyser.getByteTimeDomainData(data)
  const cy = H / 2
  ctx.beginPath()
  const step = W / bufLen
  for (let i = 0; i < bufLen; i++) {
    const y = cy + ((data[i] - 128) / 128) * (cy * 0.8)
    i === 0 ? ctx.moveTo(i * step, y) : ctx.lineTo(i * step, y)
  }
  ctx.strokeStyle = '#C4845C'; ctx.lineWidth = 1.5; ctx.stroke()
}

function drawSpectrum() {
  const canvas = specCanvas.value
  const analyser = props.audio.analyserNode.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth, H = canvas.clientHeight
  if (!W || !H) return
  canvas.width = W * dpr; canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H)
  if (!analyser || !props.audio.isPlaying.value) return
  const bufLen = analyser.frequencyBinCount
  const data = new Uint8Array(bufLen)
  analyser.getByteFrequencyData(data)
  const count = Math.min(bufLen, 128)
  const step = W / count
  const barW = Math.max(1, step * 0.7)
  for (let i = 0; i < count; i++) {
    const val = data[i] / 255
    const bh = val * H
    const x = i * step + (step - barW) / 2
    ctx.fillStyle = `rgba(196,132,92,${0.15 + val * 0.7})`
    ctx.fillRect(x, H - bh, barW, bh)
  }
  // EQ curve overlay (spectrum mode only)
  if (viewMode.value === 'spectrum') {
    const g = props.gains || []
    if (g.length > 1) {
      ctx.beginPath()
      const eqStep = W / (g.length - 1)
      for (let i = 0; i < g.length; i++) {
        const n = g[i] / 30
        const y = H / 2 - n * (H * 0.4)
        i === 0 ? ctx.moveTo(i * eqStep, y) : ctx.lineTo(i * eqStep, y)
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1.5
      ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([])
    }
  }
}

function drawParticles() {
  const canvas = specCanvas.value
  const analyser = props.audio.analyserNode.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth, H = canvas.clientHeight
  if (!W || !H) return
  canvas.width = W * dpr; canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H)

  if (!analyser || !props.audio.isPlaying.value) return

  const bufLen = analyser.frequencyBinCount
  const data = new Uint8Array(bufLen)
  analyser.getByteFrequencyData(data)
  frameCount++

  const totalEnergy = data.reduce((a, v) => a + v, 0)
  const energyScale = Math.sqrt(totalEnergy / (bufLen * 255))
  const particleCount = Math.min(50 + energyScale * 250, 500)
  const sizeBase = 2.5 * energyScale
  const moveIntensity = (8 + energyScale * 20)

  for (let i = 0; i < particleCount; i++) {
    const fi = Math.floor(Math.random() * bufLen)
    const amp = data[fi] / 255
    if (amp < 0.05) continue
    const x = Math.random() * W + (Math.random() - 0.5) * moveIntensity * amp
    const y = Math.random() * H + (Math.random() - 0.5) * moveIntensity * amp
    const size = sizeBase * amp * (0.5 + Math.random())
    const hue = (30 + fi / bufLen * 180 + frameCount * 0.5) % 360
    const lightness = 35 + amp * 30
    const opacity = 0.4 + amp * 0.4
    ctx.beginPath()
    ctx.fillStyle = `hsla(${hue}, 70%, ${lightness}%, ${opacity})`
    ctx.arc(x, y, Math.max(size, 0.5), 0, Math.PI * 2)
    ctx.fill()
  }
}

onMounted(() => {
  audioCtx = props.audio.analyserNode.value?.context || null
  render()
})

onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId)
})
</script>

<style scoped>
.file-input-wrap { position: relative; }
.btn { @apply inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border transition-all duration-150 cursor-pointer select-none; }
.btn:active { transform: scale(0.96); }
.btn-sm { @apply px-3 py-1.5 text-xs; }
.btn-primary { background: var(--btn-primary-bg); color: var(--btn-primary-text); border-color: var(--btn-primary-border); }
.btn-primary:hover { background: var(--btn-primary-hover-bg); border-color: var(--btn-primary-hover-bg); }
.btn-primary:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-primary:disabled:hover { background: var(--btn-primary-bg); }
.btn-secondary { background: transparent; color: var(--btn-secondary-text); border-color: var(--btn-secondary-border); }
.btn-secondary:hover { background: var(--btn-secondary-hover-bg); color: var(--text-primary); border-color: var(--border-primary); }
.btn-secondary:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-outline { background: transparent; color: var(--accent-copper); border-color: var(--accent-copper-light); }
.btn-outline:hover { background: var(--accent-copper-light); color: var(--accent-copper-hover); border-color: var(--accent-copper); }
.btn-outline:disabled { opacity: 0.3; cursor: not-allowed; }
.eq-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 90px; background: transparent; cursor: pointer; writing-mode: vertical-lr; direction: rtl; }
.eq-slider::-webkit-slider-runnable-track { width: 3px; height: 100%; background: linear-gradient(to top, var(--slider-track), var(--accent-copper), var(--accent-copper-hover)); border-radius: 9999px; }
.eq-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: var(--slider-thumb); cursor: pointer; margin-left: -5.5px; }
.eq-slider::-moz-range-track { width: 3px; background: linear-gradient(to top, var(--slider-track), var(--accent-copper), var(--accent-copper-hover)); border-radius: 9999px; }
.eq-slider::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: var(--slider-thumb); cursor: pointer; border: none; }
.view-toggle {
  width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
  font-size: 13px; border: 1px solid transparent; border-radius: var(--radius-sm);
  background: transparent; color: var(--text-tertiary); cursor: pointer;
  transition: all 150ms ease; padding: 0;
}
.view-toggle:hover { background: var(--bg-tertiary); color: var(--text-secondary); }
.view-toggle.active { background: var(--accent-copper-light); color: var(--accent-copper); border-color: var(--accent-copper); }
</style>
