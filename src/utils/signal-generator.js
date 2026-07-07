function sine(t, freq, amp, phase) {
  return amp * Math.sin(2 * Math.PI * freq * t + phase)
}

function square(t, freq, amp, phase) {
  return amp * Math.sign(Math.sin(2 * Math.PI * freq * t + phase))
}

function triangle(t, freq, amp, phase) {
  const p = (freq * t + phase / (2 * Math.PI)) % 1
  return amp * (4 * Math.abs(p - 0.5) - 1)
}

function sawtooth(t, freq, amp, phase) {
  const p = (freq * t + phase / (2 * Math.PI)) % 1
  return amp * (2 * p - 1)
}

const generators = { sine, square, triangle, sawtooth }

export function generateSignal(type, freq, amp, phaseDeg, fs, duration) {
  const N = Math.floor(fs * duration)
  const signal = new Float64Array(N)
  const phaseRad = (phaseDeg || 0) * Math.PI / 180
  const gen = generators[type] || generators.sine
  for (let i = 0; i < N; i++) {
    signal[i] = gen(i / fs, freq, amp, phaseRad)
  }
  return signal
}
