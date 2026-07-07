import { FFTCore } from './fft-core.js'

export const EQ_BANDS = [
  { name: '31',  low: 0,     high: 31 },
  { name: '62',  low: 31,    high: 62 },
  { name: '125', low: 62,    high: 125 },
  { name: '250', low: 125,   high: 250 },
  { name: '500', low: 250,   high: 500 },
  { name: '1k',  low: 500,   high: 1000 },
  { name: '2k',  low: 1000,  high: 2000 },
  { name: '4k',  low: 2000,  high: 4000 },
  { name: '8k',  low: 4000,  high: 8000 },
  { name: '16k', low: 8000,  high: 16000 }
]

export function processEqualizer(signal, fs, gains) {
  const N = signal.length
  let workSignal = signal
  if (N & (N - 1)) {
    const nextPow2 = 1 << Math.ceil(Math.log2(N))
    const padded = new Float64Array(nextPow2)
    padded.set(signal)
    workSignal = padded
  }

  const fftResult = FFTCore.fft(workSignal)
  const fftN = fftResult.real.length
  const real = [...fftResult.real]
  const imag = [...fftResult.imag]

  for (let i = 0; i < fftN; i++) {
    const freqHz = (i <= fftN / 2) ? i * fs / fftN : (fftN - i) * fs / fftN
    let gainFactor = 1
    for (let b = 0; b < EQ_BANDS.length; b++) {
      const band = EQ_BANDS[b]
      if (freqHz >= band.low && freqHz < band.high) {
        gainFactor = Math.exp(gains[b] / 20)
        break
      }
    }
    real[i] *= gainFactor
    imag[i] *= gainFactor
  }

  const output = FFTCore.ifft({ real, imag })
  return output.slice(0, N)
}
