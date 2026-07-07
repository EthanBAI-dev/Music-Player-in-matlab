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

  function getCtx() {
    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioContext.value.state === 'suspended') {
      audioContext.value.resume()
    }
    return audioContext.value
  }

  async function loadFile(file) {
    loadedFileName.value = file.name
    setStatus('Loading...', 'loading')
    try {
      const buf = await file.arrayBuffer()
      const ctx = getCtx()
      const decoded = await ctx.decodeAudioData(buf)
      audioBuffer.value = decoded
      setStatus(`Loaded: ${file.name} (${decoded.duration.toFixed(1)}s, ${decoded.sampleRate} Hz)`, 'ready')
      return decoded
    } catch (err) {
      setStatus('Error loading file', 'error')
      throw err
    }
  }

  function playOriginal(fs) {
    if (!audioBuffer.value) {
      setStatus('Please load an audio file first', 'error')
      return
    }
    stop()
    const ctx = getCtx()
    const src = ctx.createBufferSource()
    src.buffer = audioBuffer.value
    src.connect(ctx.destination)
    src.start(0)
    audioSource.value = src
    isPlaying.value = true
    setStatus('Playing original audio...', 'ready')
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

    stop()
    const ctx = getCtx()
    const buffer = ctx.createBuffer(1, processed.length, fs)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < processed.length; i++) channel[i] = Math.max(-1, Math.min(1, processed[i]))

    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.connect(ctx.destination)
    src.start(0)
    audioSource.value = src
    isPlaying.value = true
    setStatus('Playing equalized audio...', 'ready')
  }

  function stop() {
    if (audioSource.value) {
      try { audioSource.value.stop() } catch (_) { /* ignore */ }
      audioSource.value = null
    }
    isPlaying.value = false
    setStatus('Stopped', 'ready')
  }

  function saveWav() {
    if (!equalizedData.value) {
      setStatus('No equalized data to save', 'error')
      return null
    }
    return equalizedData.value
  }

  function setStatus(text, type) {
    status.value = text
  }

  return {
    audioBuffer, equalizedData, loadedFileName, isPlaying, status,
    loadFile, playOriginal, playEqualized, stop, saveWav, setStatus
  }
}
