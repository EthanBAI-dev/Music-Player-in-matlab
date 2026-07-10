import { ref } from 'vue'
import { processEqualizer } from '../utils/equalizer.js'

// Generate impulse response for reverb
function generateIR(ctx, type, time, earlyReflections) {
  const sampleRate = ctx.sampleRate
  const duration = Math.min(Math.max(time, 0.1), 10)
  const length = Math.floor(sampleRate * duration)
  const buffer = ctx.createBuffer(2, length, sampleRate)

  let params
  switch (type) {
    case 'hall':   params = { decay: 2.5, earlyDensity: 0.6, lateDensity: 0.8, hfDamping: 0.3 }; break
    case 'room':   params = { decay: 8,   earlyDensity: 0.4, lateDensity: 0.5, hfDamping: 0.5 }; break
    case 'church': params = { decay: 1.2, earlyDensity: 0.5, lateDensity: 0.9, hfDamping: 0.2 }; break
    case 'plate':  params = { decay: 4,   earlyDensity: 0.8, lateDensity: 0.95, hfDamping: 0.1 }; break
    case 'chamber':params = { decay: 5,   earlyDensity: 0.5, lateDensity: 0.6, hfDamping: 0.4 }; break
    case 'spring': params = { decay: 3,   earlyDensity: 0.3, lateDensity: 0.4, hfDamping: 0.6 }; break
    default:       params = { decay: 3,   earlyDensity: 0.5, lateDensity: 0.7, hfDamping: 0.3 }
  }
  const decayRate = params.decay * (3 / Math.max(time, 0.1))

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    // Early reflections
    const earlyCount = Math.floor(30 * (earlyReflections || 0.5) * params.earlyDensity)
    for (let i = 0; i < earlyCount; i++) {
      const offset = Math.floor(Math.random() * sampleRate * 0.05)
      if (offset < length) data[offset] += (Math.random() * 2 - 1) * 0.6 * (earlyReflections || 0.5)
    }
    // Late reverb
    let last = 0
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate
      const noise = (Math.random() * 2 - 1) * 0.3
      last = last * params.hfDamping + noise * (1 - params.hfDamping)
      const env = Math.pow(Math.E, -t * decayRate)
      data[i] += last * env * params.lateDensity
    }
  }
  return buffer
}

const EQ_FREQS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

export function useAudio() {
  const audioContext = ref(null)
  const audioBuffer = ref(null)
  const audioSource = ref(null)
  const loadedFileName = ref('')
  const isPlaying = ref(false)
  const status = ref('Ready')
  const analyserNode = ref(null)
  const currentTime = ref(0)
  const duration = ref(0)

  // Recording state
  const isRecording = ref(false)
  const recordingAnalyser = ref(null)
  const recordedBuffers = ref([])
  let mediaRecorder = null
  let recordedChunks = []
  let mediaStream = null
  let recordingSourceNode = null
  let _recordingStartTime = 0
  let _recordingAnimId = null

  // === FX State ===
  const reverbEnabled = ref(false)
  const delayEnabled = ref(false)
  const reverbType = ref('hall')
  const reverbTime = ref(2.0)
  const reverbMix = ref(0.3)
  const reverbEarlyReflections = ref(0.5)
  const delayTimeMs = ref(300)
  const delayFeedback = ref(0.3)
  const delayMix = ref(0.2)
  const delaySync = ref(false)
  const bpm = ref(120)

  // Internal FX nodes
  let _fxInit = false
  let _dryGain = null
  let _reverbNode = null
  let _reverbWet = null
  let _delayNode = null
  let _delayFb = null
  let _delayWet = null

  // Internal EQ nodes (real-time BiquadFilterNode chain)
  let _eqFilters = []
  let _eqInit = false

  function getCtx() {
    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioContext.value.state === 'suspended') {
      audioContext.value.resume()
    }
    return audioContext.value
  }

  function getAnalyser() {
    if (!analyserNode.value) {
      const ctx = getCtx()
      analyserNode.value = ctx.createAnalyser()
      analyserNode.value.fftSize = 2048
    }
    return analyserNode.value
  }

  // ===== Real-time EQ Chain (BiquadFilterNode) =====

  function initEQChain() {
    if (_eqInit) return
    const ctx = getCtx()
    const analyser = getAnalyser()

    // Create 10 peaking filters in series
    const filters = EQ_FREQS.map(freq => {
      const f = ctx.createBiquadFilter()
      f.type = 'peaking'
      f.frequency.value = freq
      f.Q.value = 1.41   // standard Q for 1/3-octave graphic EQ
      f.gain.value = 0   // start at 0dB
      return f
    })

    // Connect in series: filter[0] → filter[1] → ... → filter[9]
    for (let i = 0; i < filters.length - 1; i++) {
      filters[i].connect(filters[i + 1])
    }

    // Last filter connects to analyser
    filters[filters.length - 1].connect(analyser)

    _eqFilters = filters
    _eqInit = true
    console.log('[EQ] initEQChain: 10 BiquadFilterNodes created and connected', _eqFilters.length)
  }

  /** Update a single EQ band in real time */
  function updateEQBand(index, gainDb) {
    if (!_eqFilters[index]) {
      console.warn('[EQ] updateEQBand skipped: no filter at index', index)
      return
    }
    _eqFilters[index].gain.value = gainDb
    console.log('[EQ] updateEQBand: band', index, '→', gainDb.toFixed(1), 'dB')
  }

  /** Apply all 10 EQ gains at once (used when playback starts) */
  function applyEQGains(gains) {
    if (!_eqInit || !_eqFilters.length) {
      console.warn('[EQ] applyEQGains skipped: EQ not initialized')
      return
    }
    for (let i = 0; i < Math.min(gains.length, _eqFilters.length); i++) {
      _eqFilters[i].gain.value = gains[i]
    }
    console.log('[EQ] applyEQGains: applied gains', gains.map(g => g.toFixed(1)).join(','))
  }

  /** Offline FFT-based EQ processing for export/save only */
  function exportEQ(gains, fs) {
    if (!audioBuffer.value) return null
    const channelData = audioBuffer.value.getChannelData(0)
    const signal = new Float64Array(channelData.length)
    for (let i = 0; i < channelData.length; i++) signal[i] = channelData[i]
    return processEqualizer(signal, fs, gains)
  }

  // ===== FX Chain Management =====

  function initFXChain() {
    if (_fxInit) return
    const ctx = getCtx()
    const analyser = getAnalyser()

    _dryGain = ctx.createGain()
    _reverbNode = ctx.createConvolver()
    _reverbWet = ctx.createGain()
    _delayNode = ctx.createDelay(2.0)
    _delayFb = ctx.createGain()
    _delayWet = ctx.createGain()

    // Delay feedback loop
    _delayNode.connect(_delayFb)
    _delayFb.connect(_delayNode)
    _delayNode.connect(_delayWet)

    // Reverb
    _reverbNode.connect(_reverbWet)

    // Disconnect any existing analyser output
    try { analyser.disconnect() } catch (_) {}

    // Permanent connections from analyser
    analyser.connect(_dryGain)
    analyser.connect(_reverbNode)
    analyser.connect(_delayNode)

    // Outputs to destination
    _dryGain.connect(ctx.destination)
    _reverbWet.connect(ctx.destination)
    _delayWet.connect(ctx.destination)

    // Initial values (FX off)
    _dryGain.gain.value = 1.0
    _reverbWet.gain.value = 0
    _delayWet.gain.value = 0
    _delayFb.gain.value = 0
    _delayNode.delayTime.value = 0.3

    // Generate initial impulse response
    updateReverbIR()

    _fxInit = true
  }

  function getDelaySeconds() {
    if (delaySync.value) return 60 / Math.max(bpm.value || 120, 20)
    return Math.max(delayTimeMs.value, 10) / 1000
  }

  function applyFXParams() {
    if (!_fxInit) return
    // Reverb (independent)
    _reverbWet.gain.value = reverbEnabled.value
      ? Math.max(0, Math.min(1, reverbMix.value))
      : 0
    // Delay (independent)
    _delayWet.gain.value = delayEnabled.value
      ? Math.max(0, Math.min(1, delayMix.value))
      : 0
    _delayFb.gain.value = delayEnabled.value
      ? Math.max(0, Math.min(0.9, delayFeedback.value))
      : 0
    _delayNode.delayTime.value = getDelaySeconds()
  }

  function updateReverbIR() {
    if (!_fxInit) return
    const ctx = getCtx()
    _reverbNode.buffer = generateIR(ctx, reverbType.value, reverbTime.value, reverbEarlyReflections.value)
  }

  function toggleReverb(enable) {
    reverbEnabled.value = enable
    applyFXParams()
  }
  function toggleDelay(enable) {
    delayEnabled.value = enable
    applyFXParams()
  }

  // ===== Playback =====

  async function loadFile(file) {
    stop()
    loadedFileName.value = file.name
    status.value = 'Loading...'
    try {
      const buf = await file.arrayBuffer()
      const ctx = getCtx()
      const decoded = await ctx.decodeAudioData(buf)
      audioBuffer.value = decoded
      duration.value = decoded.duration
      status.value = `Loaded: ${file.name}`
      return decoded
    } catch (err) {
      status.value = 'Error loading file'
      throw err
    }
  }

  function playBuffer(buffer, fs) {
    return playBufferFrom(buffer, fs, 0)
  }

  function playBufferFrom(buffer, fs, offset) {
    stop()
    const ctx = getCtx()
    const src = ctx.createBufferSource()
    src.buffer = buffer

    // Initialize EQ chain and FX chain (permanent after first call)
    initEQChain()
    initFXChain()
    applyFXParams()

    // Signal path: source → EQ filters (×10 peaking) → analyser → FX → destination
    src.connect(_eqFilters[0])
    console.log('[EQ] playBufferFrom: source connected to eqFilters[0], playing at offset', offset)

    const seekTime = ctx.currentTime
    src.start(0, offset)
    audioSource.value = src
    isPlaying.value = true
    currentTime.value = offset
    status.value = 'Playing'

    const updateTime = () => {
      if (!isPlaying.value || !audioBuffer.value) return
      currentTime.value = offset + (ctx.currentTime - seekTime)
      if (currentTime.value >= duration.value) {
        stop()
        return
      }
      requestAnimationFrame(updateTime)
    }
    updateTime()
  }

  function playOriginal(fs) {
    if (!audioBuffer.value) {
      status.value = 'Please load an audio file first'
      return
    }
    playBuffer(audioBuffer.value, fs)
    status.value = 'Playing'
  }

  function playNoise() {
    stop()
    const ctx = getCtx()
    // Ensure context is running (needed if context was created from non-gesture path)
    if (ctx.state === 'suspended') ctx.resume()
    const fs = ctx.sampleRate
    const dur = 15  // seconds of noise
    const length = fs * dur
    const buffer = ctx.createBuffer(1, length, fs)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1
    }
    audioBuffer.value = buffer
    loadedFileName.value = 'White Noise'
    duration.value = dur
    playBufferFrom(buffer, fs, 0)
    status.value = 'White Noise'
    console.log('[Noise] White noise playing, isPlaying=', isPlaying.value, 'ctx.state=', ctx.state)
  }

  function stop() {
    if (audioSource.value) {
      try { audioSource.value.stop() } catch (_) { /* ignore */ }
      audioSource.value = null
    }
    isPlaying.value = false
    currentTime.value = 0
    status.value = 'Stopped'
  }

  function seek(time) {
    if (!audioBuffer.value) return
    const fs = audioBuffer.value.sampleRate
    playBufferFrom(audioBuffer.value, fs, time)
  }

  // === Recording ===

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStream = stream
      const ctx = getCtx()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      recordingSourceNode = source
      recordingAnalyser.value = analyser

      recordedChunks = []
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus' : 'audio/webm'
      mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data) }
      mediaRecorder.onstop = () => _onRecordingComplete()
      mediaRecorder.start()
      isRecording.value = true
      _recordingStartTime = ctx.currentTime
      status.value = 'Recording...'
    } catch (err) {
      status.value = 'Microphone access denied'
      throw err
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
    isRecording.value = false
    if (_recordingAnimId) { cancelAnimationFrame(_recordingAnimId); _recordingAnimId = null }
    if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null }
    recordingSourceNode = null
  }

  async function _onRecordingComplete() {
    const blob = new Blob(recordedChunks, { type: 'audio/webm' })
    try {
      const ctx = getCtx()
      const arrayBuffer = await blob.arrayBuffer()
      const decoded = await ctx.decodeAudioData(arrayBuffer)
      const count = recordedBuffers.value.length + 1
      recordedBuffers.value.push({ name: `Recording ${count}`, buffer: decoded, sampleRate: decoded.sampleRate, duration: decoded.duration })
      status.value = `Saved: Recording ${count}`
    } catch (_) { status.value = 'Failed to decode recording' }
    recordedChunks = []
    recordingAnalyser.value = null
  }

  function loadRecorded(index) {
    const rec = recordedBuffers.value[index]
    if (!rec) return
    stop()
    audioBuffer.value = rec.buffer
    duration.value = rec.duration
    loadedFileName.value = rec.name
    status.value = `Loaded: ${rec.name}`
  }

  function setStatus(text) { status.value = text }

  return {
    audioBuffer, loadedFileName, isPlaying,
    status, analyserNode, currentTime, duration,
    isRecording, recordingAnalyser, recordedBuffers,
    loadFile, playOriginal, playNoise, playBufferFrom, stop, seek, setStatus,
    startRecording, stopRecording, loadRecorded,
    // Real-time EQ
    updateEQBand, applyEQGains, exportEQ,
    // FX
    reverbEnabled, delayEnabled, reverbType, reverbTime, reverbMix, reverbEarlyReflections,
    delayTimeMs, delayFeedback, delayMix, delaySync, bpm,
    toggleReverb, toggleDelay, applyFXParams, updateReverbIR
  }
}
