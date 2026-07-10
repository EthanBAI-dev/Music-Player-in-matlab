import { ref, reactive, watch } from 'vue'
import * as Tone from 'tone'

// ── Utility ──────────────────────────────────────────────────────────
export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export function midiToName(midi) {
  const oct = Math.floor(midi / 12) - 1
  return NOTE_NAMES[midi % 12] + oct
}

export function isBlackKey(midi) {
  const note = midi % 12
  return [1, 3, 6, 8, 10].includes(note)
}

// ── Constants ────────────────────────────────────────────────────────
const MAX_VOICES = 16
const PRESETS_KEY = 'soniq_synth_presets'
const WAVE_TYPES = ['sine', 'triangle', 'sawtooth', 'square']

// ── Defaults ─────────────────────────────────────────────────────────
const defaultADSR = { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.5 }
const defaultFilter = { type: 'lowpass', cutoff: 12000, resonance: 0.3, envAmt: 0.3 }
const defaultFilter2 = { type: 'lowpass', cutoff: 20000, resonance: 0, active: false }
const defaultLFO = { type: 'sine', rate: 3.5, amount: 0, target: 'pitch' }
const defaultFX = { reverb: 0.3, delay: 0, feedback: 0.25 }

const defaultOsc1 = {
  type: 'sawtooth', gain: 0.6, detune: 0, octave: 0, active: true,
  pan: 0, unison: 1, wtPos: 0, blend: 0.5, warp: 0,
}
const defaultOsc2 = {
  type: 'square', gain: 0.4, detune: 0.2, octave: -1, active: true,
  pan: 0, unison: 1, wtPos: 0, blend: 0.5, warp: 0,
}

// ── Map wtPos (0-1) to oscillator type ──
function wtPosToType(wtPos) {
  const idx = Math.round(wtPos * (WAVE_TYPES.length - 1))
  return WAVE_TYPES[Math.max(0, Math.min(WAVE_TYPES.length - 1, idx))]
}

// ── Create warp waveshaper curve ──
function makeWarpCurve(amount, samples = 256) {
  const curve = new Float32Array(samples)
  for (let i = 0; i < samples; i++) {
    const x = (i / samples) * 2 - 1
    const warp = amount * 0.8
    curve[i] = x + warp * (x * x * x - x) + (warp * 0.3) * (x * x - 1) * x
    if (curve[i] > 1) curve[i] = 1
    if (curve[i] < -1) curve[i] = -1
  }
  return curve
}

// ── Presets ──────────────────────────────────────────────────────────
const builtInPresets = [
  { name: 'Default', osc1: { ...defaultOsc1 }, osc2: { ...defaultOsc2 }, adsr: { ...defaultADSR }, filter: { ...defaultFilter }, filter2: { ...defaultFilter2 }, lfo: { ...defaultLFO }, fx: { ...defaultFX }, noiseLevel: 0.4, noiseType: 'white' },
  { name: 'Warm Pad', osc1: { type: 'sawtooth', gain: 0.5, detune: 5, octave: 0, active: true, pan: 0, unison: 2, wtPos: 0.5, blend: 0.6, warp: 0 }, osc2: { type: 'sawtooth', gain: 0.5, detune: -5, octave: 0, active: true, pan: 0, unison: 2, wtPos: 0.3, blend: 0.5, warp: 0 }, adsr: { attack: 0.5, decay: 0.4, sustain: 0.8, release: 1.5 }, filter: { type: 'lowpass', cutoff: 3000, resonance: 0.5, envAmt: 0.4 }, filter2: { type: 'lowpass', cutoff: 20000, resonance: 0, active: false }, lfo: { type: 'sine', rate: 2.0, amount: 0.15, target: 'cutoff' }, fx: { reverb: 0.6, delay: 0.2, feedback: 0.2 }, noiseLevel: 0 },
  { name: 'Lead', osc1: { type: 'square', gain: 0.6, detune: 0, octave: 0, active: true, pan: 0, unison: 3, wtPos: 0.8, blend: 0.3, warp: 0.2 }, osc2: { type: 'triangle', gain: 0.3, detune: 7, octave: 0, active: true, pan: 0, unison: 1, wtPos: 0.2, blend: 0.5, warp: 0 }, adsr: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.3 }, filter: { type: 'lowpass', cutoff: 8000, resonance: 0.6, envAmt: 0.3 }, filter2: { type: 'lowpass', cutoff: 20000, resonance: 0, active: false }, lfo: { type: 'sine', rate: 5.0, amount: 0.2, target: 'pitch' }, fx: { reverb: 0.3, delay: 0.1, feedback: 0.1 }, noiseLevel: 0 },
  { name: 'Bass', osc1: { type: 'sawtooth', gain: 0.7, detune: -5, octave: -1, active: true, pan: 0, unison: 4, wtPos: 0.6, blend: 0.2, warp: 0.3 }, osc2: { type: 'square', gain: 0.3, detune: 0, octave: -1, active: true, pan: 0, unison: 1, wtPos: 0.7, blend: 0.5, warp: 0 }, adsr: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.15 }, filter: { type: 'lowpass', cutoff: 600, resonance: 3.0, envAmt: 0.2 }, filter2: { type: 'lowpass', cutoff: 20000, resonance: 0, active: false }, lfo: { type: 'sine', rate: 4.0, amount: 0.1, target: 'cutoff' }, fx: { reverb: 0.1, delay: 0, feedback: 0 }, noiseLevel: 0 },
  { name: 'Pluck', osc1: { type: 'sine', gain: 0.5, detune: 0, octave: 0, active: true, pan: 0, unison: 1, wtPos: 0, blend: 0.5, warp: 0 }, osc2: { type: 'triangle', gain: 0.3, detune: 12, octave: 0, active: true, pan: 0, unison: 1, wtPos: 0.3, blend: 0.5, warp: 0 }, adsr: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }, filter: { type: 'bandpass', cutoff: 3000, resonance: 1.5, envAmt: 0.5 }, filter2: { type: 'lowpass', cutoff: 20000, resonance: 0, active: false }, lfo: { type: 'sine', rate: 2.0, amount: 0, target: 'pitch' }, fx: { reverb: 0.4, delay: 0.15, feedback: 0.2 }, noiseLevel: 0 },
]

// ── Load saved presets ───────────────────────────────────────────────
function loadSavedPresets() {
  try {
    const raw = localStorage.getItem(PRESETS_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (_) { return [] }
}

function saveCustomPresets(presets) {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
  } catch (_) {}
}

// ── Voice class ──────────────────────────────────────────────────────
class Voice {
  constructor() {
    this.midi = -1
    this.released = true
    this.osc1 = null
    this.osc2 = null
    this.osc1Gain = null
    this.osc2Gain = null
    this.osc1Unison = []
    this.osc2Unison = []
    this.osc1Blend = null
    this.osc2Blend = null
    this.osc1BlendGain = null
    this.osc2BlendGain = null
    this.osc1Panner = null
    this.osc2Panner = null
    this.osc1Shaper = null
    this.osc2Shaper = null
    this.env = null
    // Store base frequency and detune for pitch bend updates
    this.baseFreq1 = 0
    this.baseFreq2 = 0
    this.baseDetune1 = 0
    this.baseDetune2 = 0
  }

  free() {
    try {
      this.osc1Unison.forEach(u => { if (u.osc) { u.osc.stop(); u.osc.dispose() }; if (u.gain) u.gain.dispose() })
      this.osc2Unison.forEach(u => { if (u.osc) { u.osc.stop(); u.osc.dispose() }; if (u.gain) u.gain.dispose() })
      this.osc1Unison = []; this.osc2Unison = []
      if (this.osc1Blend) { this.osc1Blend.stop(); this.osc1Blend.dispose() }
      if (this.osc2Blend) { this.osc2Blend.stop(); this.osc2Blend.dispose() }
      if (this.osc1BlendGain) this.osc1BlendGain.dispose()
      if (this.osc2BlendGain) this.osc2BlendGain.dispose()
      if (this.osc1) { this.osc1.stop(); this.osc1.dispose() }
      if (this.osc2) { this.osc2.stop(); this.osc2.dispose() }
      if (this.osc1Gain) this.osc1Gain.dispose()
      if (this.osc2Gain) this.osc2Gain.dispose()
      if (this.osc1Panner) this.osc1Panner.dispose()
      if (this.osc2Panner) this.osc2Panner.dispose()
      if (this.osc1Shaper) this.osc1Shaper.dispose()
      if (this.osc2Shaper) this.osc2Shaper.dispose()
      if (this.env) this.env.dispose()
    } catch (_) {}
    this.osc1 = null; this.osc2 = null
    this.osc1Gain = null; this.osc2Gain = null
    this.osc1Blend = null; this.osc2Blend = null
    this.osc1BlendGain = null; this.osc2BlendGain = null
    this.osc1Panner = null; this.osc2Panner = null
    this.osc1Shaper = null; this.osc2Shaper = null
    this.osc1Unison = []; this.osc2Unison = []
    this.env = null
    this.midi = -1; this.released = true
    this.baseFreq1 = 0; this.baseFreq2 = 0
    this.baseDetune1 = 0; this.baseDetune2 = 0
  }
}

// ── Helper: create an oscillator sub-graph for one voice ──
function buildOscVoice(ctx, { freq, octave, type, gain, detune, pan, unison, blend, warp }) {
  const now = Tone.now()
  const freqVal = freq * Math.pow(2, octave)
  const nodes = []
  let output = null

  const panner = new Tone.Panner(pan)
  nodes.push(panner)
  output = panner

  let shaper = null
  if (warp > 0.01) {
    shaper = new Tone.WaveShaper(makeWarpCurve(warp))
    nodes.push(shaper)
    output = shaper
  }

  const mainOsc = new Tone.Oscillator({ frequency: freqVal, type, detune })
  const mainGain = new Tone.Gain(gain * (1 - blend * 0.5))
  nodes.push(mainOsc, mainGain)
  mainOsc.chain(mainGain, output || panner)
  mainOsc.start(now)

  let blendOsc = null
  let blendGain = null
  if (blend > 0.01) {
    const blendType = wtPosToType(blend > 0.5 ? 1 - blend : blend + 0.5)
    blendOsc = new Tone.Oscillator({ frequency: freqVal, type: blendType, detune })
    blendGain = new Tone.Gain(gain * blend * 0.6)
    nodes.push(blendOsc, blendGain)
    blendOsc.chain(blendGain, output || panner)
    blendOsc.start(now)
  }

  const unisonVoices = []
  if (unison > 1) {
    for (let i = 0; i < unison - 1; i++) {
      const spread = (i + 1) * (0.5 + Math.random() * 1.5)
      const panSpread = ((i / (unison - 1)) * 2 - 1) * 0.7
      const uOsc = new Tone.Oscillator({ frequency: freqVal, type, detune: detune + spread * (i % 2 === 0 ? 1 : -1) })
      const uGain = new Tone.Gain(gain * 0.3 / unison)
      const uPan = new Tone.Panner(pan + panSpread * pan)
      nodes.push(uOsc, uGain, uPan)
      uOsc.chain(uGain, uPan, output || panner)
      uOsc.start(now)
      unisonVoices.push({ osc: uOsc, gain: uGain, pan: uPan })
    }
  }

  return { mainOsc, mainGain, panner, shaper, blendOsc, blendGain, unisonVoices, output: output || panner, freqVal, detune }
}

// ── Composable ───────────────────────────────────────────────────────
export function useSynth() {
  // ── State ──
  const osc1 = reactive({ ...defaultOsc1 })
  const osc2 = reactive({ ...defaultOsc2 })
  const adsr = reactive({ ...defaultADSR })
  const filterCfg = reactive({ ...defaultFilter })
  const filter2Cfg = reactive({ ...defaultFilter2 })
  const lfoCfg = reactive({ ...defaultLFO })
  const fx = reactive({ ...defaultFX })
  const noiseLevel = ref(0.4)
  const noiseType = ref('white')
  const masterVol = ref(0.8)
  const currentPreset = ref('Default')

  // ── Arp state ──
  const arpMode = ref('OFF')
  const arpRate = ref(1.0)
  const arpGate = ref(0.6)    // 0-1, note length
  const arpSwing = ref(0)     // 0-1, swing/shuffle amount
  const arpOctaveRange = ref(1)  // 1-4 octaves
  const arpSteps = reactive(
    Array.from({ length: 8 }, (_, i) => ({
      active: true,
      velocity: 0.7 + Math.random() * 0.3,
      pitchOffset: 0,
      probability: 1,
    }))
  )
  const heldNotes = ref([])
  const arpPlayOrder = ref([])  // note order for AS PLAYED mode
  let arpTimer = null
  let arpStep = 0
  let arpDirection = 1
  let lastArpTime = 0

  // ── Wheels state ──
  const pitchBend = ref(0)
  const modWheel = ref(0)

  // ── Voicing state ──
  const voiceMode = ref('POLY')
  const voiceLimit = ref(16)
  const voiceSpread = ref(0)
  const voiceUnison = ref(1)  // global unison

  const presets = ref([...builtInPresets, ...loadSavedPresets()])

  // ── Audio nodes ──
  let initialized = false
  let masterGain = null
  let filterNode = null
  let filter2Node = null
  let analyser = null
  let reverbNode = null
  let delayNode = null
  let reverbSend = null
  let delaySend = null
  let lfoNode = null
  let lfoGain = null
  let noiseNode = null
  let noiseGain = null

  const voices = []
  let noteOnMap = {}
  let currentMonoMidi = -1  // current note in MONO mode

  // ── Apply pitch bend to a voice's oscillators ──
  function applyPitchBendToVoice(voice, bend) {
    const cents = bend * (pitchBendRange.value || 2) * 100
    const mult = Math.pow(2, cents / 1200)
    if (voice.osc1 && voice.baseFreq1 > 0) {
      voice.osc1.frequency.value = voice.baseFreq1 * mult
    }
    if (voice.osc2 && voice.baseFreq2 > 0) {
      voice.osc2.frequency.value = voice.baseFreq2 * mult
    }
    // Unison voices
    voice.osc1Unison.forEach(u => {
      if (u.osc) u.osc.frequency.value = voice.baseFreq1 * mult
    })
    voice.osc2Unison.forEach(u => {
      if (u.osc) u.osc.frequency.value = voice.baseFreq2 * mult
    })
    // Blend oscillators
    if (voice.osc1Blend) voice.osc1Blend.frequency.value = voice.baseFreq1 * mult
    if (voice.osc2Blend) voice.osc2Blend.frequency.value = voice.baseFreq2 * mult
  }

  const pitchBendRange = ref(2)

  // ── Apply mod wheel to filter cutoff ──
  function applyModWheel(val) {
    if (!initialized || !filterNode) return
    const minCutoff = 200
    const maxCutoff = 20000
    filterNode.frequency.value = minCutoff + (filterCfg.cutoff - minCutoff) * (0.3 + 0.7 * (1 - val))
  }

  // ── Acquire voice from pool ──
  function acquireVoice() {
    const limit = Math.max(1, Math.min(MAX_VOICES, Math.round(voiceLimit.value)))
    let v = voices.find(v => v.released)
    if (v) {
      // Check if we're at the limit
      const activeCount = voices.filter(x => !x.released).length
      if (activeCount >= limit) {
        // Steal old note
        const oldest = voices.reduce((a, b) => (!a.released && (a.midi < b.midi || b.released)) ? a : b)
        if (oldest && !oldest.released) noteOffNow(oldest)
      }
      return v
    }
    if (voices.length > 0) {
      v = voices.reduce((a, b) => (a.midi >= 0 && a.midi < b.midi) ? a : b)
      noteOffNow(v)
      return v
    }
    return null
  }

  // ── Force note off (steal) ──
  function noteOffNow(voice) {
    try {
      if (voice.env) {
        voice.env.triggerRelease()
        voice.env.dispose()
      }
    } catch (_) {}
    if (voice.midi >= 0) delete noteOnMap[voice.midi]
    voice.free()
  }

  // ── Init ──
  function init() {
    if (initialized) return
    Tone.start()

    masterGain = new Tone.Gain(masterVol.value).toDestination()

    filter2Node = new Tone.Filter({
      type: filter2Cfg.type,
      frequency: filter2Cfg.cutoff || 20000,
      Q: filter2Cfg.resonance || 0,
    })
    filter2Node.connect(masterGain)

    filterNode = new Tone.Filter({
      type: filterCfg.type,
      frequency: filterCfg.cutoff || 12000,
      Q: filterCfg.resonance || 0.3,
    })
    filterNode.connect(filter2Node)

    const toneAnalyser = new Tone.Analyser('fft', 64)
    filter2Node.connect(toneAnalyser)
    analyser = toneAnalyser

    reverbNode = new Tone.Reverb({ decay: 2 })
    reverbNode.wet.value = 1
    reverbSend = new Tone.Gain(fx.reverb)
    masterGain.connect(reverbSend)
    reverbSend.connect(reverbNode)
    reverbNode.toDestination()

    delayNode = new Tone.FeedbackDelay('8n', fx.feedback)
    delayNode.wet.value = 1
    delaySend = new Tone.Gain(fx.delay)
    masterGain.connect(delaySend)
    delaySend.connect(delayNode)
    delayNode.toDestination()

    lfoNode = new Tone.LFO(lfoCfg.rate, -1, 1)
    lfoNode.type = lfoCfg.type
    lfoGain = new Tone.Gain(0)
    lfoNode.connect(lfoGain)
    lfoNode.start()

    noiseNode = new Tone.Noise(noiseType.value)
    noiseGain = new Tone.Gain(noiseLevel.value)
    noiseNode.connect(noiseGain)
    noiseGain.connect(masterGain)
    noiseNode.start()

    for (let i = 0; i < MAX_VOICES; i++) voices.push(new Voice())

    initialized = true
  }

  // Sync noiseLevel knob changes to the actual audio gain node
  watch(noiseLevel, (val) => {
    if (initialized && noiseGain) noiseGain.gain.value = val
  })

  // ── Note On ──
  function noteOn(midi, velocity = 0.8) {
    if (!initialized) init()

    // Handle MONO mode
    if (voiceMode.value === 'MONO' || voiceMode.value === 'LEGATO') {
      const legato = voiceMode.value === 'LEGATO' && currentMonoMidi >= 0
      if (currentMonoMidi >= 0) {
        // Release current mono note but keep it for legato transition
        const oldVoice = noteOnMap[currentMonoMidi]
        if (oldVoice && !oldVoice.released) {
          if (!legato) {
            oldVoice.env.triggerRelease()
          }
        }
      }
      currentMonoMidi = midi
      const voice = acquireVoice()
      if (!voice) return
      startVoice(voice, midi, velocity, legato)
      noteOnMap[midi] = voice
      heldNotes.value = [...new Set([...heldNotes.value, midi])].sort((a, b) => a - b)
      // Track play order for AS PLAYED mode
      arpPlayOrder.value = [...new Set([...arpPlayOrder.value, midi])]
      restartArp()
      return
    }

    // POLY mode
    const voice = acquireVoice()
    if (!voice) return
    startVoice(voice, midi, velocity, false)
    noteOnMap[midi] = voice
    heldNotes.value = [...new Set([...heldNotes.value, midi])].sort((a, b) => a - b)
    // Track play order for AS PLAYED mode
    arpPlayOrder.value = [...new Set([...arpPlayOrder.value, midi])]
    restartArp()
  }

  // ── Start a voice ──
  function startVoice(voice, midi, velocity, legato) {
    voice.midi = midi
    voice.released = false

    const freq = midiToFreq(midi)
    const now = Tone.now()

    const bend = pitchBend.value
    const cents = bend * pitchBendRange.value * 100
    const bendMult = Math.pow(2, cents / 1200)
    const bentFreq = freq * bendMult

    // Apply voice spread to pan
    const spread = voiceSpread.value / 100
    const pan1 = Math.max(-1, Math.min(1, osc1.pan + (spread * -0.5)))
    const pan2 = Math.max(-1, Math.min(1, osc2.pan + (spread * 0.5)))

    if (!legato) {
      voice.env = new Tone.AmplitudeEnvelope({
        attack: adsr.attack,
        decay: adsr.decay,
        sustain: adsr.sustain,
        release: adsr.release,
      }).connect(filterNode)
    }

    const lfoConnected = lfoCfg.target === 'pitch' && lfoCfg.amount > 0

    // Build oscillator 1
    if (osc1.active && osc1.gain > 0) {
      const v1 = buildOscVoice(voice, {
        freq: bentFreq, octave: osc1.octave, type: wtPosToType(osc1.wtPos),
        gain: osc1.gain, detune: osc1.detune,
        pan: pan1, unison: Math.round(Math.max(1, osc1.unison + voiceUnison.value - 1)),
        blend: osc1.blend, warp: osc1.warp,
      })
      voice.osc1 = v1.mainOsc
      voice.osc1Gain = v1.mainGain
      voice.osc1Panner = v1.panner
      voice.osc1Shaper = v1.shaper
      voice.osc1Blend = v1.blendOsc
      voice.osc1BlendGain = v1.blendGain
      voice.osc1Unison = v1.unisonVoices
      voice.baseFreq1 = v1.freqVal
      voice.baseDetune1 = v1.detune
      v1.output.connect(voice.env)

      if (lfoConnected) lfoGain.connect(voice.osc1.detune)
    }

    // Build oscillator 2
    if (osc2.active && osc2.gain > 0) {
      const v2 = buildOscVoice(voice, {
        freq: bentFreq, octave: osc2.octave, type: wtPosToType(osc2.wtPos),
        gain: osc2.gain, detune: osc2.detune,
        pan: pan2, unison: Math.round(Math.max(1, osc2.unison + voiceUnison.value - 1)),
        blend: osc2.blend, warp: osc2.warp,
      })
      voice.osc2 = v2.mainOsc
      voice.osc2Gain = v2.mainGain
      voice.osc2Panner = v2.panner
      voice.osc2Shaper = v2.shaper
      voice.osc2Blend = v2.blendOsc
      voice.osc2BlendGain = v2.blendGain
      voice.osc2Unison = v2.unisonVoices
      voice.baseFreq2 = v2.freqVal
      voice.baseDetune2 = v2.detune
      v2.output.connect(voice.env)

      if (lfoConnected) lfoGain.connect(voice.osc2.detune)
    }

    if (!legato) {
      voice.env.triggerAttack(now)
    }
  }

  // ── Note Off ──
  function noteOff(midi) {
    if (voiceMode.value === 'MONO' || voiceMode.value === 'LEGATO') {
      if (currentMonoMidi === midi) {
        const voice = noteOnMap[midi]
        if (voice && !voice.released) {
          voice.released = true
          delete noteOnMap[midi]
          try {
            voice.env.triggerRelease()
            setTimeout(() => { if (voice.released) voice.free() }, (adsr.release + 0.1) * 1000)
          } catch (_) {}
        }
        currentMonoMidi = -1
      }
    } else {
      const voice = noteOnMap[midi]
      if (!voice || voice.released) return
      voice.released = true
      delete noteOnMap[midi]
      try {
        voice.env.triggerRelease()
        setTimeout(() => { if (voice.released) voice.free() }, (adsr.release + 0.1) * 1000)
      } catch (_) {}
    }

    heldNotes.value = heldNotes.value.filter(n => n !== midi)
    arpPlayOrder.value = arpPlayOrder.value.filter(n => n !== midi)
    restartArp()
  }

  // ── Arp ──
  function getArpInterval() {
    return Math.max(50, Math.round(60000 / (arpRate.value * 120)))
  }

  function restartArp() {
    stopArp()
    if (arpMode.value === 'OFF' || heldNotes.value.length === 0) return

    arpStep = 0
    arpDirection = 1
    lastArpTime = performance.now()
    arpTimer = setInterval(tickArp, getArpInterval())
  }

  function stopArp() {
    if (arpTimer) { clearInterval(arpTimer); arpTimer = null }
  }

  // Build the play order based on current mode
  function getArpPlayOrder() {
    const notes = heldNotes.value
    if (notes.length === 0) return []
    let order = []
    const range = Math.max(1, Math.round(arpOctaveRange.value))

    for (let oct = 0; oct < range; oct++) {
      const octShift = oct * 12
      switch (arpMode.value) {
        case 'UP':
          order = [...order, ...notes.map(n => n + octShift)]
          break
        case 'DOWN':
          order = [...order, ...[...notes].reverse().map(n => n + octShift)]
          break
        case 'UP/DN': {
          const up = notes.map(n => n + octShift)
          const dn = [...notes].reverse().map(n => n + octShift)
          order = [...order, ...up, ...(oct === range - 1 ? [] : dn)]
          break
        }
        case 'CONVERGE': {
          // Low, high, low+1, high-1, ...
          const sorted = [...notes]
          let lo = 0, hi = sorted.length - 1
          while (lo <= hi) {
            if (lo === hi) { order.push(sorted[lo] + octShift); break }
            order.push(sorted[lo] + octShift)
            order.push(sorted[hi] + octShift)
            lo++; hi--
          }
          break
        }
        case 'DIVERGE': {
          // Middle-out: center, center-1, center+1, ...
          const sorted = [...notes]
          const mid = Math.floor(sorted.length / 2)
          order.push(sorted[mid] + octShift)
          for (let i = 1; i <= mid; i++) {
            if (mid - i >= 0) order.push(sorted[mid - i] + octShift)
            if (mid + i < sorted.length) order.push(sorted[mid + i] + octShift)
          }
          break
        }
        case 'AS PLAYED': {
          order = [...arpPlayOrder.value]
          break
        }
        case 'RAND':
          order = notes.map(n => Math.random())
          break
      }
    }
    return order
  }

  function tickArp() {
    const notes = heldNotes.value
    if (notes.length === 0) { stopArp(); return }

    const intervalMs = getArpInterval()

    // Swing: delay even steps slightly
    const swingMs = (arpStep % 2 === 1) ? intervalMs * arpSwing.value * 0.3 : 0
    const adjustedInterval = intervalMs + swingMs

    // Get current step from step sequencer
    const stepIdx = arpStep % arpSteps.length
    const step = arpSteps[stepIdx]

    // Probability check
    if (step.probability < 1 && Math.random() > step.probability) {
      arpStep++
      arpTimer = setTimeout(() => tickArp(), adjustedInterval)
      return
    }

    // Get note from play order
    const order = getArpPlayOrder()
    if (order.length === 0) { arpStep++; arpTimer = setTimeout(() => tickArp(), adjustedInterval); return }

    const orderIdx = Math.floor(arpStep / arpSteps.length) % order.length
    const baseMidi = order[Math.max(0, Math.min(order.length - 1, orderIdx))]

    if (baseMidi === undefined) { arpStep++; arpTimer = setTimeout(() => tickArp(), adjustedInterval); return }

    // Apply step pitch offset
    const midi = baseMidi + (step.pitchOffset || 0)
    const velocity = step.velocity * 0.7

    if (step.active) {
      const voice = acquireVoice()
      if (voice) {
        startVoice(voice, midi, velocity, false)
        voice.env.triggerAttack(Tone.now())
        // Gate: note length
        const gateMs = Math.max(20, adjustedInterval * Math.max(0.05, arpGate.value))
        setTimeout(() => {
          if (!voice.released) {
            voice.released = true
            delete noteOnMap[voice.midi]
            try { voice.env.triggerRelease() } catch (_) {}
            setTimeout(() => { if (voice.released) voice.free() }, 100)
          }
        }, gateMs)
      }
    }

    arpStep++
    arpTimer = setTimeout(() => tickArp(), adjustedInterval)
  }

  // ── Update Filter 1 ──
  function updateFilter() {
    if (!initialized || !filterNode) return
    filterNode.set({
      type: filterCfg.type,
      frequency: filterCfg.cutoff,
      Q: filterCfg.resonance,
    })
  }

  // ── Update Filter 2 ──
  function updateFilter2() {
    if (!initialized || !filter2Node) return
    filter2Node.set({
      type: filter2Cfg.type,
      frequency: filter2Cfg.cutoff,
      Q: filter2Cfg.resonance,
    })
  }

  // ── Update LFO Routing ──
  function updateLFORouting() {
    if (!initialized || !lfoNode || !lfoGain) return
    lfoNode.type = lfoCfg.type
    lfoNode.frequency.value = lfoCfg.rate
    lfoGain.disconnect()
    if (lfoCfg.amount <= 0) return
    switch (lfoCfg.target) {
      case 'pitch': lfoGain.gain.value = lfoCfg.amount * 50; break
      case 'cutoff': lfoGain.gain.value = lfoCfg.amount * 3000; lfoGain.connect(filterNode.frequency); break
      case 'volume': lfoGain.gain.value = lfoCfg.amount * 0.5; lfoGain.connect(masterGain.gain); break
    }
  }

  // ── Presets ──
  function applyPreset(p) {
    Object.assign(osc1, p.osc1)
    Object.assign(osc2, p.osc2)
    Object.assign(adsr, p.adsr)
    Object.assign(filterCfg, p.filter)
    Object.assign(filter2Cfg, p.filter2 || { ...defaultFilter2 })
    Object.assign(lfoCfg, p.lfo)
    Object.assign(fx, p.fx)
    noiseLevel.value = p.noiseLevel ?? 0
  noiseType.value = p.noiseType || 'white'
    currentPreset.value = p.name
    updateFilter()
    updateFilter2()
    updateLFORouting()
    if (initialized && reverbSend) reverbSend.gain.value = fx.reverb
    if (initialized && delaySend) delaySend.gain.value = fx.delay
    if (initialized && noiseGain) noiseGain.gain.value = noiseLevel.value
  }

  function loadPreset(name) {
    const p = presets.value.find(pr => pr.name === name)
    if (p) applyPreset(p)
  }

  function savePreset(name) {
    const p = {
      name, osc1: { ...osc1 }, osc2: { ...osc2 },
      adsr: { ...adsr }, filter: { ...filterCfg }, filter2: { ...filter2Cfg },
      lfo: { ...lfoCfg }, fx: { ...fx }, noiseLevel: noiseLevel.value, noiseType: noiseType.value,
    }
    const idx = presets.value.findIndex(pr => pr.name === name)
    if (idx >= 0) presets.value[idx] = p
    else presets.value.push(p)
    currentPreset.value = name
    saveCustomPresets(presets.value.filter(pr => !builtInPresets.find(b => b.name === pr.name)))
  }

  function deletePreset(name) {
    if (name === 'Default') return
    const idx = presets.value.findIndex(pr => pr.name === name)
    if (idx >= 0) presets.value.splice(idx, 1)
    saveCustomPresets(presets.value.filter(pr => !builtInPresets.find(b => b.name === pr.name)))
    if (currentPreset.value === name) loadPreset('Default')
  }

  // ── Get Analyser ──
  function getAnalyser() {
    if (!analyser) return null
    return {
      frequencyBinCount: 64,
      getByteFrequencyData(arr) {
        const vals = analyser.getValue()
        for (let i = 0; i < Math.min(arr.length, vals.length); i++) {
          arr[i] = Math.floor(Math.min(vals[i], 1) * 255)
        }
      },
    }
  }

  // ── Dispose ──
  function dispose() {
    stopArp()
    try {
      voices.forEach(v => v.free())
      if (arpTimer) clearTimeout(arpTimer)
      if (lfoNode) { lfoNode.stop(); lfoNode.dispose() }
      if (lfoGain) lfoGain.dispose()
      if (noiseNode) { noiseNode.stop(); noiseNode.dispose() }
      if (noiseGain) noiseGain.dispose()
      if (reverbNode) reverbNode.dispose()
      if (delayNode) delayNode.dispose()
      if (reverbSend) reverbSend.dispose()
      if (delaySend) delaySend.dispose()
      if (analyser && analyser.dispose) analyser.dispose()
      if (filterNode) filterNode.dispose()
      if (filter2Node) filter2Node.dispose()
      if (masterGain) masterGain.dispose()
    } catch (_) {}
    initialized = false
  }

  // ── Apply pitch bend to all active voices ──
  function applyPitchBend(bend) {
    pitchBend.value = bend
    Object.values(noteOnMap).forEach(voice => {
      if (voice && !voice.released) applyPitchBendToVoice(voice, bend)
    })
  }

  // ── Noise type ──
  function setNoiseType(type) {
    noiseType.value = type
    if (!initialized || !noiseNode) return
    try { noiseNode.stop(); noiseNode.dispose() } catch (_) {}
    noiseNode = new Tone.Noise(type)
    if (noiseGain) noiseNode.connect(noiseGain)
    noiseNode.start()
  }

  return {
    osc1, osc2, adsr, filterCfg, filter2Cfg, lfoCfg, fx,
    noiseLevel, noiseType, masterVol, presets, currentPreset,
    isBlackKey,
    // Arp
    arpMode, arpRate, arpGate, arpSwing, arpOctaveRange, arpSteps,
    // Wheels
    pitchBend, modWheel, pitchBendRange,
    // Voicing
    voiceMode, voiceLimit, voiceSpread, voiceUnison,
    init, noteOn, noteOff,
    updateFilter, updateFilter2, updateLFORouting,
    loadPreset, savePreset, deletePreset,
    getAnalyser, dispose,
    applyPitchBend, applyModWheel,
    setNoiseType,
  }
}
