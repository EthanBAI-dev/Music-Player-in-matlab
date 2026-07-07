import { ref } from 'vue'
import { processEqualizer } from '../utils/equalizer.js'

export function useAudio() {
  const audioContext = ref(null)
  const audioBuffer = ref(null)
  const audioSource = ref(null)
  const equalizedData = ref(null)
  const loadedFileName = ref('')
  const isPlaying = ref(false)
  const status = ref('Ready')
  const analyserNode = ref(null)
  const currentTime = ref(0)
  const duration = ref(0)

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

  async function loadFile(file) {
    loadedFileName.value = file.name
    setStatus('Loading...', 'loading')
    try {
      const buf = await file.arrayBuffer()
      const ctx = getCtx()
      const decoded = await ctx.decodeAudioData(buf)
      audioBuffer.value = decoded
      duration.value = decoded.duration
      setStatus(`Loaded: ${file.name}`, 'ready')
      return decoded
    } catch (err) {
      setStatus('Error loading file', 'error')
      throw err
    }
  }

  function playBuffer(buffer, fs) {
    stop()
    const ctx = getCtx()
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const analyser = getAnalyser()
    src.connect(analyser)
    analyser.connect(ctx.destination)
    src.start(0)
    audioSource.value = src
    isPlaying.value = true

    // Track playback position
    const startTime = ctx.currentTime
    const updateTime = () => {
      if (isPlaying.value && audioBuffer.value) {
        currentTime.value = ctx.currentTime - startTime
        if (currentTime.value >= duration.value) {
          stop()
          return
        }
        requestAnimationFrame(updateTime)
      }
    }
    updateTime()
  }

  function playOriginal(fs) {
    if (!audioBuffer.value) {
      setStatus('Please load an audio file first', 'error')
      return
    }
    playBuffer(audioBuffer.value, fs)
    setStatus('Playing', 'ready')
  }

  function playEqualized(fs, gains) {
    if (!audioBuffer.value) {
      setStatus('Please load an audio file first', 'error')
      return
    }
    setStatus('Applying equalization...', 'loading')
    const channelData = audioBuffer.value.getChannelData(0)
    const signal = new Float64Array(channelData.length)
    for (let i = 0; i < channelData.length; i++) signal[i] = channelData[i]

    const processed = processEqualizer(signal, fs, gains)
    equalizedData.value = processed

    const ctx = getCtx()
    const buffer = ctx.createBuffer(1, processed.length, fs)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < processed.length; i++) channel[i] = Math.max(-1, Math.min(1, processed[i]))

    playBuffer(buffer, fs)
    setStatus('Playing (EQ)', 'ready')
  }

  function stop() {
    if (audioSource.value) {
      try { audioSource.value.stop() } catch (_) { /* ignore */ }
      audioSource.value = null
    }
    isPlaying.value = false
    currentTime.value = 0
    setStatus('Stopped', 'ready')
  }

  function saveWav() {
    if (!equalizedData.value) {
      setStatus('No equalized data to save', 'error')
      return null
    }
    return equalizedData.value
  }

  function seek(time) {
    if (!audioBuffer.value) return
    const fs = audioBuffer.value.sampleRate
    stop()
    const ctx = getCtx()
    const src = ctx.createBufferSource()
    src.buffer = audioBuffer.value
    const analyser = getAnalyser()
    src.connect(analyser)
    analyser.connect(ctx.destination)
    src.start(0, time)
    audioSource.value = src
    isPlaying.value = true
    currentTime.value = time

    const updateTime = () => {
      if (isPlaying.value && audioBuffer.value) {
        currentTime.value = ctx.currentTime - (audioSource.value ? time : 0)
        if (currentTime.value >= duration.value) {
          stop()
          return
        }
        requestAnimationFrame(updateTime)
      }
    }
    updateTime()
  }

  function setStatus(text, type) {
    status.value = text
  }

  return {
    audioBuffer, equalizedData, loadedFileName, isPlaying, status,
    analyserNode, currentTime, duration,
    loadFile, playOriginal, playEqualized, stop, saveWav, seek, setStatus
  }
}
