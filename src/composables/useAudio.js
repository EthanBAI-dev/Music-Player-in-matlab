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

export function useAudio() {
  const audioContext = ref(null)
  const audioBuffer = ref(null)
  const audioSource = ref(null)
  const equalizedData = ref(null)
  const loadedFileName = ref('')
  const isPlaying = ref(false)
  const isEQMode = ref(false)
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
  const fxEnabled = ref(false)
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
    if (fxEnabled.value) {
      _reverbWet.gain.value = Math.max(0, Math.min(1, reverbMix.value))
      _delayWet.gain.value = Math.max(0, Math.min(1, delayMix.value))
      _delayFb.gain.value = Math.max(0, Math.min(0.9, delayFeedback.value))
      _delayNode.delayTime.value = getDelaySeconds()
    } else {
      _reverbWet.gain.value = 0
      _delayWet.gain.value = 0
      _delayFb.gain.value = 0
    }
  }

  function updateReverbIR() {
    if (!_fxInit) return
    const ctx = getCtx()
    _reverbNode.buffer = generateIR(ctx, reverbType.value, reverbTime.value, reverbEarlyReflections.value)
  }

  function toggleFX(enable) {
    fxEnabled.value = enable
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
      isEQMode.value = false
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
    const analyser = getAnalyser()
    src.connect(analyser)
    // Set up FX chain (permanent after first call)
    initFXChain()
    applyFXParams()
    const seekTime = ctx.currentTime
    src.start(0, offset)
    audioSource.value = src
    isPlaying.value = true
    currentTime.value = offset

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
    isEQMode.value = false
    playBuffer(audioBuffer.value, fs)
    status.value = 'Playing'
  }

  function playEqualized(fs, gains) {
    if (!audioBuffer.value) {
      status.value = 'Please load an audio file first'
      return
    }
    isEQMode.value = true
    const processed = _processEQ(gains, fs)
    const ctx = getCtx()
    const buffer = ctx.createBuffer(1, processed.length, fs)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < processed.length; i++) channel[i] = Math.max(-1, Math.min(1, processed[i]))
    playBuffer(buffer, fs)
    status.value = 'Playing (EQ)'
  }

  function updateEQ(gains, fs, fromTime) {
    if (!audioBuffer.value) return
    const processed = _processEQ(gains, fs)
    const ctx = getCtx()
    const buffer = ctx.createBuffer(1, processed.length, fs)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < processed.length; i++) channel[i] = Math.max(-1, Math.min(1, processed[i]))
    playBufferFrom(buffer, fs, fromTime || 0)
  }

  function seekEQ(time, fs, gains) {
    if (!audioBuffer.value) return
    isEQMode.value = true
    const processed = _processEQ(gains, fs)
    const ctx = getCtx()
    const buffer = ctx.createBuffer(1, processed.length, fs)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < processed.length; i++) channel[i] = Math.max(-1, Math.min(1, processed[i]))
    playBufferFrom(buffer, fs, time)
  }

  function _processEQ(gains, fs) {
    const channelData = audioBuffer.value.getChannelData(0)
    const signal = new Float64Array(channelData.length)
    for (let i = 0; i < channelData.length; i++) signal[i] = channelData[i]
    const processed = processEqualizer(signal, fs, gains)
    equalizedData.value = processed
    return processed
  }

  function stop() {
    if (audioSource.value) {
      try { audioSource.value.stop() } catch (_) { /* ignore */ }
      audioSource.value = null
    }
    isPlaying.value = false
    isEQMode.value = false
    currentTime.value = 0
    status.value = 'Stopped'
  }

  function saveWav() {
    if (!equalizedData.value) {
      status.value = 'No equalized data to save'
      return null
    }
    return equalizedData.value
  }

  function seek(time) {
    if (!audioBuffer.value) return
    if (isEQMode.value) return
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
    isEQMode.value = false
    status.value = `Loaded: ${rec.name}`
  }

  function setStatus(text) { status.value = text }

  return {
    audioBuffer, equalizedData, loadedFileName, isPlaying, isEQMode,
    status, analyserNode, currentTime, duration,
    isRecording, recordingAnalyser, recordedBuffers,
    loadFile, playOriginal, playEqualized, updateEQ, seekEQ,
    playBufferFrom, stop, saveWav, seek, setStatus,
    startRecording, stopRecording, loadRecorded,
    // FX
    fxEnabled, reverbType, reverbTime, reverbMix, reverbEarlyReflections,
    delayTimeMs, delayFeedback, delayMix, delaySync, bpm,
    toggleFX, applyFXParams, updateReverbIR
  }
}
