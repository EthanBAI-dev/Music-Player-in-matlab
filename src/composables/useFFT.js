import { ref, computed, watch } from 'vue'
import { FFTCore } from '../utils/fft-core.js'
import { generateSignal } from '../utils/signal-generator.js'

export function useFFT() {
  const signalType = ref('sine')
  const frequency = ref(100)
  const amplitude = ref(1)
  const phase = ref(0)
  const sampleRate = ref(2048)
  const fftSize = ref(2048)

  const signal = ref(new Float64Array(0))
  const timeLabels = ref([])
  const freqLabels = ref([])
  const timeData = ref([])
  const freqData = ref([])
  const peakFreq = ref('--')
  const statsInfo = ref('N: 2048 | Fs: 2048 Hz')

  function compute() {
    const fs = sampleRate.value
    const size = fftSize.value
    const duration = size / fs

    const sig = generateSignal(signalType.value, frequency.value, amplitude.value, phase.value, fs, duration)
    signal.value = sig

    // Time domain (max 512 points)
    const maxPoints = Math.min(sig.length, 512)
    const step = Math.max(1, Math.floor(sig.length / maxPoints))
    const tLabels = []
    const tData = []
    for (let i = 0; i < sig.length; i += step) {
      tLabels.push((i / fs).toFixed(4))
      tData.push(sig[i])
    }
    timeLabels.value = tLabels
    timeData.value = tData

    // Frequency domain
    const fftResult = FFTCore.fft(sig.slice(0, size))
    const spectrum = FFTCore.singleSidedSpectrum(fftResult.magnitude, fs)

    const maxBins = Math.min(spectrum.frequency.length, 512)
    const fLabels = []
    const fData = []
    for (let i = 0; i < maxBins; i++) {
      fLabels.push(spectrum.frequency[i].toFixed(1))
      fData.push(spectrum.magnitude[i])
    }
    freqLabels.value = fLabels
    freqData.value = fData

    peakFreq.value = FFTCore.findPeak(spectrum).toFixed(1) + ' Hz'
    statsInfo.value = `N: ${size} | Fs: ${fs} Hz`
  }

  function reset() {
    signalType.value = 'sine'
    frequency.value = 100
    amplitude.value = 1
    phase.value = 0
    sampleRate.value = 2048
    fftSize.value = 2048
    compute()
  }

  return {
    signalType, frequency, amplitude, phase, sampleRate, fftSize,
    signal, timeLabels, timeData, freqLabels, freqData,
    peakFreq, statsInfo,
    compute, reset
  }
}
