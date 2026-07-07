import * as math from 'mathjs'

export class FFTCore {
  static fft(signal) {
    const N = signal.length
    if (N & (N - 1)) throw new Error('FFT size must be power of 2')
    const complex = Array.from(signal, x => math.complex(x, 0))
    const result = math.fft(complex)
    const real = new Float64Array(N)
    const imag = new Float64Array(N)
    const magnitude = new Float64Array(N)
    const phase = new Float64Array(N)
    for (let i = 0; i < N; i++) {
      const c = result[i]
      real[i] = math.re(c)
      imag[i] = math.im(c)
      magnitude[i] = math.abs(c)
      phase[i] = math.atan2(math.im(c), math.re(c))
    }
    return { real, imag, magnitude, phase }
  }

  static ifft(freqData) {
    const N = freqData.real.length
    const complex = []
    for (let i = 0; i < N; i++) {
      complex.push(math.complex(freqData.real[i], freqData.imag[i]))
    }
    const result = math.ifft(complex)
    const signal = new Float64Array(N)
    for (let i = 0; i < N; i++) {
      signal[i] = math.re(result[i])
    }
    return signal
  }

  static singleSidedSpectrum(magnitude, fs) {
    const N = magnitude.length
    const halfN = Math.floor(N / 2)
    const mag = new Float64Array(halfN)
    const freq = new Float64Array(halfN)
    for (let i = 0; i < halfN; i++) {
      mag[i] = (i === 0) ? magnitude[0] / N : magnitude[i] * 2 / N
      freq[i] = i * fs / N
    }
    return { magnitude: mag, frequency: freq }
  }

  static findPeak(spectrum) {
    let maxIdx = 0
    for (let i = 1; i < spectrum.magnitude.length; i++) {
      if (spectrum.magnitude[i] > spectrum.magnitude[maxIdx]) maxIdx = i
    }
    return spectrum.frequency[maxIdx]
  }
}
