import { ref, reactive, shallowRef } from 'vue'

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

export function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12) }
export function midiToName(m) { return NOTE_NAMES[m % 12] + Math.floor(m / 12 - 1) }

const MAX_VOICES = 16

export function useSynth() {
  let ctx = null
  let masterGain = null
  let filterNode = null
  let filterEnv = null
  let analyser = null
  let reverbNode = null
  let delayNode = null
  let lfoNode = null
  let lfoGain = null

  // Voice pool
  let voices = []
  let noteOnMap = {}
  let midiOffset = 48 // C3
  let initialized = false

  // ---- Reactive state ----
  const osc1 = reactive({ type: 'sine', gain: 0.5, detune: 0, octave: 0, active: true })
  const osc2 = reactive({ type: 'sawtooth', gain: 0.3, detune: 7, octave: -1, active: true })
  const noiseLevel = ref(0)

  const adsr = reactive({ attack: 0.02, decay: 0.15, sustain: 0.6, release: 0.4 })
  const filterAdsr = reactive({ attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3 })

  const filterCfg = reactive({
    type: 'lowpass', cutoff: 12000, resonance: 0.3, envAmt: 0, keyTrack: 0
  })

  const lfoCfg = reactive({
    type: 'sine', rate: 4, amount: 0, target: 'pitch'
  })

  const fx = reactive({
    reverb: 0.15, delay: 0.12, feedback: 0.25
  })

  const masterVol = ref(0.75)
  const activeNotes = ref([])

  // Presets
  const presets = ref([
    { name: 'Warm Pad', osc1: { type: 'sawtooth', gain:0.4, detune:5, octave:0, active:true }, osc2: { type: 'sawtooth', gain:0.3, detune:-5, octave:-1, active:true }, noiseLevel: 0, adsr: { attack:0.3, decay:0.4, sustain:0.7, release:1.2 }, filterAdsr: { attack:0.2, decay:0.3, sustain:0.5, release:0.5 }, filterCfg: { type:'lowpass', cutoff:3000, resonance:0.2, envAmt:0.3, keyTrack:0 }, lfoCfg: { type:'sine', rate:3, amount:0.15, target:'cutoff' }, fx: { reverb:0.4, delay:0.2, feedback:0.3 } },
    { name: 'Lead', osc1: { type: 'square', gain:0.5, detune:0, octave:0, active:true }, osc2: { type: 'square', gain:0.2, detune:12, octave:0, active:true }, noiseLevel: 0, adsr: { attack:0.01, decay:0.1, sustain:0.8, release:0.2 }, filterAdsr: { attack:0.01, decay:0.1, sustain:0.8, release:0.1 }, filterCfg: { type:'lowpass', cutoff:8000, resonance:0.1, envAmt:0, keyTrack:0 }, lfoCfg: { type:'sine', rate:6, amount:0.02, target:'pitch' }, fx: { reverb:0.05, delay:0.05, feedback:0.1 } },
    { name: 'Bass', osc1: { type: 'sawtooth', gain:0.6, detune:-2, octave:-1, active:true }, osc2: { type: 'square', gain:0.25, detune:2, octave:-1, active:true }, noiseLevel: 0.02, adsr: { attack:0.005, decay:0.3, sustain:0.4, release:0.3 }, filterAdsr: { attack:0.005, decay:0.2, sustain:0.4, release:0.2 }, filterCfg: { type:'lowpass', cutoff:800, resonance:0.4, envAmt:0.5, keyTrack:0.3 }, lfoCfg: { type:'sine', rate:5, amount:0.1, target:'cutoff' }, fx: { reverb:0.02, delay:0.01, feedback:0 } },
    { name: 'Pluck', osc1: { type: 'triangle', gain:0.5, detune:0, octave:0, active:true }, osc2: { type: 'sine', gain:0.2, detune:24, octave:0, active:true }, noiseLevel: 0.05, adsr: { attack:0.001, decay:0.3, sustain:0, release:0.1 }, filterAdsr: { attack:0.001, decay:0.15, sustain:0, release:0.05 }, filterCfg: { type:'lowpass', cutoff:12000, resonance:0.2, envAmt:0, keyTrack:0 }, lfoCfg: { type:'sine', rate:4, amount:0, target:'pitch' }, fx: { reverb:0.1, delay:0.08, feedback:0.15 } },
    { name: 'Default', osc1: { type:'sine', gain:0.5, detune:0, octave:0, active:true }, osc2: { type:'sawtooth', gain:0.3, detune:7, octave:-1, active:true }, noiseLevel:0, adsr: { attack:0.02, decay:0.15, sustain:0.6, release:0.4 }, filterAdsr: { attack:0.01, decay:0.2, sustain:0.3, release:0.3 }, filterCfg: { type:'lowpass', cutoff:12000, resonance:0.3, envAmt:0, keyTrack:0 }, lfoCfg: { type:'sine', rate:4, amount:0, target:'pitch' }, fx: { reverb:0.15, delay:0.12, feedback:0.25 } },
  ])

  const currentPreset = ref('Default')

  // ---- Voice ----
  class Voice {
    constructor() {
      this.midi = -1
      this.released = true
      this.nodes = []
      this.envGain = null
      this.filterEnvGain = null
      this.oscGains = []
    }
    free() {
      this.nodes.forEach(n => { try { n.disconnect(); if (n.stop) try { n.stop() } catch(_){} } catch(_){} })
      this.nodes = []
      this.oscGains = []
      this.envGain = null
      this.filterEnvGain = null
      this.midi = -1
      this.released = true
    }
  }

  // ---- Init ----
  function init() {
    if (initialized) return
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()

    // Master
    masterGain = ctx.createGain()
    masterGain.gain.value = masterVol.value

    // Analyser
    analyser = ctx.createAnalyser()
    analyser.fftSize = 2048

    // Filter
    filterNode = ctx.createBiquadFilter()
    filterNode.type = filterCfg.type
    filterNode.frequency.value = filterCfg.cutoff || 12000
    filterNode.Q.value = filterCfg.resonance || 0.3

    // Filter envelope (pass-through gain node for filter modulation)
    filterEnv = ctx.createGain()
    filterEnv.gain.value = 1

    // Effects
    // Reverb: simple convolver with generated impulse response
    reverbNode = ctx.createConvolver()
    reverbNode.buffer = createImpulseResponse(ctx, 2, 2)

    delayNode = ctx.createDelay(2)
    delayNode.delayTime.value = 0.3
    const delayGain = ctx.createGain()
    delayGain.gain.value = 0.3
    const delayFeedback = ctx.createGain()
    delayFeedback.gain.value = 0.25

    // LFO
    lfoNode = ctx.createOscillator()
    lfoNode.type = lfoCfg.type
    lfoNode.frequency.value = lfoCfg.rate
    lfoGain = ctx.createGain()
    lfoGain.gain.value = lfoCfg.amount
    lfoNode.connect(lfoGain)
    lfoNode.start()

    // Connect chain: voices → filter → filterEnv → master → analyser → destination
    filterNode.connect(filterEnv)
    filterEnv.connect(masterGain)
    masterGain.connect(analyser)
    analyser.connect(ctx.destination)

    // Effects send
    const fxSend = ctx.createGain()
    fxSend.gain.value = 0.3
    masterGain.connect(fxSend)
    fxSend.connect(reverbNode)
    reverbNode.connect(ctx.destination)
    fxSend.connect(delayNode)
    delayNode.connect(delayGain)
    delayGain.connect(ctx.destination)
    delayGain.connect(delayFeedback)
    delayFeedback.connect(delayNode)

    // Create voice pool
    for (let i = 0; i < MAX_VOICES; i++) voices.push(new Voice())

    // LFO routing
    setupLFOModulation()

    updateFilter()
    updateFX()
    initialized = true
  }

  function createImpulseResponse(audioCtx, duration, decay) {
    const len = audioCtx.sampleRate * duration
    const buf = audioCtx.createBuffer(2, len, audioCtx.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch)
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
      }
    }
    return buf
  }

  let lfoModGains = {}

  function setupLFOModulation() {
    lfoModGains = {
      pitch: ctx.createGain(),
      cutoff: ctx.createGain(),
      gain: ctx.createGain(),
    }
    lfoNode.disconnect()
    lfoNode.connect(lfoGain)
    // Default: pitch modulation (vibrato)
    lfoGain.connect(lfoModGains.pitch)
    lfoModGains.pitch.gain.value = 0
    lfoModGains.pitch.connect(masterGain) // dummy connection to keep node alive
  }

  function updateLFORouting() {
    // Disconnect old
    Object.values(lfoModGains).forEach(g => { try { g.disconnect() } catch(_){} })
    lfoGain.disconnect()
    lfoNode.disconnect()
    lfoNode.connect(lfoGain)

    const target = lfoCfg.target
    if (target === 'pitch') {
      lfoGain.connect(lfoModGains.pitch)
      lfoModGains.pitch.gain.value = lfoCfg.amount * 50
    } else if (target === 'cutoff') {
      lfoGain.connect(lfoModGains.cutoff)
      lfoModGains.cutoff.gain.value = lfoCfg.amount * 3000
      lfoModGains.cutoff.connect(filterNode.frequency)
    } else if (target === 'volume') {
      lfoGain.connect(lfoModGains.gain)
      lfoModGains.gain.gain.value = lfoCfg.amount * 0.3
      lfoModGains.gain.connect(masterGain.gain)
    }
  }

  // ---- Voice management ----
  function acquireVoice() {
    // Find released voice
    let v = voices.find(v => v.released)
    if (v) return v
    // Steal oldest
    v = voices.reduce((a, b) => a.midi < b.midi ? a : b)
    v.free()
    return v
  }

  function noteOn(midi, velocity = 0.8) {
    if (!initialized) init()
    const voice = acquireVoice()
    if (!voice) return
    voice.free()
    voice.midi = midi
    voice.released = false

    const freq = midiToFreq(midi)
    const now = ctx.currentTime
    const v = Math.min(1, Math.max(0, velocity))

    // Per-voice gain envelope
    const envGain = ctx.createGain()
    envGain.gain.value = 0
    voice.envGain = envGain

    // Start attack
    envGain.gain.setValueAtTime(0, now)
    envGain.gain.linearRampToValueAtTime(v, now + adsr.attack)

    const sustainStart = now + adsr.attack
    const decayEnd = sustainStart + adsr.decay
    envGain.gain.linearRampToValueAtTime(adsr.sustain * v, decayEnd)

    // Filter envelope
    const fEnvGain = ctx.createGain()
    fEnvGain.gain.value = 0
    voice.filterEnvGain = fEnvGain
    fEnvGain.gain.setValueAtTime(0, now)
    fEnvGain.gain.linearRampToValueAtTime(filterAdsr.attack > 0.001 ? 1 : 0, now + filterAdsr.attack)
    const fDecayEnd = now + filterAdsr.attack + filterAdsr.decay
    fEnvGain.gain.linearRampToValueAtTime(filterAdsr.sustain, fDecayEnd)
    fEnvGain.connect(filterNode.frequency)

    // Create oscillators
    const oscConfigs = [
      { ...osc1, active: osc1.active },
      { ...osc2, active: osc2.active }
    ]

    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0

    oscConfigs.forEach((cfg, idx) => {
      if (!cfg.active) return
      const osc = ctx.createOscillator()
      osc.type = cfg.type
      const oct = Math.pow(2, cfg.octave || 0)
      osc.frequency.value = freq * oct
      osc.detune.value = cfg.detune || 0

      const g = ctx.createGain()
      g.gain.value = cfg.gain || 0.3
      osc.connect(g)
      g.connect(envGain)
      osc.start(now)
      voice.nodes.push(osc, g)
      voice.oscGains.push(g)

      // Connect LFO pitch modulation
      if (lfoCfg.target === 'pitch' && lfoCfg.amount > 0) {
        lfoGain.connect(osc.frequency)
      }
    })

    // Noise
    if (noiseLevel.value > 0) {
      const bufSize = ctx.sampleRate
      const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
      const d = noiseBuf.getChannelData(0)
      for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1
      const noiseSrc = ctx.createBufferSource()
      noiseSrc.buffer = noiseBuf
      noiseSrc.loop = true
      const ng = ctx.createGain()
      ng.gain.value = noiseLevel.value * 0.5
      noiseSrc.connect(ng)
      ng.connect(envGain)
      noiseSrc.start(now)
      voice.nodes.push(noiseSrc, ng)
    }

    // Route to filter
    envGain.connect(filterNode)

    // Update active notes
    noteOnMap[midi] = voice
    updateActiveNotes()
  }

  function noteOff(midi) {
    const voice = noteOnMap[midi]
    if (!voice || voice.released) return
    voice.released = true
    const now = ctx.currentTime

    if (voice.envGain) {
      const currentGain = voice.envGain.gain.value || 0
      voice.envGain.gain.cancelScheduledValues(now)
      voice.envGain.gain.setValueAtTime(currentGain, now)
      voice.envGain.gain.linearRampToValueAtTime(0, now + adsr.release)
    }
    if (voice.filterEnvGain) {
      const fCurr = voice.filterEnvGain.gain.value || 0
      voice.filterEnvGain.gain.cancelScheduledValues(now)
      voice.filterEnvGain.gain.setValueAtTime(fCurr, now)
      voice.filterEnvGain.gain.linearRampToValueAtTime(0, now + filterAdsr.release)
    }

    // Schedule cleanup
    const cleanupTime = (now + Math.max(adsr.release, filterAdsr.release) + 0.1) * 1000
    setTimeout(() => {
      voice.free()
      updateActiveNotes()
    }, cleanupTime - now * 1000 + 50)

    delete noteOnMap[midi]
    updateActiveNotes()
  }

  function updateActiveNotes() {
    activeNotes.value = voices
      .filter(v => !v.released && v.midi >= 0)
      .map(v => ({ midi: v.midi, name: midiToName(v.midi) }))
  }

  // ---- Updates ----
  function updateFilter() {
    if (!filterNode) return
    filterNode.type = filterCfg.type
    filterNode.frequency.setTargetAtTime(filterCfg.cutoff, ctx.currentTime, 0.02)
    filterNode.Q.setTargetAtTime(filterCfg.resonance, ctx.currentTime, 0.02)
  }

  function updateFX() {
    if (!initialized) return
    // Update via setters
  }

  function loadPreset(name) {
    const p = presets.value.find(p => p.name === name)
    if (!p) return
    Object.assign(osc1, p.osc1)
    Object.assign(osc2, p.osc2)
    noiseLevel.value = p.noiseLevel || 0
    Object.assign(adsr, p.adsr)
    Object.assign(filterAdsr, p.filterAdsr)
    Object.assign(filterCfg, p.filterCfg)
    Object.assign(lfoCfg, p.lfoCfg)
    Object.assign(fx, p.fx)
    currentPreset.value = name
    updateFilter()
    if (initialized) updateLFORouting()
  }

  function savePreset(name) {
    const existing = presets.value.find(p => p.name === name)
    const data = {
      name,
      osc1: { ...osc1 }, osc2: { ...osc2 }, noiseLevel: noiseLevel.value,
      adsr: { ...adsr }, filterAdsr: { ...filterAdsr },
      filterCfg: { ...filterCfg }, lfoCfg: { ...lfoCfg },
      fx: { ...fx }
    }
    if (existing) Object.assign(existing, data)
    else presets.value.push(data)
    currentPreset.value = name
  }

  function deletePreset(name) {
    if (name === 'Default') return
    presets.value = presets.value.filter(p => p.name !== name)
    if (currentPreset.value === name) loadPreset('Default')
  }

  // ---- Keyboard helpers ----
  function getNoteRange() {
    const start = 48 // C3
    const end = 72 // C5
    const keys = []
    for (let m = start; m <= end; m++) {
      keys.push({ midi: m, name: midiToName(m) })
    }
    return keys
  }

  function getWhiteKeyIndex(midi) {
    let count = 0
    const start = 48
    for (let m = start; m < midi; m++) {
      if (!isBlackKey(m)) count++
    }
    return count
  }

  function isBlackKey(midi) {
    const n = midi % 12
    return [1, 3, 6, 8, 10].includes(n)
  }

  // Cleanup
  function dispose() {
    voices.forEach(v => v.free())
    if (lfoNode) { try { lfoNode.stop() } catch(_){} }
    if (ctx) ctx.close()
    initialized = false
  }

  return {
    osc1, osc2, noiseLevel, adsr, filterAdsr, filterCfg, lfoCfg, fx, masterVol,
    activeNotes, presets, currentPreset,
    init, noteOn, noteOff, getNoteRange, getWhiteKeyIndex, isBlackKey,
    updateFilter, updateFX, updateLFORouting,
    loadPreset, savePreset, deletePreset, dispose,
    getAnalyser: () => analyser,
    getAudioContext: () => ctx,
  }
}
