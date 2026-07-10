<template>
  <div class="flex flex-col gap-2 select-none">
    <!-- Row 1: Transport + Waveform + Spectrum -->
    <div class="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr] gap-2" style="min-height: 150px;">
      <!-- Left: Transport Controls -->
      <div class="flex flex-col gap-1.5 px-2.5 py-2 rounded-xl border min-w-[140px]" style="background: var(--bg-secondary); border-color: var(--border-primary); box-shadow: var(--shadow-sm);">
        <!-- Buttons -->
        <div class="flex flex-wrap gap-1">
          <div class="file-input-wrap">
            <button class="btn-tiny btn-secondary" @click="$refs.fileInput.click()">Load</button>
            <input ref="fileInput" type="file" accept="audio/*" style="display:none" @change="onFileChange">
          </div>
          <button class="btn-tiny btn-primary" @click="play" :disabled="!audio.audioBuffer.value || audio.isRecording.value">▶</button>
          <button class="btn-tiny btn-secondary" @click="pause" :disabled="!audio.isPlaying.value">⏸</button>
          <button class="btn-tiny btn-secondary" @click="audio.stop()" :disabled="!audio.audioBuffer.value">⏹</button>
          <button class="btn-tiny btn-outline" @click="save" :disabled="!audio.audioBuffer.value">Save</button>
          <button class="btn-tiny btn-outline" @click="playNoise" :disabled="audio.isRecording.value">~Noise</button>
        </div>
        <!-- Record -->
        <button v-if="!audio.isRecording.value" class="btn-tiny" style="color:#e74c3c;border-color:#e74c3c;background:transparent;padding:1px 8px;" @click="onStartRecording" :disabled="audio.isPlaying.value">● Rec</button>
        <button v-else class="btn-tiny" style="color:#fff;background:#e74c3c;border-color:#e74c3c;animation:pulse 1s infinite;padding:1px 8px;" @click="onStopRecording">■ Stop</button>
        <!-- Info -->
        <span v-if="audio.loadedFileName.value" class="text-[10px] font-mono truncate" style="color: var(--text-secondary);">{{ audio.loadedFileName.value }}</span>
        <span class="text-[10px] font-mono" style="color: var(--text-secondary);">{{ timeStr }}</span>
        <!-- Recorded Files -->
        <div v-if="audio.recordedBuffers.value.length > 0" class="flex flex-wrap gap-1">
          <span class="text-[9px] font-semibold w-full" style="color: var(--text-secondary);">Recorded:</span>
          <button
            v-for="(rec, i) in audio.recordedBuffers.value"
            :key="i"
            class="text-[9px] px-1.5 py-0.5 rounded font-mono"
            :class="{ 'font-bold': audio.loadedFileName.value === rec.name }"
            :style="audio.loadedFileName.value === rec.name ? 'background:var(--accent-copper-light);color:var(--accent-copper);border:1px solid var(--accent-copper);' : 'background:var(--bg-tertiary);color:var(--text-secondary);border:1px solid var(--border-secondary);'"
            @click="audio.loadRecorded(i)">{{ rec.name }}</button>
        </div>
      </div>

      <!-- Middle: Waveform -->
      <div class="rounded-xl border overflow-hidden flex flex-col" style="background: var(--bg-secondary); border-color: var(--border-primary); box-shadow: var(--shadow-xs);">
        <div class="px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary); border-bottom: 1px solid var(--border-secondary);">
          {{ audio.isRecording.value ? 'Recording Waveform' : 'Waveform' }}
        </div>
        <div class="flex-1 relative" style="min-height: 100px;">
          <canvas ref="waveCanvas" class="absolute inset-0 w-full h-full"></canvas>
        </div>
      </div>

      <!-- Right: Spectrum + Particle -->
      <div class="rounded-xl border overflow-hidden flex flex-col" style="background: var(--bg-secondary); border-color: var(--border-primary); box-shadow: var(--shadow-xs);">
        <div class="px-2.5 py-1 flex items-center justify-between" style="border-bottom: 1px solid var(--border-secondary);">
          <span class="text-[9px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">
            {{ audio.isRecording.value ? 'Recording Spectrum' : (viewMode === 'spectrum' ? 'Spectrum' : 'Particles') }}
          </span>
          <div v-if="!audio.isRecording.value" class="flex gap-0.5">
            <button class="view-toggle" :class="{ active: viewMode === 'spectrum' }" @click="viewMode = 'spectrum'" title="频谱视图">〰</button>
            <button class="view-toggle" :class="{ active: viewMode === 'particles' }" @click="viewMode = 'particles'" title="粒子视图">✦</button>
          </div>
        </div>
        <div class="flex-1 relative" style="min-height: 100px;">
          <canvas ref="specCanvas" class="absolute inset-0 w-full h-full" @click="onSpecClick"></canvas>
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div
      class="relative h-5 cursor-pointer rounded group"
      style="background: var(--bg-tertiary);"
      @mousedown="onSeekStart"
    >
      <div
        class="absolute inset-y-0 left-0 rounded transition-all duration-75"
        :style="`width: ${progressPct}%; background: var(--accent-copper); opacity: 0.25;`"
      ></div>
      <div
        class="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        :style="`left: calc(${progressPct}% - 5px); background: var(--accent-copper); box-shadow: 0 0 4px rgba(196,132,92,0.5);`"
      ></div>
    </div>

    <!-- Row 2: EQ + FX (side by side) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" style="min-height: 200px;">
      <!-- EQ Panel -->
      <div class="rounded-xl border overflow-hidden flex flex-col" style="background: var(--bg-secondary); border-color: var(--border-primary); box-shadow: var(--shadow-xs);">
        <div class="flex items-center justify-between px-2.5 py-1 border-b" style="border-color: var(--border-secondary);">
          <span class="text-[9px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">Equalizer</span>
          <div class="flex gap-2 items-center">
            <span v-if="gains.some(g => Math.abs(g) > 0.1)" class="text-[8px] font-mono" style="color: var(--accent-copper);">EQ ON</span>
            <button class="text-[9px] px-1.5 py-0.5 rounded font-medium" style="background: var(--accent-copper-light); color: var(--accent-copper);" @click="flatEq">Flat</button>
          </div>
        </div>
        <!-- Frequency Response Curve -->
        <div class="relative border-b flex-shrink-0" style="border-color: var(--border-secondary);">
          <canvas ref="eqCurveCanvas" class="w-full" style="height: 110px; cursor: crosshair;" @mousemove="onEqCurveMouseMove" @mouseleave="onEqCurveMouseLeave"></canvas>
          <div v-if="eqTooltip.show"
            class="absolute pointer-events-none text-[8px] font-mono px-1 py-0.5 rounded whitespace-nowrap"
            :style="{
              left: eqTooltip.x + 'px', top: eqTooltip.y + 'px',
              background: 'var(--bg-primary)', color: 'var(--text-primary)',
              border: '1px solid var(--border-secondary)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              zIndex: 10
            }">{{ eqTooltip.label }}</div>
        </div>
        <!-- Knobs -->
        <div ref="knobContainer" style="position:relative; height: 100px; padding: 4px 4px 2px 22px; margin:0; flex-shrink:0;">
          <div v-for="(band, i) in bands" :key="band.name" :style="knobStyles[i]"
            class="flex flex-col items-center gap-0.5" style="width:32px;">
            <canvas class="eq-knob" :data-index="i" width="32" height="32"
              @mousedown.prevent="onKnobMouseDown(i, $event)"
              @dblclick="flatEq"></canvas>
            <span class="text-[8px] font-mono leading-none" style="color:var(--text-secondary);">{{ localGains[i] > 0 ? '+' : '' }}{{ localGains[i].toFixed(1) }}</span>
            <span class="text-[7px] font-mono leading-none" style="color:var(--text-tertiary);">{{ band.name }}</span>
          </div>
        </div>
      </div>

      <!-- FX Panel -->
      <div class="rounded-xl border overflow-hidden flex flex-col" style="background: var(--bg-secondary); border-color: var(--border-primary); box-shadow: var(--shadow-xs);">
        <div class="flex items-center justify-between px-2.5 py-1 border-b" style="border-color: var(--border-secondary);">
          <span class="text-[9px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">Effects</span>
          <div class="flex gap-1">
            <button
              class="text-[8px] px-1.5 py-0.5 rounded font-medium"
              :style="audio.reverbEnabled.value ? 'background:var(--accent-copper-light);color:var(--accent-copper);border:1px solid var(--accent-copper);' : 'background:var(--bg-tertiary);color:var(--text-tertiary);border:1px solid var(--border-secondary);'"
              @click="toggleReverb"
            >Reverb {{ audio.reverbEnabled.value ? 'ON' : 'OFF' }}</button>
            <button
              class="text-[8px] px-1.5 py-0.5 rounded font-medium"
              :style="audio.delayEnabled.value ? 'background:var(--accent-copper-light);color:var(--accent-copper);border:1px solid var(--accent-copper);' : 'background:var(--bg-tertiary);color:var(--text-tertiary);border:1px solid var(--border-secondary);'"
              @click="toggleDelay"
            >Delay {{ audio.delayEnabled.value ? 'ON' : 'OFF' }}</button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto px-2.5 py-1.5 space-y-2">
          <!-- Reverb Section -->
          <div>
            <div class="flex items-center justify-between mb-0.5">
              <span class="text-[8px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">Reverb</span>
              <select v-model="audio.reverbType.value" @change="onReverbTypeChange" class="text-[9px] font-mono px-1 py-0.5 rounded border-0" style="background: var(--bg-tertiary); color: var(--text-primary); outline: none;">
                <option value="hall">Hall</option>
                <option value="room">Room</option>
                <option value="church">Church</option>
                <option value="plate">Plate</option>
                <option value="chamber">Chamber</option>
                <option value="spring">Spring</option>
              </select>
            </div>
            <div class="flex items-center gap-1.5 mb-0.5">
               <span class="text-[8px] font-mono w-6 flex-shrink-0" style="color: var(--text-tertiary);">Time</span>
               <input type="range" class="fx-slider flex-1" min="0.1" max="10" step="0.1" :value="audio.reverbTime.value" @input="onReverbTimeChange">
               <span class="text-[8px] font-mono w-10 text-right flex-shrink-0" style="color: var(--text-secondary);">{{ audio.reverbTime.value.toFixed(1) }}s</span>
             </div>
             <div class="flex items-center gap-1.5 mb-0.5">
               <span class="text-[8px] font-mono w-6 flex-shrink-0" style="color: var(--text-tertiary);">Mix</span>
               <input type="range" class="fx-slider flex-1" min="0" max="1" step="0.01" :value="audio.reverbMix.value" @input="onReverbMixChange">
               <span class="text-[8px] font-mono w-10 text-right flex-shrink-0" style="color: var(--text-secondary);">{{ Math.round(audio.reverbMix.value * 100) }}%</span>
             </div>
             <div class="flex items-center gap-1.5 mb-0.5">
               <span class="text-[8px] font-mono w-6 flex-shrink-0" style="color: var(--text-tertiary);">Early</span>
               <input type="range" class="fx-slider flex-1" min="0" max="1" step="0.01" :value="audio.reverbEarlyReflections.value" @input="onReverbEarlyChange">
               <span class="text-[8px] font-mono w-10 text-right flex-shrink-0" style="color: var(--text-secondary);">{{ Math.round(audio.reverbEarlyReflections.value * 100) }}%</span>
             </div>
          </div>
          <div style="border-top: 1px solid var(--border-secondary);"></div>
          <!-- Delay Section -->
          <div>
            <div class="flex items-center justify-between mb-0.5">
              <span class="text-[8px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">Delay</span>
              <button
                class="text-[8px] px-1 py-0.5 rounded font-mono"
                :style="audio.delaySync.value ? 'background:var(--accent-copper-light);color:var(--accent-copper);' : 'background:var(--bg-tertiary);color:var(--text-tertiary);'"
                @click="toggleDelaySync"
              >{{ audio.delaySync.value ? 'BPM' : 'ms' }}</button>
            </div>
            <div v-if="!audio.delaySync.value" class="flex items-center gap-1.5 mb-0.5">
               <span class="text-[8px] font-mono w-6 flex-shrink-0" style="color: var(--text-tertiary);">Time</span>
               <input type="range" class="fx-slider flex-1" min="10" max="2000" step="1" :value="audio.delayTimeMs.value" @input="onDelayTimeChange">
               <span class="text-[8px] font-mono w-10 text-right flex-shrink-0" style="color: var(--text-secondary);">{{ Math.round(audio.delayTimeMs.value) }}ms</span>
             </div>
            <div v-if="audio.delaySync.value" class="flex items-center gap-1.5 mb-0.5">
               <span class="text-[8px] font-mono" style="color: var(--text-tertiary);">BPM</span>
               <input type="number" class="flex-1 text-[9px] font-mono px-1 py-0.5 rounded border-0 text-center" style="background: var(--bg-tertiary); color: var(--text-primary); outline: none;" :value="audio.bpm.value" min="20" max="300" @change="onBpmChange" />
               <span class="text-[8px] font-mono w-12 text-right" style="color: var(--text-secondary);">{{ delayDisplay }}</span>
             </div>
            <div class="flex items-center gap-1.5 mb-0.5">
               <span class="text-[8px] font-mono w-6 flex-shrink-0" style="color: var(--text-tertiary);">Feed</span>
               <input type="range" class="fx-slider flex-1" min="0" max="0.9" step="0.01" :value="audio.delayFeedback.value" @input="onDelayFeedbackChange">
               <span class="text-[8px] font-mono w-10 text-right flex-shrink-0" style="color: var(--text-secondary);">{{ Math.round(audio.delayFeedback.value * 100) }}%</span>
             </div>
             <div class="flex items-center gap-1.5 mb-0.5">
               <span class="text-[8px] font-mono w-6 flex-shrink-0" style="color: var(--text-tertiary);">Mix</span>
               <input type="range" class="fx-slider flex-1" min="0" max="1" step="0.01" :value="audio.delayMix.value" @input="onDelayMixChange">
               <span class="text-[8px] font-mono w-10 text-right flex-shrink-0" style="color: var(--text-secondary);">{{ Math.round(audio.delayMix.value * 100) }}%</span>
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 3: Signal Flow Visualization -->
    <div class="rounded-xl border overflow-hidden flex-shrink-0" style="background: var(--bg-secondary); border-color: var(--border-primary); box-shadow: var(--shadow-xs);">
      <div class="px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary); border-bottom: 1px solid var(--border-secondary);">
        Signal Flow
      </div>
      <div class="relative" style="height: 52px;">
        <canvas ref="signalCanvas" class="absolute inset-0 w-full h-full"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  audio: Object,
  gains: Array
})
const emit = defineEmits(['update:gains', 'file-loaded', 'play-original', 'play-noise', 'save'])

// Local slider state: drives slider visuals, synced from props.gains
const localGains = reactive([...props.gains])
watch(() => props.gains, (ng) => {
  for (let i = 0; i < 10; i++) localGains[i] = ng[i]
  redrawAllKnobs()
}, { deep: true })

const bands = [
  { name: '31', freq: 31 }, { name: '62', freq: 62 }, { name: '125', freq: 125 },
  { name: '250', freq: 250 }, { name: '500', freq: 500 },
  { name: '1k', freq: 1000 }, { name: '2k', freq: 2000 }, { name: '4k', freq: 4000 },
  { name: '8k', freq: 8000 }, { name: '16k', freq: 16000 }
]

const waveCanvas = ref(null)
const specCanvas = ref(null)
const fileInput = ref(null)
const eqCurveCanvas = ref(null)
const knobContainer = ref(null)
const signalCanvas = ref(null)
const viewMode = ref('spectrum')

let animId = null
let audioCtx = null
let isPaused = false
let frameCount = 0

// EQ curve visualization state
const eqTooltip = ref({ show: false, label: '', x: 0, y: 0 })
let eqActiveBand = -1
let eqHoveredBand = -1
const EQ_FREQ_MIN = 20
const EQ_FREQ_MAX = 20000
const EQ_DB_RANGE = 16  // display range: -16dB to +16dB
const EQ_GAIN_MAX = 12  // knob range: -12dB to +12dB

function formatFreqLabel(f) {
  if (f >= 1000) return (f / 1000).toFixed(f >= 10000 ? 0 : 1) + 'k'
  return f.toString()
}
function formatFreqFull(f) {
  if (f >= 1000) return (f / 1000).toFixed(1) + ' kHz'
  return f + ' Hz'
}

function freqToX(freq, plotW, mL) {
  const lMin = Math.log10(EQ_FREQ_MIN), lMax = Math.log10(EQ_FREQ_MAX)
  return mL + (Math.log10(freq) - lMin) / (lMax - lMin) * plotW
}
// Returns the log-frequency position as a percentage (0-100%) for absolute positioning
function freqToPct(freq) {
  const lMin = Math.log10(EQ_FREQ_MIN), lMax = Math.log10(EQ_FREQ_MAX)
  return (Math.log10(freq) - lMin) / (lMax - lMin) * 100
}
function dbToY(db, plotH, mT) {
  return mT + (1 - (db + EQ_DB_RANGE) / (2 * EQ_DB_RANGE)) * plotH
}

// Compute combined frequency response of all 10 peaking filters
function computeEqResponse(gains) {
  const N = 200, Q = 1.41
  const lMin = Math.log10(EQ_FREQ_MIN), lMax = Math.log10(EQ_FREQ_MAX)
  const out = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const f = Math.pow(10, lMin + (lMax - lMin) * i / (N - 1))
    let sum = 0
    for (let j = 0; j < 10; j++) {
      const g = gains[j]
      if (Math.abs(g) < 0.01) continue
      const r = f / bands[j].freq
      sum += g / (1 + Math.pow((r - 1 / r) * Q, 2))
    }
    out[i] = sum
  }
  return out
}

function drawEqCurve() {
  const canvas = eqCurveCanvas.value
  if (!canvas) return
  const W = canvas.clientWidth, H = canvas.clientHeight
  if (!W || !H) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  canvas.width = W * dpr; canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const mL = 26, mR = 6, mT = 8, mB = 16
  const plotW = W - mL - mR, plotH = H - mT - mB

  // Clear
  ctx.fillStyle = '#FAFBFC'
  ctx.fillRect(0, 0, W, H)

  // === Horizontal grid (dB levels) ===
  ctx.lineWidth = 0.5
  ;[-12, -6, 0, 6, 12].forEach(db => {
    const y = dbToY(db, plotH, mT)
    ctx.beginPath()
    ctx.setLineDash(db === 0 ? [] : [2, 2])
    ctx.strokeStyle = db === 0 ? '#CCC' : '#E6E6E6'
    ctx.moveTo(mL, y); ctx.lineTo(W - mR, y)
    ctx.stroke()
    // Label
    ctx.fillStyle = '#AAA'
    ctx.font = '7px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(db + 'dB', mL - 3, y + 2.5)
  })
  ctx.setLineDash([])

  // === Vertical grid (ISO band frequencies) ===
  ctx.font = '7px monospace'
  ctx.textAlign = 'center'
  const hlIdx = eqActiveBand >= 0 ? eqActiveBand : eqHoveredBand
  bands.forEach((band, i) => {
    const x = freqToX(band.freq, plotW, mL)
    const isHL = i === hlIdx
    ctx.beginPath()
    ctx.strokeStyle = isHL ? 'rgba(91,127,165,0.25)' : '#ECECEC'
    ctx.lineWidth = isHL ? 1.2 : 0.5
    ctx.setLineDash(isHL ? [] : [1, 3])
    ctx.moveTo(x, mT); ctx.lineTo(x, H - mB)
    ctx.stroke()
    // X label
    ctx.fillStyle = isHL ? '#5B7FA5' : '#AAA'
    ctx.font = isHL ? '8px monospace' : '7px monospace'
    ctx.fillText(formatFreqLabel(band.freq), x, H - 2)
  })
  ctx.setLineDash([])

  // === Compute response ===
  const resp = computeEqResponse(localGains)

  // === Fill under curve (to 0dB) ===
  const zeroY = dbToY(0, plotH, mT)
  const step = plotW / (resp.length - 1)
  ctx.beginPath()
  for (let i = 0; i < resp.length; i++) {
    const x = mL + i * step
    const y = dbToY(resp[i], plotH, mT)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  const lx = mL + (resp.length - 1) * step
  ctx.lineTo(lx, zeroY)
  ctx.lineTo(mL, zeroY)
  ctx.closePath()
  ctx.fillStyle = 'rgba(91, 127, 165, 0.06)'
  ctx.fill()

  // === Curve line ===
  ctx.beginPath()
  for (let i = 0; i < resp.length; i++) {
    const x = mL + i * step
    const y = dbToY(resp[i], plotH, mT)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.strokeStyle = '#5B7FA5'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // === Dots at band positions ===
  localGains.forEach((g, i) => {
    if (Math.abs(g) < 0.3) return
    const x = freqToX(bands[i].freq, plotW, mL)
    const y = dbToY(g, plotH, mT)
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#5B7FA5'
    ctx.fill()
    ctx.strokeStyle = '#FFF'
    ctx.lineWidth = 1
    ctx.stroke()
  })

  // === Hover/active dot highlight ===
  if (hlIdx >= 0 && Math.abs(localGains[hlIdx]) > 0.1) {
    const x = freqToX(bands[hlIdx].freq, plotW, mL)
    const y = dbToY(localGains[hlIdx], plotH, mT)
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#5B7FA5'
    ctx.fill()
    ctx.strokeStyle = '#FFF'
    ctx.lineWidth = 2
    ctx.stroke()
  }
}

// ── Knob drawing ──
function drawKnob(ctx, cx, cy, r, val, minV, maxV) {
  // Industry-standard audio knob: 0dB → 12 o'clock (-π/2)
  // Min (-30dB) → 7:30 position  Max (+30dB) → 4:30 position
  const minAngle = -5 * Math.PI / 4   // -225°
  const maxAngle = Math.PI / 4        // +45°
  const norm = Math.max(0, Math.min(1, (val - minV) / (maxV - minV)))
  const angle = minAngle + (maxAngle - minAngle) * norm

  // Track arc
  ctx.beginPath()
  ctx.arc(cx, cy, r - 2, minAngle, maxAngle)
  ctx.strokeStyle = '#E0E0E0'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.stroke()

  // Value arc
  ctx.beginPath()
  ctx.arc(cx, cy, r - 2, minAngle, angle)
  ctx.strokeStyle = Math.abs(val) > 0.3 ? '#5B7FA5' : '#C0C0C0'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.stroke()

  // Pointer
  const pLen = r - 5
  const px = cx + Math.cos(angle) * pLen
  const py = cy + Math.sin(angle) * pLen
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(px, py)
  ctx.strokeStyle = '#555'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Center dot
  ctx.beginPath()
  ctx.arc(cx, cy, 2, 0, Math.PI * 2)
  ctx.fillStyle = '#555'
  ctx.fill()
}

function redrawAllKnobs() {
  const el = knobContainer.value
  if (!el) return
  const canvases = el.querySelectorAll('.eq-knob')
  const dpr = window.devicePixelRatio || 1
  canvases.forEach((canvas, i) => {
    if (i >= localGains.length) return
    const ctx = canvas.getContext('2d')
    const W = 36, H = 36
    canvas.width = W * dpr; canvas.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    drawKnob(ctx, W / 2, H / 2, W / 2, localGains[i], -EQ_GAIN_MAX, EQ_GAIN_MAX)
  })
}

function redrawSingleKnob(idx) {
  const el = knobContainer.value
  if (!el) return
  const canvas = el.querySelectorAll('.eq-knob')[idx]
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const W = 36, H = 36
  canvas.width = W * dpr; canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  drawKnob(ctx, W / 2, H / 2, W / 2, localGains[idx], -EQ_GAIN_MAX, EQ_GAIN_MAX)
}

// ── Knob mouse interaction ──
let knobDragIdx = -1
let knobDragStartY = 0
let knobDragStartVal = 0

function verifyKnobMapping() {
  const testPts = [-EQ_GAIN_MAX, -9, -6, -3, 0, 3, 6, 9, EQ_GAIN_MAX]
  const minA = -5 * Math.PI / 4, maxA = Math.PI / 4, rangeA = maxA - minA
  let ok = true
  for (const v of testPts) {
    const norm = Math.max(0, Math.min(1, (v + EQ_GAIN_MAX) / (2 * EQ_GAIN_MAX)))
    const angle = minA + rangeA * norm
    const normBack = (angle - minA) / rangeA
    const vBack = -EQ_GAIN_MAX + 2 * EQ_GAIN_MAX * normBack
    if (Math.abs(v - vBack) > 1e-6) { ok = false; console.warn('[Knob] MISMATCH', v, vBack) }
  }
  if (ok) console.log('[Knob] ✓ Mapping linear & accurate across ±' + EQ_GAIN_MAX + 'dB range')
}

function onKnobMouseDown(idx, e) {
  eqActiveBand = idx
  knobDragIdx = idx
  knobDragStartY = e.clientY
  knobDragStartVal = localGains[idx]
  document.addEventListener('mousemove', onKnobWindowMove)
  document.addEventListener('mouseup', onKnobWindowUp)
}

function onKnobWindowMove(e) {
  if (knobDragIdx < 0) return
  // 0.2 dB per pixel → full ±12dB range = 120px drag
  const deltaY = (knobDragStartY - e.clientY) * 0.2
  const val = Math.max(-EQ_GAIN_MAX, Math.min(EQ_GAIN_MAX, knobDragStartVal + deltaY))
  localGains[knobDragIdx] = val
  emit('update:gains', [...localGains])
  if (props.audio.isPlaying.value) {
    props.audio.updateEQBand(knobDragIdx, val)
  }
  redrawSingleKnob(knobDragIdx)
  eqActiveBand = knobDragIdx
}

function onKnobWindowUp() {
  knobDragIdx = -1
  eqActiveBand = -1
  document.removeEventListener('mousemove', onKnobWindowMove)
  document.removeEventListener('mouseup', onKnobWindowUp)
}

function onEqCurveMouseMove(e) {
  const canvas = eqCurveCanvas.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const W = canvas.clientWidth, H = canvas.clientHeight
  const mL = 26, mR = 6, mT = 8, mB = 16
  const plotW = W - mL - mR, plotH = H - mT - mB
  if (plotW <= 0 || plotH <= 0) return

  // Find nearest band
  let nearest = -1, minDist = Infinity
  bands.forEach((band, i) => {
    const bx = freqToX(band.freq, plotW, mL)
    const d = Math.abs(mx - bx)
    if (d < minDist && d < 22) { minDist = d; nearest = i }
  })
  eqHoveredBand = nearest

  if (nearest >= 0) {
    eqTooltip.value = {
      show: true,
      label: `${formatFreqFull(bands[nearest].freq)}: ${localGains[nearest].toFixed(1)} dB`,
      x: Math.min(mx + 10, W - 110),
      y: Math.max(my - 26, 2)
    }
  } else {
    eqTooltip.value.show = false
  }
}

function onEqCurveMouseLeave() {
  eqHoveredBand = -1
  eqTooltip.value.show = false
}

// Progress bar drag state
let isDragging = false
let dragPct = 0

const progressPct = computed(() => {
  if (isDragging) return dragPct * 100
  if (!props.audio.duration.value) return 0
  return (props.audio.currentTime.value / props.audio.duration.value) * 100
})

const timeStr = computed(() => {
  const t = props.audio.currentTime.value || 0
  const d = props.audio.duration.value || 0
  const fmt = (s) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, '0')}` }
  return `${fmt(t)} / ${fmt(d)}`
})

const delayDisplay = computed(() => {
  if (props.audio.delaySync.value) {
    const sec = 60 / Math.max(props.audio.bpm.value || 120, 20)
    if (sec >= 1) return sec.toFixed(1) + 's'
    return Math.round(sec * 1000) + 'ms'
  }
  return Math.round(props.audio.delayTimeMs.value) + 'ms'
})

// Absolute-position knob styles, pixel-aligned with EQ curve vertical grid lines
const knobStyles = computed(() => {
  return bands.map(band => ({
    position: 'absolute',
    left: freqToPct(band.freq) + '%',
    transform: 'translateX(-50%)'
  }))
})

function flatEq() {
  const g = Array(10).fill(0)
  for (let i = 0; i < 10; i++) localGains[i] = 0
  emit('update:gains', g)
  if (props.audio.isPlaying.value) {
    props.audio.applyEQGains(g)
  }
  redrawAllKnobs()
}

function playNoise() {
  emit('play-noise')
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
  // Apply current EQ gains to the real-time BiquadFilterNode chain
  if (props.audio.applyEQGains) {
    props.audio.applyEQGains(localGains)
  }
}

function pause() {
  if (audioCtx && audioCtx.state === 'running') {
    audioCtx.suspend()
    isPaused = true
  }
}

function save() { emit('save') }

// Progress bar drag
function onSeekStart(e) {
  if (!props.audio.duration.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  isDragging = true

  const calcPct = (clientX) => Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))

  const onMove = (ev) => {
    if (!isDragging) return
    dragPct = calcPct(ev.clientX)
  }

  const onUp = (ev) => {
    if (!isDragging) return
    isDragging = false
    const finalPct = calcPct(ev.clientX)
    const time = finalPct * props.audio.duration.value
    props.audio.seek(time)
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
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
  const newVal = g[nearest] <= 0 ? 12 : 0
  g[nearest] = newVal
  emit('update:gains', g)
  if (props.audio.isPlaying.value) {
    props.audio.updateEQBand(nearest, newVal)
  }
}

// Recording
function onStartRecording() {
  props.audio.startRecording()
}

function onStopRecording() {
  props.audio.stopRecording()
}

// FX handlers
function toggleReverb() {
  props.audio.toggleReverb(!props.audio.reverbEnabled.value)
}
function toggleDelay() {
  props.audio.toggleDelay(!props.audio.delayEnabled.value)
}

function onReverbTypeChange() {
  props.audio.applyFXParams()
  props.audio.updateReverbIR()
}

function onReverbTimeChange(e) {
  props.audio.reverbTime.value = parseFloat(e.target.value)
  props.audio.applyFXParams()
  props.audio.updateReverbIR()
}

function onReverbMixChange(e) {
  props.audio.reverbMix.value = parseFloat(e.target.value)
  props.audio.applyFXParams()
}

function onReverbEarlyChange(e) {
  props.audio.reverbEarlyReflections.value = parseFloat(e.target.value)
  props.audio.updateReverbIR()
}

function onDelayTimeChange(e) {
  props.audio.delayTimeMs.value = parseFloat(e.target.value)
  props.audio.applyFXParams()
}

function onDelayFeedbackChange(e) {
  props.audio.delayFeedback.value = parseFloat(e.target.value)
  props.audio.applyFXParams()
}

function onDelayMixChange(e) {
  props.audio.delayMix.value = parseFloat(e.target.value)
  props.audio.applyFXParams()
}

function toggleDelaySync() {
  props.audio.delaySync.value = !props.audio.delaySync.value
  props.audio.applyFXParams()
}

function onBpmChange(e) {
  const val = parseInt(e.target.value)
  if (!isNaN(val) && val >= 20 && val <= 300) {
    props.audio.bpm.value = val
    props.audio.applyFXParams()
  }
}

// ── Signal Flow Visualization ──
let signalFlowFrame = 0

function drawSignalFlow() {
  const canvas = signalCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth, H = canvas.clientHeight
  if (!W || !H) return
  canvas.width = W * dpr; canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const cy = H / 2

  // Node definitions: { label, x%, active (reactive) }
  const isPlaying = props.audio.isPlaying.value
  const nodes = [
    { label: 'Source',  pct: 8,  active: isPlaying, color: '#5B7FA5' },
    { label: 'EQ',      pct: 27, active: isPlaying, color: '#5B7FA5' },
    { label: 'Reverb',  pct: 48, active: isPlaying && props.audio.reverbEnabled.value, color: '#C4845C' },
    { label: 'Delay',   pct: 67, active: isPlaying && props.audio.delayEnabled.value, color: '#C4845C' },
    { label: 'Output',  pct: 90, active: isPlaying, color: '#5B7FA5' },
  ]

  signalFlowFrame++

  // Draw arrows between nodes
  for (let i = 0; i < nodes.length - 1; i++) {
    const from = nodes[i], to = nodes[i + 1]
    const x1 = W * from.pct / 100 + 24
    const x2 = W * to.pct / 100 - 24
    // Arrow is active only if TARGET node is active → breaks at inactive nodes
    const isActive = isPlaying && to.active

    // Arrow line
    ctx.beginPath()
    ctx.moveTo(x1, cy)
    ctx.lineTo(x2, cy)
    ctx.strokeStyle = isActive ? 'rgba(91,127,165,0.4)' : 'rgba(200,200,200,0.25)'
    ctx.lineWidth = isActive ? 2 : 1
    ctx.setLineDash(isActive ? [] : [3, 4])
    ctx.stroke()
    ctx.setLineDash([])

    // Arrowhead
    if (isActive) {
      ctx.beginPath()
      ctx.moveTo(x2, cy)
      ctx.lineTo(x2 - 6, cy - 4)
      ctx.lineTo(x2 - 6, cy + 4)
      ctx.closePath()
      ctx.fillStyle = 'rgba(91,127,165,0.5)'
      ctx.fill()
    }

    // Animated signal dot
    if (isActive) {
      const t = ((signalFlowFrame * 2 + i * 30) % 120) / 120
      const dx = x1 + (x2 - x1) * t
      const dotSize = 3 + Math.sin(signalFlowFrame * 0.08 + i) * 0.5
      ctx.beginPath()
      ctx.arc(dx, cy, dotSize, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(91,127,165,0.7)'
      ctx.fill()
      // Glow
      ctx.beginPath()
      ctx.arc(dx, cy, dotSize * 2.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(91,127,165,0.12)'
      ctx.fill()
    }
  }

  // Draw nodes
  nodes.forEach((node, i) => {
    const x = W * node.pct / 100
    const boxW = 44, boxH = 24
    const rx = 6

    // Box
    ctx.beginPath()
    ctx.roundRect(x - boxW / 2, cy - boxH / 2, boxW, boxH, rx)
    if (node.active) {
      ctx.fillStyle = node.color + '18'
      ctx.fill()
      ctx.strokeStyle = node.color
      ctx.lineWidth = 1.5
    } else {
      ctx.fillStyle = '#F5F5F5'
      ctx.fill()
      ctx.strokeStyle = '#DDD'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 3])
    }
    ctx.stroke()
    ctx.setLineDash([])

    // Label
    ctx.fillStyle = node.active ? node.color : '#BBB'
    ctx.font = '9px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(node.label, x, cy - 1)

    // Status indicator (small circle)
    if (!node.active && i > 0 && i < nodes.length - 1) {
      ctx.beginPath()
      ctx.arc(x + boxW / 2 + 5, cy, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = '#DDD'
      ctx.fill()
    }
  })
}

// Canvas rendering
function render() {
  drawWaveform()
  drawEqCurve()
  if (props.audio.isRecording.value) {
    drawRecordingSpectrum()
  } else if (viewMode.value === 'spectrum') {
    drawSpectrum()
  } else {
    drawParticles()
  }
  drawSignalFlow()
  animId = requestAnimationFrame(render)
}

function getAnalyserForRender() {
  if (props.audio.isRecording.value && props.audio.recordingAnalyser.value) {
    return props.audio.recordingAnalyser.value
  }
  return props.audio.analyserNode.value
}

function drawWaveform() {
  const canvas = waveCanvas.value
  const analyser = getAnalyserForRender()
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth, H = canvas.clientHeight
  if (!W || !H) return
  canvas.width = W * dpr; canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H)

  const isActive = props.audio.isRecording.value || props.audio.isPlaying.value
  if (!analyser || !isActive) return
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
  ctx.strokeStyle = props.audio.isRecording.value ? '#e74c3c' : '#C4845C'
  ctx.lineWidth = 1.5; ctx.stroke()
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
  // Log-frequency X-axis (same coordinate system as EQ curve)
  const sampleRate = analyser.context.sampleRate || 44100
  const nyquist = sampleRate / 2
  const lMin = Math.log10(EQ_FREQ_MIN), lMax = Math.log10(nyquist)
  const barCount = 200
  const step = W / barCount
  const barW = Math.max(1, step * 0.7)
  for (let i = 0; i < barCount; i++) {
    const freq = Math.pow(10, lMin + (lMax - lMin) * i / (barCount - 1))
    const binIdx = Math.round(freq / nyquist * bufLen)
    if (binIdx >= bufLen) continue
    const val = data[binIdx] / 255
    const bh = val * H
    const x = i * step + (step - barW) / 2
    ctx.fillStyle = `rgba(196,132,92,${0.15 + val * 0.7})`
    ctx.fillRect(x, H - bh, barW, bh)
  }
  // EQ curve overlay (log-frequency mapping)
  const g = localGains || []
  if (g.length > 1) {
    ctx.beginPath()
    for (let i = 0; i < barCount; i++) {
      const freq = Math.pow(10, lMin + (lMax - lMin) * i / (barCount - 1))
      const x = i * step
      // Compute combined response at this frequency
      const Q = 1.41
      let sum = 0
      for (let j = 0; j < 10; j++) {
        const gain = g[j]
        if (Math.abs(gain) < 0.01) continue
        const r = freq / bands[j].freq
        sum += gain / (1 + Math.pow((r - 1 / r) * Q, 2))
      }
      const n = sum / EQ_GAIN_MAX  // normalize to ±1
      const y = H / 2 - n * (H * 0.4)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1.5
    ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([])
  }
}

function drawRecordingSpectrum() {
  const canvas = specCanvas.value
  const analyser = props.audio.recordingAnalyser.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth, H = canvas.clientHeight
  if (!W || !H) return
  canvas.width = W * dpr; canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H)
  if (!analyser) return
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
    ctx.fillStyle = `rgba(231,76,60,${0.15 + val * 0.7})`
    ctx.fillRect(x, H - bh, barW, bh)
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
  redrawAllKnobs()
  verifyKnobMapping()
})

onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId)
})
</script>

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
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
.btn-tiny { @apply inline-flex items-center justify-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold rounded-lg border transition-all duration-150 cursor-pointer select-none; }
.btn-tiny:active { transform: scale(0.96); }
.btn-tiny:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-tiny.btn-primary { background: var(--btn-primary-bg); color: var(--btn-primary-text); border-color: var(--btn-primary-border); }
.btn-tiny.btn-primary:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-tiny.btn-secondary { background: transparent; color: var(--btn-secondary-text); border-color: var(--btn-secondary-border); }
.btn-tiny.btn-secondary:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-tiny.btn-outline { background: transparent; color: var(--accent-copper); border-color: var(--accent-copper-light); }
.btn-tiny.btn-outline:disabled { opacity: 0.3; cursor: not-allowed; }
.eq-knob { display: block; cursor: pointer; border-radius: 50%; }
.eq-knob:hover { box-shadow: 0 0 0 2px rgba(91,127,165,0.2); }
.eq-knob:active { box-shadow: 0 0 0 3px rgba(91,127,165,0.35); }
@media (max-width: 640px) { .eq-knob { width: 26px; height: 26px; } }
@media (max-width: 480px) { .eq-knob { width: 22px; height: 22px; } }
.view-toggle {
  width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
  font-size: 13px; border: 1px solid transparent; border-radius: var(--radius-sm);
  background: transparent; color: var(--text-tertiary); cursor: pointer;
  transition: all 150ms ease; padding: 0;
}
.view-toggle:hover { background: var(--bg-tertiary); color: var(--text-secondary); }
.view-toggle.active { background: var(--accent-copper-light); color: var(--accent-copper); border-color: var(--accent-copper); }

.fx-slider { -webkit-appearance: none; appearance: none; height: 3px; border-radius: 9999px; background: var(--slider-track); outline: none; cursor: pointer; }
.fx-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: var(--slider-thumb); cursor: pointer; border: none; }
.fx-slider::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: var(--slider-thumb); cursor: pointer; border: none; }
</style>
