<template>
  <div class="synth-container">
    <!-- Preset Bar -->
    <div class="preset-bar">
      <span class="section-label">Preset</span>
      <select class="synth-select" :value="synth.currentPreset.value" @change="synth.loadPreset($event.target.value)">
        <option v-for="p in synth.presets.value" :key="p.name" :value="p.name">{{ p.name }}</option>
      </select>
      <button class="s-btn s-btn-sm" @click="saveCurrent">Save</button>
      <button class="s-btn s-btn-sm" @click="synth.deletePreset(synth.currentPreset.value)" :disabled="synth.currentPreset.value === 'Default'">Del</button>
    </div>

    <!-- Row 1: Oscillators -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <!-- Osc 1 -->
      <div class="osc-panel">
        <div class="osc-header">
          <span class="panel-title" style="color:var(--accent-copper);">Osc 1</span>
          <label class="toggle-row"><input type="checkbox" :checked="synth.osc1.active" @change="synth.osc1.active = $event.target.checked"> Active</label>
        </div>
        <div class="osc-body">
          <div class="osc-controls">
            <div class="param-row"><label class="param-label">Wave</label>
              <select class="synth-select" :value="synth.osc1.type" @change="synth.osc1.type = $event.target.value">
                <option v-for="w in waves" :key="w" :value="w">{{ w }}</option>
              </select>
            </div>
            <div class="param-row"><label class="param-label">Detune</label><input type="range" class="s-slider" min="-50" max="50" :value="synth.osc1.detune" @input="synth.osc1.detune = +$event.target.value"><span class="param-val">{{ synth.osc1.detune }}</span></div>
            <div class="param-row"><label class="param-label">Level</label><input type="range" class="s-slider" min="0" max="1" step="0.01" :value="synth.osc1.gain" @input="synth.osc1.gain = +$event.target.value"><span class="param-val">{{ (synth.osc1.gain * 100).toFixed(0) }}%</span></div>
            <div class="param-row"><label class="param-label">Octave</label>
              <select class="synth-select" :value="synth.osc1.octave" @change="synth.osc1.octave = +$event.target.value">
                <option v-for="o in [-2,-1,0,1,2]" :key="o" :value="o">{{ o > 0 ? '+' : '' }}{{ o }}</option>
              </select>
            </div>
          </div>
          <div class="wave-preview-wrap"><canvas ref="osc1WaveRef"></canvas></div>
        </div>
      </div>

      <!-- Osc 2 -->
      <div class="osc-panel">
        <div class="osc-header">
          <span class="panel-title" style="color:var(--accent-copper);">Osc 2</span>
          <label class="toggle-row"><input type="checkbox" :checked="synth.osc2.active" @change="synth.osc2.active = $event.target.checked"> Active</label>
        </div>
        <div class="osc-body">
          <div class="osc-controls">
            <div class="param-row"><label class="param-label">Wave</label>
              <select class="synth-select" :value="synth.osc2.type" @change="synth.osc2.type = $event.target.value">
                <option v-for="w in waves" :key="w" :value="w">{{ w }}</option>
              </select>
            </div>
            <div class="param-row"><label class="param-label">Detune</label><input type="range" class="s-slider" min="-50" max="50" :value="synth.osc2.detune" @input="synth.osc2.detune = +$event.target.value"><span class="param-val">{{ synth.osc2.detune }}</span></div>
            <div class="param-row"><label class="param-label">Level</label><input type="range" class="s-slider" min="0" max="1" step="0.01" :value="synth.osc2.gain" @input="synth.osc2.gain = +$event.target.value"><span class="param-val">{{ (synth.osc2.gain * 100).toFixed(0) }}%</span></div>
            <div class="param-row"><label class="param-label">Octave</label>
              <select class="synth-select" :value="synth.osc2.octave" @change="synth.osc2.octave = +$event.target.value">
                <option v-for="o in [-2,-1,0,1,2]" :key="o" :value="o">{{ o > 0 ? '+' : '' }}{{ o }}</option>
              </select>
            </div>
          </div>
          <div class="wave-preview-wrap"><canvas ref="osc2WaveRef"></canvas></div>
        </div>
      </div>
    </div>

    <!-- Row 2: Filter + LFO + FX -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <!-- Filter -->
      <div class="synth-panel">
        <div class="panel-title" style="color:var(--accent-copper);">Filter</div>
        <div class="param-row"><label class="param-label">Type</label><select class="synth-select" :value="synth.filterCfg.type" @change="synth.filterCfg.type = $event.target.value; synth.updateFilter()"><option v-for="t in filterTypes" :key="t" :value="t">{{ t }}</option></select></div>
        <div class="param-row"><label class="param-label">Cutoff</label><input type="range" class="s-slider" min="20" max="20000" :value="synth.filterCfg.cutoff" @input="synth.filterCfg.cutoff = +$event.target.value; synth.updateFilter()"><span class="param-val">{{ synth.filterCfg.cutoff < 1000 ? synth.filterCfg.cutoff.toFixed(0) + 'Hz' : (synth.filterCfg.cutoff/1000).toFixed(1) + 'k' }}</span></div>
        <div class="param-row"><label class="param-label">Res</label><input type="range" class="s-slider" min="0" max="20" step="0.1" :value="synth.filterCfg.resonance" @input="synth.filterCfg.resonance = +$event.target.value; synth.updateFilter()"><span class="param-val">{{ synth.filterCfg.resonance.toFixed(1) }}</span></div>
        <div class="param-row"><label class="param-label">Env</label><input type="range" class="s-slider" min="0" max="1" step="0.01" :value="synth.filterCfg.envAmt" @input="synth.filterCfg.envAmt = +$event.target.value"><span class="param-val">{{ (synth.filterCfg.envAmt * 100).toFixed(0) }}%</span></div>
      </div>

      <!-- LFO -->
      <div class="synth-panel">
        <div class="panel-title" style="color:var(--accent-copper);">LFO</div>
        <div class="param-row"><label class="param-label">Wave</label><select class="synth-select" :value="synth.lfoCfg.type" @change="synth.lfoCfg.type = $event.target.value; updateLFO()"><option v-for="w in lfoWaves" :key="w" :value="w">{{ w }}</option></select></div>
        <div class="param-row"><label class="param-label">Rate</label><input type="range" class="s-slider" min="0.1" max="20" step="0.1" :value="synth.lfoCfg.rate" @input="synth.lfoCfg.rate = +$event.target.value; updateLFO()"><span class="param-val">{{ synth.lfoCfg.rate.toFixed(1) }}Hz</span></div>
        <div class="param-row"><label class="param-label">Amt</label><input type="range" class="s-slider" min="0" max="1" step="0.01" :value="synth.lfoCfg.amount" @input="synth.lfoCfg.amount = +$event.target.value; updateLFO()"><span class="param-val">{{ (synth.lfoCfg.amount * 100).toFixed(0) }}%</span></div>
        <div class="param-row"><label class="param-label">Target</label><select class="synth-select" :value="synth.lfoCfg.target" @change="synth.lfoCfg.target = $event.target.value; updateLFO()"><option v-for="t in lfoTargets" :key="t" :value="t">{{ t }}</option></select></div>
      </div>

      <!-- FX + Noise -->
      <div class="synth-panel">
        <div class="panel-title" style="color:var(--text-secondary);">FX</div>
        <div class="param-row"><label class="param-label">Reverb</label><input type="range" class="s-slider" min="0" max="1" step="0.01" :value="synth.fx.reverb" @input="synth.fx.reverb = +$event.target.value"><span class="param-val">{{ (synth.fx.reverb * 100).toFixed(0) }}%</span></div>
        <div class="param-row"><label class="param-label">Delay</label><input type="range" class="s-slider" min="0" max="1" step="0.01" :value="synth.fx.delay" @input="synth.fx.delay = +$event.target.value"><span class="param-val">{{ (synth.fx.delay * 100).toFixed(0) }}%</span></div>
        <div class="param-row"><label class="param-label">Fdbk</label><input type="range" class="s-slider" min="0" max="1" step="0.01" :value="synth.fx.feedback" @input="synth.fx.feedback = +$event.target.value"><span class="param-val">{{ (synth.fx.feedback * 100).toFixed(0) }}%</span></div>
        <div class="param-row" style="border-top: 1px solid var(--border-secondary); padding-top: 6px; margin-top: 4px;">
          <label class="param-label">Noise</label><input type="range" class="s-slider" min="0" max="1" step="0.01" :value="synth.noiseLevel.value" @input="synth.noiseLevel.value = +$event.target.value"><span class="param-val">{{ (synth.noiseLevel.value * 100).toFixed(0) }}%</span>
        </div>
      </div>
    </div>

    <!-- Row 3: ADSR + Spectrum -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <!-- ADSR -->
      <div class="synth-panel">
        <div class="panel-title" style="color:var(--accent-copper);">ADSR</div>
        <div class="param-row"><label class="param-label">Attack</label><input type="range" class="s-slider" min="0.001" max="2" step="0.001" :value="synth.adsr.attack" @input="synth.adsr.attack = +$event.target.value"><span class="param-val">{{ synth.adsr.attack.toFixed(2) }}s</span></div>
        <div class="param-row"><label class="param-label">Decay</label><input type="range" class="s-slider" min="0.001" max="2" step="0.001" :value="synth.adsr.decay" @input="synth.adsr.decay = +$event.target.value"><span class="param-val">{{ synth.adsr.decay.toFixed(2) }}s</span></div>
        <div class="param-row"><label class="param-label">Sustain</label><input type="range" class="s-slider" min="0" max="1" step="0.01" :value="synth.adsr.sustain" @input="synth.adsr.sustain = +$event.target.value"><span class="param-val">{{ (synth.adsr.sustain * 100).toFixed(0) }}%</span></div>
        <div class="param-row"><label class="param-label">Release</label><input type="range" class="s-slider" min="0.001" max="3" step="0.001" :value="synth.adsr.release" @input="synth.adsr.release = +$event.target.value"><span class="param-val">{{ synth.adsr.release.toFixed(2) }}s</span></div>
        <div class="adsr-viz">
          <svg viewBox="0 0 200 40" class="w-full h-full">
            <path :d="adsrPath" stroke="var(--accent-copper)" stroke-width="1.5" fill="none"/>
          </svg>
        </div>
      </div>

      <!-- Spectrum (spans 2 columns) -->
      <div class="spec-panel lg:col-span-2">
        <div class="panel-title" style="color:var(--text-secondary); font-size:10px;">Spectrum</div>
        <div class="spec-canvas-wrap"><canvas ref="specCanvasRef"></canvas></div>
      </div>
    </div>

    <!-- Keyboard -->
    <div class="keyboard" @mousedown="onMouseDown" @mouseup="onMouseUp" @mouseleave="onMouseUp" @touchstart.prevent="onTouchStart" @touchend="onTouchEnd">
      <div v-for="key in keys" :key="key.midi"
        class="key"
        :class="{ white: !key.isBlack, black: key.isBlack, active: key.active }"
        :style="key.isBlack ? blackKeyStyle(key) : whiteKeyStyle(key)"
        :data-midi="key.midi"
      >{{ key.isBlack ? '' : key.name }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useSynth, midiToName } from '../composables/useSynth.js'

const synth = useSynth()
const specCanvasRef = ref(null)
const osc1WaveRef = ref(null)
const osc2WaveRef = ref(null)
let animId = null

const waves = ['sine', 'square', 'triangle', 'sawtooth']
const lfoWaves = ['sine', 'square', 'triangle', 'sawtooth']
const filterTypes = ['lowpass', 'highpass', 'bandpass', 'notch']
const lfoTargets = ['pitch', 'cutoff', 'volume']

// ADSR SVG path
const adsrPath = computed(() => {
  const a = synth.adsr.attack
  const d = synth.adsr.decay
  const s = synth.adsr.sustain
  const aEnd = Math.min(35 * a / 2, 60)
  const dEnd = aEnd + Math.min(35 * d / 2, 60)
  const sustY = 35 - 35 * s
  return `M0,35 L${aEnd},0 L${dEnd},${sustY} L160,${sustY} L200,35`
})

// Wave preview drawing
function drawWaveShape(type, canvas) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth, H = canvas.clientHeight
  if (!W || !H) return
  canvas.width = W * dpr; canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H)

  const cx = W / 2, cy = H / 2
  const amp = H * 0.4
  const periods = 2
  const steps = 200

  ctx.beginPath()
  if (type === 'sine') {
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * W
      const phase = (i / steps) * periods * Math.PI * 2
      const y = cy - Math.sin(phase) * amp
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
  } else if (type === 'square') {
    const halfStep = steps / (periods * 2)
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * W
      const seg = Math.floor(i / halfStep)
      const y = seg % 2 === 0 ? cy - amp : cy + amp
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
  } else if (type === 'triangle') {
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * W
      const phase = ((i / steps) * periods) % 1
      const y = cy + (phase < 0.5 ? (phase * 4 - 1) : (3 - phase * 4)) * amp
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
  } else if (type === 'sawtooth') {
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * W
      const phase = ((i / steps) * periods) % 1
      const y = cy + (phase * 2 - 1) * amp
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
  }
  ctx.strokeStyle = '#C4845C'; ctx.lineWidth = 1.5; ctx.stroke()
}

watch(() => synth.osc1.type, () => drawWaveShape(synth.osc1.type, osc1WaveRef.value))
watch(() => synth.osc2.type, () => drawWaveShape(synth.osc2.type, osc2WaveRef.value))

// Keyboard
const keyRange = computed(() => {
  const keys = []
  const start = 48, end = 72
  let wIdx = 0
  for (let m = start; m <= end; m++) {
    const isBlack = synth.isBlackKey(m)
    if (!isBlack) {
      keys.push({ midi: m, name: midiToName(m), isBlack: false, wIdx, active: false })
      wIdx++
    } else {
      keys.push({ midi: m, name: midiToName(m), isBlack: true, wIdx: wIdx - 0.3, active: false })
    }
  }
  return keys
})

const keys = ref(keyRange.value)

function whiteKeyStyle(key) { return {} }
function blackKeyStyle(key) {
  return { left: `calc(${(key.wIdx + 1) * 100 / 15}% - 12px)`, width: '24px', zIndex: 10 }
}

function getMidiFromEvent(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY)
  if (!el) return -1
  const midi = parseInt(el.dataset.midi)
  return isNaN(midi) ? -1 : midi
}

function onMouseDown(e) {
  const midi = getMidiFromEvent(e)
  if (midi >= 0) {
    synth.noteOn(midi)
    const k = keys.value.find(k => k.midi === midi)
    if (k) k.active = true
  }
}

function onMouseUp(e) {
  keys.value.forEach(k => {
    if (k.active) {
      synth.noteOff(k.midi)
      k.active = false
    }
  })
}

// Touch
let touchNotes = {}
function onTouchStart(e) {
  for (const touch of e.changedTouches) {
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    if (!el) continue
    const midi = parseInt(el.dataset.midi)
    if (!isNaN(midi) && midi >= 0) {
      synth.noteOn(midi)
      touchNotes[touch.identifier] = midi
      const k = keys.value.find(k => k.midi === midi)
      if (k) k.active = true
    }
  }
}

function onTouchEnd(e) {
  for (const touch of e.changedTouches) {
    const midi = touchNotes[touch.identifier]
    if (midi !== undefined) {
      synth.noteOff(midi)
      const k = keys.value.find(k => k.midi === midi)
      if (k) k.active = false
      delete touchNotes[touch.identifier]
    }
  }
}

function saveCurrent() {
  const name = prompt('Preset name:', synth.currentPreset.value)
  if (name) synth.savePreset(name)
}

function updateLFO() {
  if (synth.updateLFORouting) synth.updateLFORouting()
}

// Spectrum rendering
function renderSpectrum() {
  const canvas = specCanvasRef.value
  const analyser = synth.getAnalyser()
  if (!canvas || !analyser) { animId = requestAnimationFrame(renderSpectrum); return }
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth, H = canvas.clientHeight
  if (!W || !H) { animId = requestAnimationFrame(renderSpectrum); return }
  canvas.width = W * dpr; canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H)

  const bufLen = analyser.frequencyBinCount
  const data = new Uint8Array(bufLen)
  analyser.getByteFrequencyData(data)

  const count = Math.min(bufLen, 64)
  const step = W / count
  const bw = Math.max(1, step * 0.6)
  for (let i = 0; i < count; i++) {
    const val = data[i] / 255
    const bh = val * H
    ctx.fillStyle = `rgba(196,132,92,${0.15 + val * 0.7})`
    ctx.fillRect(i * step + (step - bw) / 2, H - bh, bw, bh)
  }
  animId = requestAnimationFrame(renderSpectrum)
}

// Keyboard shortcut
function onKeyDown(e) {
  const keyMap = {
    'a': 48, 'w': 49, 's': 50, 'e': 51, 'd': 52,
    'f': 53, 't': 54, 'g': 55, 'y': 56, 'h': 57, 'u': 58, 'j': 59,
    'k': 60, 'o': 61, 'l': 62, 'p': 63, ';': 64,
  }
  const midi = keyMap[e.key.toLowerCase()]
  if (midi !== undefined && !e.repeat) {
    e.preventDefault()
    synth.noteOn(midi)
    const k = keys.value.find(k => k.midi === midi)
    if (k) k.active = true
  }
}

function onKeyUp(e) {
  const keyMap = {
    'a': 48, 'w': 49, 's': 50, 'e': 51, 'd': 52,
    'f': 53, 't': 54, 'g': 55, 'y': 56, 'h': 57, 'u': 58, 'j': 59,
    'k': 60, 'o': 61, 'l': 62, 'p': 63, ';': 64,
  }
  const midi = keyMap[e.key.toLowerCase()]
  if (midi !== undefined) {
    synth.noteOff(midi)
    const k = keys.value.find(k => k.midi === midi)
    if (k) k.active = false
  }
}

onMounted(() => {
  synth.init()
  renderSpectrum()
  // Initial wave previews
  requestAnimationFrame(() => {
    drawWaveShape(synth.osc1.type, osc1WaveRef.value)
    drawWaveShape(synth.osc2.type, osc2WaveRef.value)
  })
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)
})

onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId)
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('keyup', onKeyUp)
  synth.dispose()
})
</script>

<style scoped>
.synth-container {
  display: flex; flex-direction: column; gap: 12px;
  user-select: none; -webkit-user-select: none;
}

/* Preset Bar */
.preset-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.section-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px; color: var(--text-tertiary); }

/* Oscillator Panels */
.osc-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
  overflow: hidden;
}
.osc-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-secondary);
  background: var(--bg-tertiary);
}
.osc-body {
  display: flex; gap: 12px; padding: 10px 12px;
}
.osc-controls { flex: 1; min-width: 0; }
.wave-preview-wrap {
  width: 90px; height: 70px; flex-shrink: 0;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-secondary);
  overflow: hidden; position: relative;
  background: #FFFFFF;
}
.wave-preview-wrap canvas { position: absolute; inset: 0; width: 100%; height: 100%; }

/* Grid helpers */
.grid { display: grid; }
.grid-cols-1 { grid-template-columns: 1fr; }
.gap-3 { gap: 12px; }
@media (min-width: 768px) {
  .md\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 1024px) {
  .lg\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .lg\:col-span-2 { grid-column: span 2; }
}

/* Standard Panel */
.synth-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 10px 12px;
  box-shadow: var(--shadow-xs);
}
.panel-title {
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 1.5px; margin-bottom: 8px;
}

/* Parameters */
.param-row {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 5px;
}
.param-label {
  font-size: 10px; color: var(--text-secondary);
  min-width: 42px; flex-shrink: 0;
}
.param-val {
  font-size: 10px; color: var(--text-primary);
  min-width: 36px; text-align: right; font-family: var(--font-mono);
}
.toggle-row {
  display: flex; align-items: center; gap: 4px;
  font-size: 10px; color: var(--text-secondary); cursor: pointer;
}

/* Controls */
.synth-select {
  flex: 1;
  padding: 2px 4px;
  font-size: 10px; font-family: inherit;
  background: var(--input-bg);
  color: var(--input-text);
  border: 1px solid var(--input-border);
  border-radius: 4px;
  cursor: pointer; outline: none;
}
.synth-select:focus { border-color: var(--input-border-focus); box-shadow: 0 0 0 3px var(--accent-copper-light); }

.s-slider {
  flex: 1; height: 3px; min-width: 0;
  -webkit-appearance: none; appearance: none;
  background: var(--slider-track);
  border-radius: 9999px; outline: none;
  cursor: pointer;
}
.s-slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 10px; height: 10px;
  border-radius: 50%; background: var(--slider-thumb);
  cursor: pointer;
}
.s-slider::-moz-range-thumb {
  width: 10px; height: 10px;
  border-radius: 50%; background: var(--slider-thumb);
  cursor: pointer; border: none;
}

.s-btn {
  padding: 3px 10px; font-size: 10px; font-family: inherit;
  border-radius: 4px; border: 1px solid var(--border-primary);
  background: transparent; color: var(--btn-secondary-text);
  cursor: pointer; transition: all 0.15s;
}
.s-btn:hover { color: var(--text-primary); border-color: var(--border-primary); background: var(--btn-secondary-hover-bg); }
.s-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.s-btn-sm { padding: 3px 8px; font-size: 10px; }

/* ADSR viz */
.adsr-viz { height: 28px; margin-top: 4px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden; }

/* Spectrum */
.spec-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg); padding: 8px;
  box-shadow: var(--shadow-xs);
}
.spec-canvas-wrap { height: 120px; position: relative; }
.spec-canvas-wrap canvas { position: absolute; inset: 0; width: 100%; height: 100%; }

/* Keyboard */
.keyboard {
  display: flex; position: relative;
  height: 130px; border-radius: 8px;
  overflow: hidden;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
}
.key { cursor: pointer; transition: background 0.1s; }
.key.white {
  flex: 1; height: 100%;
  background: var(--key-white-bg);
  border-right: 1px solid var(--key-white-border);
  display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: 6px;
  font-size: 9px; color: var(--key-white-text);
}
.key.white.active { background: var(--key-white-active-bg); color: var(--key-white-active-text); }
.key.black {
  position: absolute; top: 0;
  height: 65%;
  background: var(--key-black-bg);
  border-radius: 0 0 4px 4px;
  border: 1px solid var(--key-white-border);
  border-top: none;
}
.key.black.active { background: var(--key-black-active-bg); }

@media (max-width: 640px) {
  .osc-body { flex-direction: column; }
  .wave-preview-wrap { width: 100%; height: 50px; }
  .keyboard { height: 100px; }
}
</style>
