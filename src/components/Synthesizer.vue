<template>
  <div class="synth-root">

    <!-- ════════════════════════════════════════════
         TOP BAR — Brand | Tabs | Preset Browser
         ════════════════════════════════════════════ -->
    <header class="synth-header">
      <div class="brand"><span class="brand-icon">◈</span> SERUM 2</div>
      <nav class="header-tabs">
        <button v-for="t in headerTabs" :key="t.id"
          class="ht-btn" :class="{ active: activeTab === t.id }"
          @click="activeTab = t.id">
          <span class="ht-led" :class="{ on: activeTab === t.id }"></span>
          {{ t.label }}
        </button>
      </nav>
      <div class="header-preset">
        <button class="hp-btn" @click="prevPreset">◂</button>
        <select class="hp-select" :value="synth.currentPreset.value" @change="synth.loadPreset($event.target.value)">
          <option v-for="p in synth.presets.value" :key="p.name" :value="p.name">{{ p.name }}</option>
        </select>
        <button class="hp-btn" @click="nextPreset">▸</button>
        <button class="hp-btn hp-save" @click="saveCurrent">💾</button>
      </div>
    </header>

    <!-- ════════════════════════════════════════════
         GENERATOR GRID — OSC A · OSC B · OSC C · NOISE · FILTER
         ════════════════════════════════════════════ -->
    <section class="gen-grid">

      <!-- ─── OSC A ─── -->
      <div class="gen-card">
        <div class="gen-card-header">
          <span class="gen-led" :class="{ on: synth.osc1.active }"></span>
          <span class="gen-title">OSC A</span>
          <label class="gen-toggle"><input type="checkbox" :checked="synth.osc1.active" @change="synth.osc1.active = $event.target.checked"> ON</label>
        </div>
        <div class="gen-viz-wrap"><canvas ref="osc1WaveRef"></canvas></div>
        <div class="gen-knob-grid gkg-6">
          <knob-comp label="WT POS"   :val="synth.osc1.wtPos"  :min="0" :max="1" :step="0.01" @input="synth.osc1.wtPos = $event" />
          <knob-comp label="UNISON"   :val="synth.osc1.unison"  :min="1" :max="8"  @input="synth.osc1.unison = Math.round($event)" />
          <knob-comp label="DETUNE"   :val="synth.osc1.detune"  :min="-50" :max="50"  @input="synth.osc1.detune = $event" />
          <knob-comp label="BLEND"    :val="synth.osc1.blend"   :min="0" :max="1" :step="0.01" @input="synth.osc1.blend = $event" />
          <knob-comp label="PAN"      :val="synth.osc1.pan"     :min="-1" :max="1" :step="0.01" @input="synth.osc1.pan = $event" />
          <knob-comp label="LEVEL"    :val="synth.osc1.gain"    :min="0" :max="1" :step="0.01" @input="synth.osc1.gain = $event" />
        </div>
        <div class="gen-wave-select">
          <button v-for="w in waves" :key="w" class="ws-btn" :class="{ active: synth.osc1.type === w }" @click="synth.osc1.type = w">{{ w[0].toUpperCase() }}</button>
        </div>
        <!-- Warp slider -->
        <div class="gen-warp">
          <span class="warp-label">WARP</span>
          <input type="range" class="warp-slider" min="0" max="1" step="0.01" :value="synth.osc1.warp" @input="synth.osc1.warp = +$event.target.value" />
          <span class="warp-val">{{ (synth.osc1.warp * 100).toFixed(0) }}%</span>
        </div>
      </div>

      <!-- ─── OSC B ─── -->
      <div class="gen-card">
        <div class="gen-card-header">
          <span class="gen-led" :class="{ on: synth.osc2.active }"></span>
          <span class="gen-title">OSC B</span>
          <label class="gen-toggle"><input type="checkbox" :checked="synth.osc2.active" @change="synth.osc2.active = $event.target.checked"> ON</label>
        </div>
        <div class="gen-viz-wrap"><canvas ref="osc2WaveRef"></canvas></div>
        <div class="gen-knob-grid gkg-6">
          <knob-comp label="WT POS"   :val="synth.osc2.wtPos"  :min="0" :max="1" :step="0.01" @input="synth.osc2.wtPos = $event" />
          <knob-comp label="UNISON"   :val="synth.osc2.unison"  :min="1" :max="8"  @input="synth.osc2.unison = Math.round($event)" />
          <knob-comp label="DETUNE"   :val="synth.osc2.detune"  :min="-50" :max="50"  @input="synth.osc2.detune = $event" />
          <knob-comp label="BLEND"    :val="synth.osc2.blend"   :min="0" :max="1" :step="0.01" @input="synth.osc2.blend = $event" />
          <knob-comp label="PAN"      :val="synth.osc2.pan"     :min="-1" :max="1" :step="0.01" @input="synth.osc2.pan = $event" />
          <knob-comp label="LEVEL"    :val="synth.osc2.gain"    :min="0" :max="1" :step="0.01" @input="synth.osc2.gain = $event" />
        </div>
        <div class="gen-wave-select">
          <button v-for="w in waves" :key="w" class="ws-btn" :class="{ active: synth.osc2.type === w }" @click="synth.osc2.type = w">{{ w[0].toUpperCase() }}</button>
        </div>
        <div class="gen-warp">
          <span class="warp-label">WARP</span>
          <input type="range" class="warp-slider" min="0" max="1" step="0.01" :value="synth.osc2.warp" @input="synth.osc2.warp = +$event.target.value" />
          <span class="warp-val">{{ (synth.osc2.warp * 100).toFixed(0) }}%</span>
        </div>
      </div>

      <!-- ─── NOISE ─── -->
      <div class="gen-card">
        <div class="gen-card-header">
          <span class="gen-led" :class="{ on: noiseEnabled }"></span>
          <span class="gen-title">NOISE</span>
          <label class="gen-toggle"><input type="checkbox" v-model="noiseEnabled"> ON</label>
        </div>
        <div class="gen-viz-wrap"><canvas ref="noiseVizRef"></canvas></div>
        <div class="gen-knob-grid gkg-4">
          <knob-comp label="COLOR"  :val="noiseColor" :min="0" :max="1" :step="0.01" @input="noiseColor = $event" />
          <knob-comp label="LEVEL"  :val="synth.noiseLevel.value" :min="0" :max="1" :step="0.01" @input="synth.noiseLevel.value = $event" />
          <knob-comp label="PAN"    :val="noisePan"   :min="-1" :max="1" :step="0.01" @input="noisePan = $event" />
        </div>
        <div class="gen-wave-select">
          <span class="granular-badge">NOISE</span>
        </div>
      </div>

      <!-- ─── FILTER 1 & 2 ─── -->
      <div class="gen-card filter-dual">
        <div class="gen-card-header">
          <span class="gen-led on"></span>
          <span class="gen-title">FILTER</span>
        </div>
        <div class="filter-dual-body">
          <!-- Filter 1 -->
          <div class="filter-col">
            <div class="filter-mini-header">F1</div>
            <div class="filter-viz-sm"><canvas ref="filter1CurveRef"></canvas></div>
            <div class="gen-knob-grid gkg-2">
              <knob-comp label="CUTOFF" :val="synth.filterCfg.cutoff / 20000" :min="0" :max="1" :step="0.01" @input="synth.filterCfg.cutoff = $event * 20000; synth.updateFilter()" />
              <knob-comp label="RES"    :val="synth.filterCfg.resonance / 20" :min="0" :max="1" :step="0.01" @input="synth.filterCfg.resonance = $event * 20; synth.updateFilter()" />
            </div>
            <div class="gen-wave-select">
              <button v-for="t in filterTypes" :key="t" class="ws-btn ws-sm" :class="{ active: synth.filterCfg.type === t }" @click="synth.filterCfg.type = t; synth.updateFilter()">{{ t[0].toUpperCase() }}</button>
            </div>
          </div>
          <!-- Filter 2 -->
          <div class="filter-divider"></div>
          <div class="filter-col">
            <div class="filter-mini-header">F2</div>
            <div class="filter-viz-sm"><canvas ref="filter2CurveRef"></canvas></div>
            <div class="gen-knob-grid gkg-2">
              <knob-comp label="CUTOFF" :val="synth.filter2Cfg.cutoff / 20000" :min="0" :max="1" :step="0.01" @input="synth.filter2Cfg.cutoff = $event * 20000; synth.updateFilter2()" />
              <knob-comp label="RES"    :val="synth.filter2Cfg.resonance / 20" :min="0" :max="1" :step="0.01" @input="synth.filter2Cfg.resonance = $event * 20; synth.updateFilter2()" />
            </div>
            <div class="gen-wave-select">
              <button v-for="t in filterTypes" :key="t" class="ws-btn ws-sm" :class="{ active: synth.filter2Cfg.type === t }" @click="synth.filter2Cfg.type = t; synth.updateFilter2()">{{ t[0].toUpperCase() }}</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════
         BOTTOM MODULATION — Macros | Env/LFO | Path Grid | Voicing
         ════════════════════════════════════════════ -->
    <section class="bottom-mod-grid">

      <!-- ─── MACROS (左侧) ─── -->
      <div class="mod-panel macros-panel">
        <div class="mod-panel-header"><span class="mod-led"></span>MACROS</div>
        <div class="macro-grid-2x4">
          <knob-comp v-for="i in 8" :key="i" :label="'M' + i" :val="macroVals[i-1]" :min="0" :max="1" :step="0.01" @input="macroVals[i-1] = $event" />
        </div>
      </div>

      <!-- ─── ENV / LFO Editor (中部偏左) ─── -->
      <div class="mod-panel env-panel">
        <div class="mod-panel-header">
          <span class="mod-led"></span>
          <div class="env-lfo-tabs">
            <button v-for="tab in envLfoTabs" :key="tab" class="et-btn" :class="{ active: activeEnvLfoTab === tab }" @click="activeEnvLfoTab = tab">{{ tab }}</button>
          </div>
        </div>
        <div class="env-canvas-wrap">
          <canvas ref="envCanvasRef" @mousedown="onEnvMouseDown" @mousemove="onEnvMouseMove" @mouseup="onEnvMouseUp" @mouseleave="onEnvMouseUp"></canvas>
          <div class="env-overlay">
            <div class="env-mark" style="left:5%;top:60%;">ATK</div>
            <div class="env-mark" style="left:25%;top:10%;">DEC</div>
            <div class="env-mark" style="left:55%;top:42%;">SUS</div>
            <div class="env-mark" style="left:85%;top:10%;">REL</div>
          </div>
        </div>
        <div class="env-sliders">
          <div class="env-slide"><label>A</label><input type="range" class="s-slider" min="0.001" max="2" step="0.001" :value="synth.adsr.attack" @input="synth.adsr.attack = +$event.target.value"><span class="sv">{{ synth.adsr.attack.toFixed(2) }}s</span></div>
          <div class="env-slide"><label>D</label><input type="range" class="s-slider" min="0.001" max="2" step="0.001" :value="synth.adsr.decay" @input="synth.adsr.decay = +$event.target.value"><span class="sv">{{ synth.adsr.decay.toFixed(2) }}s</span></div>
          <div class="env-slide"><label>S</label><input type="range" class="s-slider" min="0" max="1" step="0.01" :value="synth.adsr.sustain" @input="synth.adsr.sustain = +$event.target.value"><span class="sv">{{ (synth.adsr.sustain * 100).toFixed(0) }}%</span></div>
          <div class="env-slide"><label>R</label><input type="range" class="s-slider" min="0.001" max="3" step="0.001" :value="synth.adsr.release" @input="synth.adsr.release = +$event.target.value"><span class="sv">{{ synth.adsr.release.toFixed(2) }}s</span></div>
        </div>
      </div>

      <!-- ─── PATH / Custom LFO Grid (中部偏右) ─── -->
      <div class="mod-panel path-panel">
        <div class="mod-panel-header"><span class="mod-led"></span>PATH</div>
        <div class="path-canvas-wrap">
          <canvas ref="pathCanvasRef" @mousedown="onPathMouseDown" @mousemove="onPathMouseMove" @mouseup="onPathMouseUp" @mouseleave="onPathMouseUp"></canvas>
        </div>
        <div class="path-controls">
          <knob-comp label="RATE"  :val="pathRate"  :min="0" :max="20" @input="pathRate = $event" />
          <knob-comp label="SMOOTH" :val="pathSmooth" :min="0" :max="1" :step="0.01" @input="pathSmooth = $event" />
          <knob-comp label="QUANT" :val="pathQuant" :min="0" :max="12" @input="pathQuant = $event" />
        </div>
      </div>

      <!-- ─── VOICING (右侧) ─── -->
      <div class="mod-panel voicing-panel">
        <div class="mod-panel-header"><span class="mod-led"></span>VOICING</div>
        <div class="voicing-body">
          <div class="voicing-row">
            <knob-comp label="VOICES" :val="synth.voiceLimit.value" :min="1" :max="16" @input="synth.voiceLimit.value = Math.round($event)" />
            <knob-comp label="UNISON" :val="synth.voiceUnison.value" :min="1" :max="8" @input="synth.voiceUnison.value = Math.round($event)" />
          </div>
          <div class="voicing-row">
            <knob-comp label="SPREAD" :val="synth.voiceSpread.value" :min="0" :max="100" @input="synth.voiceSpread.value = $event" />
          </div>
          <div class="voicing-mode">
            <button v-for="m in voiceModes" :key="m" class="ws-btn ws-sm" :class="{ active: synth.voiceMode.value === m }" @click="synth.voiceMode.value = m">{{ m }}</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════
         FOOTER — Spectrum · Arp/Global · Keyboard · Wheels
         ════════════════════════════════════════════ -->
    <section class="synth-footer">

      <!-- Spectrum -->
      <div class="ft-spectrum">
        <div class="ft-label">SPECTRUM</div>
        <canvas ref="specCanvasRef"></canvas>
      </div>

      <!-- Arp / Global -->
      <div class="ft-arp">
        <div class="ft-label">ARP</div>

        <!-- Mode buttons -->
        <div class="arp-mode-row">
          <button v-for="m in arpModes" :key="m.id" class="ws-btn ws-sm" :class="{ active: synth.arpMode.value === m.id }" @click="synth.arpMode.value = m.id">{{ m.label }}</button>
        </div>

        <!-- Rate + Gate + Swing + Octave -->
        <div class="arp-param-row">
          <div class="arp-param"><label>RATE</label><input type="range" class="arp-rate-slider" min="0.1" max="4" step="0.1" v-model="synth.arpRate.value" /><span class="arp-rate-val">{{ synth.arpRate.value.toFixed(1) }}x</span></div>
          <div class="arp-param"><label>GATE</label><input type="range" class="arp-rate-slider" min="0.05" max="1" step="0.01" :value="synth.arpGate.value" @input="synth.arpGate.value = +$event.target.value" /><span class="arp-rate-val">{{ (synth.arpGate.value * 100).toFixed(0) }}%</span></div>
          <div class="arp-param"><label>SWG</label><input type="range" class="arp-rate-slider" min="0" max="1" step="0.01" :value="synth.arpSwing.value" @input="synth.arpSwing.value = +$event.target.value" /><span class="arp-rate-val">{{ (synth.arpSwing.value * 100).toFixed(0) }}%</span></div>
          <div class="arp-param"><label>OCT</label><input type="range" class="arp-rate-slider" min="1" max="4" step="1" :value="synth.arpOctaveRange.value" @input="synth.arpOctaveRange.value = Math.round(+$event.target.value)" /><span class="arp-rate-val">{{ synth.arpOctaveRange.value }}</span></div>
        </div>

        <!-- 8-Step Sequencer -->
        <div class="arp-step-grid">
          <div v-for="(step, i) in synth.arpSteps" :key="i" class="arp-step-cell" :class="{ inactive: !step.active }" @click="step.active = !step.active">
            <div class="arp-step-bar-wrap">
              <div class="arp-step-bar" :style="{ height: (step.velocity * 100) + '%' }"></div>
            </div>
            <div class="arp-step-num">{{ i + 1 }}</div>
          </div>
        </div>

        <!-- Velocity step edit hint -->
        <div class="arp-vel-hint">点击步进切换开/关</div>

        <!-- GLOBAL controls inline -->
        <div class="arp-global-row">
          <knob-comp label="VOL" :val="synth.masterVol.value" :min="0" :max="1" :step="0.01" @input="synth.masterVol.value = $event" />
          <knob-comp label="TUNE" :val="globalTune" :min="-12" :max="12" @input="globalTune = $event" />
          <knob-comp label="P.B." :val="synth.pitchBendRange.value" :min="1" :max="12" @input="synth.pitchBendRange.value = Math.round($event)" />
        </div>
      </div>

      <!-- Wheels -->
      <div class="ft-wheels">
        <div class="wheel-wrap"><div class="wheel-label">PITCH</div><input type="range" class="wheel-slider" orient="vertical" min="-1" max="1" step="0.01" v-model="pitchWheel" /><div class="wheel-track"></div></div>
        <div class="wheel-wrap"><div class="wheel-label">MOD</div><input type="range" class="wheel-slider" orient="vertical" min="0" max="1" step="0.01" v-model="modWheel" /><div class="wheel-track"></div></div>
      </div>

      <!-- Keyboard -->
      <div class="ft-kbd" @mousedown="onMouseDown" @mouseup="onMouseUp" @mouseleave="onMouseUp" @touchstart.prevent="onTouchStart" @touchend="onTouchEnd">
        <div class="kbd-transpose">
          <span class="kbd-info">OCT {{ currentOctave }}</span>
          <span class="kbd-info">VEL {{ currentVelocity }}</span>
          <span class="kbd-div">|</span>
          <button class="kbd-oct-btn" @click="currentOctave = Math.max(1, currentOctave - 1)">Z▼</button>
          <button class="kbd-oct-btn" @click="currentOctave = Math.min(6, currentOctave + 1)">X▲</button>
          <span class="kbd-div">|</span>
          <select class="arp-select" v-model="scaleType">
            <option value="CHROMATIC">CHROM</option>
            <option value="MAJOR">MAJ</option>
            <option value="MINOR">MIN</option>
            <option value="PENT">PENT</option>
          </select>
        </div>
        <div class="kbd-keys">
          <div v-for="key in keys" :key="key.midi"
            class="key"
            :class="{ white: !key.isBlack, black: key.isBlack, active: key.active }"
            :style="key.isBlack ? blackKeyStyle(key) : whiteKeyStyle(key)"
            :data-midi="key.midi"
          ><span v-if="key.qwertyLabel" class="key-label">{{ key.qwertyLabel }}</span></div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, reactive } from 'vue'
import { useSynth, midiToName } from '../composables/useSynth.js'

const synth = useSynth()

// ── Local state ──
const activeTab = ref('OSC')
const headerTabs = [
  { id: 'OSC', label: 'OSC' },
  { id: 'MIX', label: 'MIX' },
  { id: 'FX', label: 'FX' },
  { id: 'MATRIX', label: 'MATRIX' },
  { id: 'GLOBAL', label: 'GLOBAL' },
]
const activeEnvLfoTab = ref('ENV 1')
const envLfoTabs = ['ENV 1', 'ENV 2', 'ENV 3', 'ENV 4', 'LFO 1', 'LFO 2', 'LFO 3', 'LFO 4', 'LFO 5', 'LFO 6', 'LFO 7', 'LFO 8']
const waves = ['sine', 'square', 'triangle', 'sawtooth']
const filterTypes = ['lowpass', 'highpass', 'bandpass', 'notch']
const lfoWaves = ['sine', 'square', 'triangle', 'sawtooth']
const lfoTargets = ['pitch', 'cutoff', 'volume']
const macroVals = reactive(Array(8).fill(0))
const pitchWheel = ref(0)
const modWheel = ref(0)
watch(pitchWheel, v => synth.applyPitchBend(v))
watch(modWheel, v => synth.applyModWheel(v))

// ── Noise ──
const noiseEnabled = ref(true)
const noiseColor = ref(0.5)
const noisePan = ref(0)

// ── Path / Custom LFO ──
const pathRate = ref(4)
const pathSmooth = ref(0.5)
const pathQuant = ref(0)

// ── Voicing ──
const voiceModes = ['POLY', 'MONO', 'LEGATO']

// ── Arp / Global ──
const globalTune = ref(0)
const scaleType = ref('CHROMATIC')
const arpModes = [
  { id: 'OFF', label: 'OFF' },
  { id: 'UP', label: 'UP' },
  { id: 'DOWN', label: 'DN' },
  { id: 'UP/DN', label: 'U/D' },
  { id: 'CONVERGE', label: 'CON' },
  { id: 'DIVERGE', label: 'DIV' },
  { id: 'AS PLAYED', label: 'PLY' },
  { id: 'RAND', label: 'RND' },
]

// ── Watch octave change to rebuild key range ──
// (moved next to currentOctave declaration below)

// ── Warp ── (no local state needed, uses synth.osc1.warp / synth.osc2.warp)

// ── Refs ──
const osc1WaveRef = ref(null)
const osc2WaveRef = ref(null)
const noiseVizRef = ref(null)
const filter1CurveRef = ref(null)
const filter2CurveRef = ref(null)
const envCanvasRef = ref(null)
const pathCanvasRef = ref(null)
const specCanvasRef = ref(null)

let animId = null

// ── Knob Component ──
const KnobComp = {
  props: ['label', 'val', 'min', 'max', 'step'],
  emits: ['input'],
  template: `
    <div class="knob-wrap" @mousedown.prevent="startDrag">
      <svg class="knob-svg" viewBox="0 0 36 36" width="36" height="36">
        <circle cx="18" cy="18" r="14" fill="#1A2026" stroke="#2A3240" stroke-width="1.5"/>
        <path :d="arcPath" fill="none" stroke="#29B6F6" stroke-width="2" stroke-linecap="round"/>
        <line x1="18" y1="18" :x2="18 + Math.sin(angle)*10" :y2="18 - Math.cos(angle)*10" stroke="#29B6F6" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="18" cy="18" r="2.5" fill="#1A2026" stroke="#29B6F6" stroke-width="1"/>
      </svg>
      <span class="knob-label">{{ label }}</span>
      <span class="knob-val">{{ displayVal }}</span>
    </div>`,
  computed: {
    pct() { return (this.val - this.min) / (this.max - this.min) },
    angle() { return -0.75 * Math.PI + this.pct * 1.5 * Math.PI },
    arcPath() {
      const startA = -0.75 * Math.PI
      const endA = this.angle
      const r = 12
      const cx = 18, cy = 18
      const x1 = cx + Math.sin(startA) * r
      const y1 = cy - Math.cos(startA) * r
      const x2 = cx + Math.sin(endA) * r
      const y2 = cy - Math.cos(endA) * r
      const large = endA - startA > Math.PI ? 1 : 0
      return `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2}`
    },
    displayVal() {
      if (this.step && this.step < 0.01) return (this.val).toFixed(2)
      if (this.max <= 1) return (this.val * 100).toFixed(0)
      return this.val.toFixed(0)
    }
  },
  methods: {
    startDrag(e) {
      const rect = e.target.closest('.knob-wrap').getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const onMove = (ev) => {
        const dy = centerY - ev.clientY
        const dx = ev.clientX - centerX
        const angle = Math.atan2(dx, dy)
        const pct = Math.max(0, Math.min(1, (angle + Math.PI * 0.75) / (Math.PI * 1.5)))
        const val = this.min + pct * (this.max - this.min)
        const stepped = this.step ? Math.round(val / this.step) * this.step : val
        this.$emit('input', Math.max(this.min, Math.min(this.max, stepped)))
      }
      const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    }
  }
}

// ── Keyboard ──
// Ableton Live-style QWERTY keyboard mapping constants
const KEY_RELATIVE_MAP = {
  'a': 0,   'w': 1,   's': 2,   'e': 3,   'd': 4,
  'f': 5,   't': 6,   'g': 7,   'y': 8,   'h': 9,
  'u': 10,  'j': 11,  'k': 12,  'l': 14,
}
const KEY_LABELS = {
  0: 'A', 1: 'W', 2: 'S', 3: 'E', 4: 'D',
  5: 'F', 6: 'T', 7: 'G', 8: 'Y', 9: 'H',
  10: 'U', 11: 'J', 12: 'K', 14: 'L',
}
const currentOctave = ref(3)
const currentVelocity = ref(100)
// Watch octave change to rebuild key range
watch(currentOctave, () => { keys.value = keyRange.value })
function qwertyToMidi(key) {
  const rel = KEY_RELATIVE_MAP[key]
  if (rel === undefined) return -1
  return 48 + rel + (currentOctave.value - 3) * 12
}

const keyRange = computed(() => {
  const k = []
  let wIdx = 0
  const baseMidi = 48 + (currentOctave.value - 3) * 12
  for (let m = baseMidi; m <= baseMidi + 24; m++) {
    const isBlack = synth.isBlackKey(m)
    const rel = m - 48 - (currentOctave.value - 3) * 12
    if (!isBlack) { k.push({ midi: m, name: midiToName(m), isBlack: false, wIdx, active: false, qwertyLabel: KEY_LABELS[rel] || '' }); wIdx++ }
    else { k.push({ midi: m, name: midiToName(m), isBlack: true, wIdx: wIdx - 0.3, active: false, qwertyLabel: KEY_LABELS[rel] || '' }) }
  }
  return k
})
const keys = ref(keyRange.value)
function whiteKeyStyle() { return {} }
function blackKeyStyle(key) { return { left: `calc(${(key.wIdx + 1) * 100 / 15}% - 10px)`, width: '20px', zIndex: 10 } }
function getMidi(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY)
  if (!el) return -1
  const m = parseInt(el.dataset.midi)
  return isNaN(m) ? -1 : m
}
function onMouseDown(e) {
  const midi = getMidi(e)
  if (midi >= 0) { synth.noteOn(midi); const k = keys.value.find(k => k.midi === midi); if (k) k.active = true }
}
function onMouseUp() {
  keys.value.forEach(k => { if (k.active) { synth.noteOff(k.midi); k.active = false } })
}
let touchNotes = {}
function onTouchStart(e) {
  for (const t of e.changedTouches) {
    const el = document.elementFromPoint(t.clientX, t.clientY)
    if (!el) continue
    const midi = parseInt(el.dataset.midi)
    if (!isNaN(midi) && midi >= 0) { synth.noteOn(midi); touchNotes[t.identifier] = midi; const k = keys.value.find(k => k.midi === midi); if (k) k.active = true }
  }
}
function onTouchEnd(e) {
  for (const t of e.changedTouches) {
    const midi = touchNotes[t.identifier]
    if (midi !== undefined) { synth.noteOff(midi); const k = keys.value.find(k => k.midi === midi); if (k) k.active = false; delete touchNotes[t.identifier] }
  }
}

// ── Presets ──
function prevPreset() {
  const p = synth.presets.value; const i = p.findIndex(pr => pr.name === synth.currentPreset.value)
  if (i > 0) synth.loadPreset(p[i - 1].name)
}
function nextPreset() {
  const p = synth.presets.value; const i = p.findIndex(pr => pr.name === synth.currentPreset.value)
  if (i < p.length - 1) synth.loadPreset(p[i + 1].name)
}
function saveCurrent() {
  const name = prompt('Preset name:', synth.currentPreset.value)
  if (name) synth.savePreset(name)
}

// ── Wave preview ──
function drawWaveShape(type, canvas) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth, H = canvas.clientHeight
  if (!W || !H) return
  canvas.width = W * dpr; canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * W / 4, 0); ctx.lineTo(i * W / 4, H); ctx.stroke() }
  for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(0, i * H / 4); ctx.lineTo(W, i * H / 4); ctx.stroke() }
  const cy = H / 2, amp = H * 0.35, periods = 2, steps = 200
  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * W, phase = (i / steps) * periods * Math.PI * 2
    let y = cy
    if (type === 'sine') y = cy - Math.sin(phase) * amp
    else if (type === 'square') y = Math.floor(i / (steps / (periods * 2))) % 2 === 0 ? cy - amp : cy + amp
    else if (type === 'triangle') { const p = ((i / steps) * periods) % 1; y = cy + (p < 0.5 ? (p * 4 - 1) : (3 - p * 4)) * amp }
    else if (type === 'sawtooth') { const p = ((i / steps) * periods) % 1; y = cy + (p * 2 - 1) * amp }
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.strokeStyle = '#66BB6A'; ctx.lineWidth = 1.5; ctx.shadowColor = 'rgba(102,187,106,0.3)'; ctx.shadowBlur = 4; ctx.stroke(); ctx.shadowBlur = 0
}

watch(() => synth.osc1.type, () => drawWaveShape(synth.osc1.type, osc1WaveRef.value))
watch(() => synth.osc2.type, () => drawWaveShape(synth.osc2.type, osc2WaveRef.value))

// ── Noise canvas ──
function drawNoiseViz() {
  const canvas = noiseVizRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth, H = canvas.clientHeight
  if (!W || !H) return
  canvas.width = W * dpr; canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0E1215'; ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(102,187,106,0.5)'; ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = 0; i <= 120; i++) {
    const x = (i / 120) * W
    const r = Math.random() * 2 - 1
    const y = H / 2 + r * H * 0.35
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()
}

// ── Filter curves ──
function drawFilterCurve(canvas, cutoff, resonance, type) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth, H = canvas.clientHeight
  if (!W || !H) return
  canvas.width = W * dpr; canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  const c = cutoff / 20000
  const r = resonance / 20
  const isLow = type === 'lowpass' || type === 'bandpass'
  const isHigh = type === 'highpass'
  const isNotch = type === 'notch'
  ctx.beginPath()
  for (let i = 0; i <= 100; i++) {
    const p = i / 100, x = i / 100 * W
    let gain = 0
    if (isLow) { gain = p < c ? 0 : -12 * (p - c) / (1 - c + 0.01) }
    else if (isHigh) { gain = p > c ? 0 : -12 * (c - p) / (c + 0.01) }
    else if (isNotch) { gain = -Math.abs(p - c) * 12 }
    else { gain = -(p - c) * 6 }
    gain += r * 3 * (1 - Math.abs(p - c) * 2)
    const y = H / 2 - gain * H / 24
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.fillStyle = 'rgba(41,182,246,0.15)'; ctx.lineTo(W, H); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = '#29B6F6'; ctx.lineWidth = 1.5; ctx.stroke()
}

// ── Envelope canvas ──
let envDragging = null
function drawEnv() {
  const canvas = envCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth, H = canvas.clientHeight
  if (!W || !H) return
  canvas.width = W * dpr; canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  for (let i = 0; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(i * W / 10, 0); ctx.lineTo(i * W / 10, H); ctx.stroke() }
  for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(0, i * H / 4); ctx.lineTo(W, i * H / 4); ctx.stroke() }
  // Curve points
  const a = synth.adsr.attack, d = synth.adsr.decay, s = synth.adsr.sustain, r = synth.adsr.release
  const total = a + d + r + 0.5
  const pA = { x: 0, y: H }
  const pB = { x: (a / total) * W * 0.3, y: 0 }
  const pC = { x: ((a + d) / total) * W * 0.5, y: H * (1 - s) }
  const pD = { x: ((a + d + 0.3) / total) * W * 0.6, y: H * (1 - s) }
  const pE = { x: W, y: H }
  // Bezier curve
  ctx.beginPath(); ctx.moveTo(pA.x, pA.y)
  const steps = 100
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    let x, y
    if (t < 0.3) {
      const tt = t / 0.3; x = pA.x + (pB.x - pA.x) * tt; y = pA.y + (pB.y - pA.y) * tt * tt
    } else if (t < 0.55) {
      const tt = (t - 0.3) / 0.25; x = pB.x + (pC.x - pB.x) * tt; y = pB.y + (pC.y - pB.y) * Math.sin(tt * Math.PI / 2)
    } else if (t < 0.7) {
      x = pC.x + (pD.x - pC.x) * (t - 0.55) / 0.15; y = pC.y
    } else {
      const tt = (t - 0.7) / 0.3; x = pD.x + (pE.x - pD.x) * tt; y = pD.y + (pE.y - pD.y) * tt * tt
    }
    ctx.lineTo(x, y)
  }
  ctx.strokeStyle = '#29B6F6'; ctx.lineWidth = 1.5; ctx.shadowColor = 'rgba(41,182,246,0.4)'; ctx.shadowBlur = 6; ctx.stroke(); ctx.shadowBlur = 0
  // Anchor points
  ;[pA, pB, pC, pD, pE].forEach((p, i) => {
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
    ctx.fillStyle = i === 0 || i === 4 ? '#29B6F6' : '#66BB6A'; ctx.fill()
    ctx.strokeStyle = '#1A2026'; ctx.lineWidth = 1; ctx.stroke()
  })
}
function onEnvMouseDown(e) {
  const rect = envCanvasRef.value.getBoundingClientRect()
  const mx = e.clientX - rect.left, my = e.clientY - rect.top
  envDragging = 'attack'
}
function onEnvMouseMove(e) {
  if (!envDragging) return
  const rect = envCanvasRef.value.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const W = rect.width
  if (envDragging === 'attack') synth.adsr.attack = Math.max(0.001, (mx / W) * 2)
  envDragging = null
}
function onEnvMouseUp() { envDragging = null }

// ── Path / Custom LFO ──
let pathPoints = [0.2, 0.5, 0.8, 0.4, 0.7, 0.3, 0.6, 0.5]
let pathDragging = false
function drawPathGrid() {
  const canvas = pathCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth, H = canvas.clientHeight
  if (!W || !H) return
  canvas.width = W * dpr; canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0E1215'; ctx.fillRect(0, 0, W, H)
  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  for (let i = 0; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(i * W / 8, 0); ctx.lineTo(i * W / 8, H); ctx.stroke() }
  for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(0, i * H / 4); ctx.lineTo(W, i * H / 4); ctx.stroke() }
  // Path curve
  const n = pathPoints.length
  ctx.beginPath()
  for (let i = 0; i <= 100; i++) {
    const t = (i / 100) * (n - 1)
    const idx = Math.floor(t)
    const frac = t - idx
    const p0 = pathPoints[Math.max(0, idx - 1)]
    const p1 = pathPoints[idx]
    const p2 = pathPoints[Math.min(n - 1, idx + 1)]
    const p3 = pathPoints[Math.min(n - 1, idx + 2)]
    // Catmull-Rom interpolation
    const t2 = frac * frac, t3 = t2 * frac
    const v = 0.5 * ((2 * p1) + (-p0 + p2) * frac + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
    const x = (i / 100) * W
    const y = H - Math.max(0, Math.min(1, v)) * H
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.strokeStyle = '#29B6F6'; ctx.lineWidth = 1.5; ctx.shadowColor = 'rgba(41,182,246,0.3)'; ctx.shadowBlur = 4; ctx.stroke(); ctx.shadowBlur = 0
  // Anchor points
  pathPoints.forEach((p, idx) => {
    const x = (idx / (n - 1)) * W, y = H - p * H
    ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = '#66BB6A'; ctx.fill()
    ctx.strokeStyle = '#1A2026'; ctx.lineWidth = 1; ctx.stroke()
  })
  // Yellow scan line
  const scanX = ((Date.now() % 2000) / 2000) * W
  ctx.beginPath(); ctx.moveTo(scanX, 0); ctx.lineTo(scanX, H)
  ctx.strokeStyle = 'rgba(253,216,53,0.3)'; ctx.lineWidth = 1; ctx.stroke()
}
function onPathMouseDown(e) {
  const rect = pathCanvasRef.value.getBoundingClientRect()
  const mx = (e.clientX - rect.left) / rect.width
  const my = 1 - (e.clientY - rect.top) / rect.height
  const n = pathPoints.length
  let closest = 0, minDist = Infinity
  for (let i = 0; i < n; i++) {
    const px = i / (n - 1), py = pathPoints[i]
    const d = Math.sqrt((mx - px) ** 2 + (my - py) ** 2)
    if (d < minDist) { minDist = d; closest = i }
  }
  if (minDist < 0.15) {
    pathDragging = true
    pathPoints[closest] = Math.max(0, Math.min(1, my))
    drawPathGrid()
  }
}
function onPathMouseMove(e) {
  if (!pathDragging) return
  const rect = pathCanvasRef.value.getBoundingClientRect()
  const my = 1 - (e.clientY - rect.top) / rect.height
  const n = pathPoints.length
  let closest = 0, minDist = Infinity
  for (let i = 0; i < n; i++) {
    const px = i / (n - 1), py = pathPoints[i]
    const dist = Math.abs(py - my)
    if (dist < minDist) { minDist = dist; closest = i }
  }
  pathPoints[closest] = Math.max(0, Math.min(1, my))
  drawPathGrid()
}
function onPathMouseUp() { pathDragging = false }

// ── Spectrum ──
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
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#12161A'; ctx.fillRect(0, 0, W, H)
  const data = new Uint8Array(64)
  analyser.getByteFrequencyData(data)
  const count = 64; const step = W / count; const bw = Math.max(1, step * 0.5)
  for (let i = 0; i < count; i++) {
    const val = data[i] / 255; const bh = val * H
    ctx.fillStyle = `rgba(41,182,246,${0.15 + val * 0.7})`
    ctx.fillRect(i * step + (step - bw) / 2, H - bh, bw, bh)
  }
  animId = requestAnimationFrame(renderSpectrum)
}

// ── Ableton Live-style QWERTY keyboard mapping ──
function onKeyDown(e) {
  const key = e.key.toLowerCase()
  // Octave shift
  if (key === 'z') { currentOctave.value = Math.max(1, currentOctave.value - 1); e.preventDefault(); return }
  if (key === 'x') { currentOctave.value = Math.min(6, currentOctave.value + 1); e.preventDefault(); return }
  // Velocity
  if (key === 'c') { currentVelocity.value = Math.max(1, currentVelocity.value - 10); e.preventDefault(); return }
  if (key === 'v') { currentVelocity.value = Math.min(127, currentVelocity.value + 10); e.preventDefault(); return }
  // Note
  const midi = qwertyToMidi(key)
  if (midi >= 0 && !e.repeat) {
    e.preventDefault()
    synth.noteOn(midi, currentVelocity.value / 127)
    const k = keys.value.find(k => k.midi === midi)
    if (k) k.active = true
  }
}
function onKeyUp(e) {
  const key = e.key.toLowerCase()
  const midi = qwertyToMidi(key)
  if (midi >= 0) { synth.noteOff(midi); const k = keys.value.find(k => k.midi === midi); if (k) k.active = false }
}

// ── Lifecycle ──
let envIntId = null
let pathAnimId = null
onMounted(() => {
  synth.init()
  renderSpectrum()
  requestAnimationFrame(() => {
    drawWaveShape(synth.osc1.type, osc1WaveRef.value)
    drawWaveShape(synth.osc2.type, osc2WaveRef.value)
    drawFilterCurve(filter1CurveRef.value, synth.filterCfg.cutoff, synth.filterCfg.resonance, synth.filterCfg.type)
    drawFilterCurve(filter2CurveRef.value, synth.filter2Cfg.cutoff, synth.filter2Cfg.resonance, synth.filter2Cfg.type)
    drawNoiseViz()
  })
  envIntId = setInterval(() => {
    drawEnv()
    drawNoiseViz()
    drawFilterCurve(filter1CurveRef.value, synth.filterCfg.cutoff, synth.filterCfg.resonance, synth.filterCfg.type)
    drawFilterCurve(filter2CurveRef.value, synth.filter2Cfg.cutoff, synth.filter2Cfg.resonance, synth.filter2Cfg.type)
  }, 50)
  pathAnimId = setInterval(drawPathGrid, 100)
  document.addEventListener('keydown', onKeyDown); document.addEventListener('keyup', onKeyUp)
})
onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId)
  if (envIntId) clearInterval(envIntId)
  if (pathAnimId) clearInterval(pathAnimId)
  document.removeEventListener('keydown', onKeyDown); document.removeEventListener('keyup', onKeyUp)
  synth.dispose()
})
</script>

<style scoped>
/* ════════════════════════════════════════════════════════
   SERUM 2 DARK THEME — Complete Synthesizer UI
   ════════════════════════════════════════════════════════ */

/* ── Root Variables ── */
.synth-root {
  --s-bg: #12161A;
  --s-bg2: #1A2026;
  --s-bg3: #222A32;
  --s-border: #2A3240;
  --s-border2: #3A4650;
  --s-text: #C8D0D8;
  --s-text2: #889098;
  --s-cyan: #29B6F6;
  --s-green: #66BB6A;
  --s-yellow: #FDD835;
  --s-font: 'DM Sans', system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--s-bg);
  color: var(--s-text);
  font-family: var(--s-font);
  font-size: 9px;
  user-select: none;
  min-height: 300px;
  border-radius: 8px;
  overflow: hidden;
}

/* ════════════════════════════════════════════════════════
   TOP BAR
   ════════════════════════════════════════════════════════ */
.synth-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  background: #0E1215;
  border-bottom: 1px solid var(--s-border);
}
.brand {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--s-cyan);
  display: flex;
  align-items: center;
  gap: 6px;
}
.brand-icon { font-size: 16px; }
.header-tabs { display: flex; gap: 2px; }
.ht-btn {
  padding: 3px 12px;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 1px;
  background: transparent;
  color: var(--s-text2);
  border: none;
  cursor: pointer;
  border-radius: 3px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s;
}
.ht-btn:hover { color: var(--s-text); background: var(--s-bg3); }
.ht-btn.active { color: var(--s-cyan); background: rgba(41,182,246,0.08); }
.ht-led { width: 5px; height: 5px; border-radius: 50%; background: var(--s-text2); }
.ht-led.on { background: var(--s-cyan); box-shadow: 0 0 4px var(--s-cyan); }
.header-preset { margin-left: auto; display: flex; align-items: center; gap: 4px; }
.hp-btn {
  padding: 2px 8px;
  background: var(--s-bg2);
  border: 1px solid var(--s-border);
  color: var(--s-text2);
  border-radius: 3px;
  cursor: pointer;
  font-size: 10px;
}
.hp-btn:hover { color: var(--s-cyan); border-color: var(--s-cyan); }
.hp-select {
  padding: 3px 6px;
  font-size: 9px;
  font-family: var(--s-font);
  background: var(--s-bg2);
  color: var(--s-text);
  border: 1px solid var(--s-border);
  border-radius: 3px;
  cursor: pointer;
  min-width: 100px;
}
.hp-save { font-size: 11px; padding: 2px 6px; }

/* ════════════════════════════════════════════════════════
   GENERATOR GRID — 5 horizontal modules
   ════════════════════════════════════════════════════════ */
.gen-grid {
  display: grid;
  grid-template-columns: 1.8fr 1.8fr 1.2fr 2.2fr;
  gap: 6px;
  padding: 0 6px;
}
.gen-card {
  background: var(--s-bg2);
  border: 1px solid var(--s-border);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.gen-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--s-bg3);
  border-bottom: 1px solid var(--s-border);
}
.gen-led { width: 6px; height: 6px; border-radius: 50%; background: transparent; box-shadow: inset 0 0 3px rgba(0,0,0,0.5); }
.gen-led.on { background: var(--s-green); box-shadow: 0 0 6px var(--s-green); }
.gen-title { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: var(--s-text); }
.gen-toggle { margin-left: auto; font-size: 8px; color: var(--s-text2); display: flex; align-items: center; gap: 3px; cursor: pointer; }
.gen-toggle input { accent-color: var(--s-green); }
.gen-viz-wrap { height: 60px; position: relative; background: #0E1215; border-bottom: 1px solid var(--s-border); }
.gen-viz-wrap canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.granular-viz { height: 60px; }

/* Knob grid helpers */
.gen-knob-grid { display: grid; gap: 2px; padding: 4px; }
.gkg-6 { grid-template-columns: repeat(6, 1fr); }
.gkg-4 { grid-template-columns: repeat(4, 1fr); }
.gkg-3 { grid-template-columns: repeat(3, 1fr); }
.gkg-2 { grid-template-columns: repeat(2, 1fr); }

.gen-wave-select { display: flex; gap: 2px; padding: 2px 4px 4px; justify-content: center; flex-wrap: wrap; }

/* Warp slider */
.gen-warp {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px 4px;
  border-top: 1px solid var(--s-border);
}
.warp-label { font-size: 7px; font-weight: 700; color: var(--s-text2); letter-spacing: 0.5px; }
.warp-slider { flex: 1; height: 3px; -webkit-appearance: none; appearance: none; background: var(--s-border); border-radius: 9999px; outline: none; cursor: pointer; }
.warp-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 8px; height: 8px; border-radius: 50%; background: var(--s-yellow); cursor: pointer; }
.warp-slider::-moz-range-thumb { width: 8px; height: 8px; border-radius: 50%; background: var(--s-yellow); cursor: pointer; border: none; }
.warp-val { font-size: 7px; color: var(--s-yellow); min-width: 24px; text-align: right; font-family: var(--s-font); }

/* Granular badge */
.granular-badge {
  font-size: 7px;
  font-weight: 700;
  color: var(--s-text2);
  letter-spacing: 1px;
  padding: 2px 6px;
  background: var(--s-bg);
  border-radius: 3px;
  border: 1px solid var(--s-border);
}

/* ── Filter Dual Module ── */
.filter-dual-body {
  display: flex;
  gap: 0;
  flex: 1;
}
.filter-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 3px;
}
.filter-divider {
  width: 1px;
  background: var(--s-border);
  margin: 4px 0;
}
.filter-mini-header {
  font-size: 8px;
  font-weight: 700;
  color: var(--s-text2);
  text-align: center;
  letter-spacing: 1px;
  margin-bottom: 2px;
}
.filter-viz-sm {
  height: 28px;
  position: relative;
  background: #0E1215;
  border-radius: 3px;
  margin-bottom: 2px;
}
.filter-viz-sm canvas { position: absolute; inset: 0; width: 100%; height: 100%; }

/* ════════════════════════════════════════════════════════
   BOTTOM MODULATION GRID
   ════════════════════════════════════════════════════════ */
.bottom-mod-grid {
  display: grid;
  grid-template-columns: 1.2fr 2.2fr 1.8fr 1.2fr;
  gap: 6px;
  padding: 0 6px;
}
.mod-panel {
  background: var(--s-bg2);
  border: 1px solid var(--s-border);
  border-radius: 6px;
  padding: 6px;
}
.mod-panel-header {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.2px;
  margin-bottom: 4px;
  color: var(--s-text2);
}
.mod-led { width: 4px; height: 4px; border-radius: 50%; background: var(--s-cyan); }

/* Macros 2x4 grid */
.macro-grid-2x4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px;
}

/* Env / LFO tabs */
.env-lfo-tabs {
  display: flex;
  gap: 1px;
  margin-left: auto;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.et-btn {
  padding: 1px 4px;
  font-size: 6px;
  font-weight: 600;
  background: transparent;
  color: var(--s-text2);
  border: 1px solid transparent;
  border-radius: 2px;
  cursor: pointer;
  line-height: 1.4;
}
.et-btn.active { color: var(--s-cyan); border-color: var(--s-cyan); background: rgba(41,182,246,0.08); }
.env-canvas-wrap { height: 80px; position: relative; background: #0E1215; border-radius: 4px; overflow: hidden; }
.env-canvas-wrap canvas { position: absolute; inset: 0; width: 100%; height: 100%; cursor: crosshair; }
.env-overlay { position: absolute; inset: 0; pointer-events: none; }
.env-mark { position: absolute; font-size: 6px; color: var(--s-text2); letter-spacing: 0.5px; font-weight: 600; }
.env-sliders { display: flex; gap: 4px; margin-top: 4px; }
.env-slide { flex: 1; display: flex; align-items: center; gap: 3px; }
.env-slide label { font-size: 8px; font-weight: 700; color: var(--s-cyan); min-width: 8px; }
.env-slide input[type="range"] { flex: 1; height: 2px; }
.sv { font-size: 7px; font-family: var(--s-font); color: var(--s-text2); min-width: 32px; text-align: right; }

/* Path / Custom LFO */
.path-canvas-wrap { height: 80px; position: relative; background: #0E1215; border-radius: 4px; overflow: hidden; }
.path-canvas-wrap canvas { position: absolute; inset: 0; width: 100%; height: 100%; cursor: pointer; }
.path-controls { display: flex; gap: 2px; justify-content: center; margin-top: 4px; }

/* Voicing */
.voicing-body { display: flex; flex-direction: column; gap: 4px; }
.voicing-row { display: flex; gap: 2px; justify-content: center; }
.voicing-mode { display: flex; gap: 2px; justify-content: center; margin-top: 2px; }

/* ════════════════════════════════════════════════════════
   FOOTER
   ════════════════════════════════════════════════════════ */
.synth-footer {
  display: grid;
  grid-template-columns: 1.5fr 1.2fr 0.5fr 3fr;
  gap: 6px;
  padding: 0 6px 6px;
}

/* Spectrum */
.ft-spectrum {
  position: relative;
  height: 60px;
  background: #0E1215;
  border: 1px solid var(--s-border);
  border-radius: 4px;
  overflow: hidden;
}
.ft-label {
  position: absolute;
  top: 2px;
  left: 6px;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--s-text2);
  z-index: 2;
}
.ft-spectrum canvas { position: absolute; inset: 0; width: 100%; height: 100%; }

/* Arp / Global */
.ft-arp {
  background: var(--s-bg2);
  border: 1px solid var(--s-border);
  border-radius: 4px;
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.arp-mode-row {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
}
.arp-param-row {
  display: flex;
  gap: 4px;
}
.arp-param {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
}
.arp-param label {
  font-size: 7px;
  font-weight: 700;
  color: var(--s-text2);
  letter-spacing: 0.5px;
  min-width: 18px;
}
.arp-step-grid {
  display: flex;
  gap: 2px;
  height: 32px;
}
.arp-step-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid var(--s-border);
  background: var(--s-bg);
  transition: all 0.12s;
}
.arp-step-cell:hover { border-color: var(--s-cyan); }
.arp-step-cell.inactive { opacity: 0.35; }
.arp-step-cell.inactive .arp-step-bar { background: var(--s-border2); }
.arp-step-bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  padding: 1px;
}
.arp-step-bar {
  width: 100%;
  background: var(--s-green);
  border-radius: 1px;
  min-height: 2px;
  transition: height 0.15s;
}
.arp-step-num {
  font-size: 6px;
  color: var(--s-text2);
  line-height: 10px;
  font-weight: 600;
}
.arp-vel-hint {
  font-size: 6px;
  color: var(--s-text2);
  text-align: center;
  letter-spacing: 0.3px;
}
.arp-global-row {
  display: flex;
  gap: 2px;
  justify-content: center;
  border-top: 1px solid var(--s-border);
  padding-top: 2px;
  margin-top: 1px;
}
.arp-rate-slider {
  flex: 1;
  height: 3px;
  min-width: 0;
  -webkit-appearance: none;
  appearance: none;
  background: var(--s-border);
  border-radius: 9999px;
  outline: none;
  cursor: pointer;
}
.arp-rate-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--s-cyan);
  cursor: pointer;
}
.arp-rate-slider::-moz-range-thumb {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--s-cyan);
  cursor: pointer;
  border: none;
}
.arp-rate-val { font-size: 7px; color: var(--s-cyan); font-family: var(--s-font); min-width: 20px; text-align: right; }
.arp-select {
  padding: 2px 4px;
  font-size: 8px;
  font-family: var(--s-font);
  font-weight: 600;
  background: var(--s-bg);
  color: var(--s-text);
  border: 1px solid var(--s-border);
  border-radius: 3px;
  cursor: pointer;
  outline: none;
}
.arp-select:focus { border-color: var(--s-cyan); }

/* Wheels */
.ft-wheels {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  padding: 0 2px;
}
.wheel-wrap {
  position: relative;
  width: 20px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.wheel-label {
  font-size: 6px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--s-text2);
  margin-bottom: 2px;
}
.wheel-slider {
  -webkit-appearance: slider-vertical;
  appearance: slider-vertical;
  width: 20px;
  height: 50px;
  margin: 0;
  cursor: pointer;
  background: transparent;
  color: var(--s-cyan);
}
.wheel-track {
  position: absolute;
  bottom: 0;
  width: 3px;
  height: 50px;
  background: var(--s-border);
  border-radius: 2px;
  z-index: -1;
}

/* Keyboard */
.ft-kbd {
  display: flex;
  flex-direction: column;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--s-bg3);
  border: 1px solid var(--s-border);
}
.kbd-transpose {
  display: flex;
  gap: 2px;
  padding: 1px 4px;
  background: var(--s-bg);
  border-bottom: 1px solid var(--s-border);
}
.kbd-transpose .arp-select { font-size: 7px; padding: 1px 3px; }
.kbd-info { font-size: 8px; font-weight: 700; color: var(--s-cyan); letter-spacing: 0.5px; }
.kbd-div { font-size: 8px; color: var(--s-border2); }
.kbd-oct-btn { padding: 1px 5px; font-size: 7px; background: var(--s-bg); color: var(--s-text2); border: 1px solid var(--s-border); border-radius: 3px; cursor: pointer; }
.kbd-oct-btn:hover { color: var(--s-cyan); border-color: var(--s-cyan); }
.kbd-keys {
  flex: 1;
  display: flex;
  position: relative;
}
.key { cursor: pointer; transition: background 0.08s; }
.key.white {
  flex: 1;
  height: 100%;
  background: #E8ECF0;
  border-right: 1px solid #C0C8D0;
  position: relative;
}
.key.white.active { background: #29B6F6; }
.key.black {
  position: absolute;
  top: 0;
  height: 60%;
  background: #1A1E24;
  border-radius: 0 0 3px 3px;
  border: 1px solid #0E1215;
  border-top: none;
}
.key.black.active { background: #66BB6A; }
.key-label { position: absolute; bottom: 2px; left: 3px; font-size: 6px; color: #889098; }

/* ── Shared Components ── */
.ws-btn {
  padding: 2px 8px;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: var(--s-bg);
  color: var(--s-text2);
  border: 1px solid var(--s-border);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.12s;
}
.ws-btn:hover { border-color: var(--s-cyan); color: var(--s-text); }
.ws-btn.active { background: var(--s-cyan); color: #0E1215; border-color: var(--s-cyan); }
.ws-sm { padding: 1px 5px; font-size: 7px; }

.s-slider {
  width: 100%;
  height: 3px;
  min-width: 0;
  -webkit-appearance: none;
  appearance: none;
  background: var(--s-border);
  border-radius: 9999px;
  outline: none;
  cursor: pointer;
}
.s-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--s-cyan);
  cursor: pointer;
}
.s-slider::-moz-range-thumb {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--s-cyan);
  cursor: pointer;
  border: none;
}

/* Knob component */
.knob-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 2px;
  cursor: pointer;
}
.knob-svg { display: block; }
.knob-label { font-size: 7px; font-weight: 600; color: var(--s-text2); letter-spacing: 0.5px; }
.knob-val { font-size: 7px; font-family: var(--s-font); color: var(--s-cyan); }

/* ── Responsive ── */
@media (max-width: 1100px) {
  .gen-grid { grid-template-columns: repeat(3, 1fr); }
  .bottom-mod-grid { grid-template-columns: 1fr 1fr; }
  .synth-footer { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 900px) {
  .gen-grid { grid-template-columns: 1fr 1fr; }
  .bottom-mod-grid { grid-template-columns: 1fr; }
  .synth-footer { grid-template-columns: 1fr; }
  .ft-kbd { height: 50px; }
}
@media (max-width: 600px) {
  .gen-grid { grid-template-columns: 1fr; }
}
</style>