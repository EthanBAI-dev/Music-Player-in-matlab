<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4" style="background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);" @click.self="$emit('close')">
    <div class="w-full max-w-lg rounded-2xl border overflow-hidden" style="background: rgba(10,10,10,0.95); border-color: rgba(196,149,106,0.1);">
      <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: rgba(196,149,106,0.06);">
        <h2 class="text-lg font-semibold" style="color: #d4cfc8;">Help</h2>
        <button class="text-sm px-3 py-1 rounded-lg border" style="color: #8a857e; border-color: rgba(196,149,106,0.08);" @click="$emit('close')">Close</button>
      </div>
      <div class="px-6 py-5 space-y-5 text-sm leading-relaxed" style="color: #8a857e;">
        <div>
          <h3 class="font-semibold mb-1" style="color: #d0ae8c;">Signal Generation</h3>
          <p>Choose waveform type (Sine, Square, Triangle, Sawtooth) and adjust Frequency, Amplitude, Phase, Sample Rate, and FFT Size.</p>
        </div>
        <div>
          <h3 class="font-semibold mb-1" style="color: #d0ae8c;">FFT Analysis</h3>
          <p>The analyzer displays real-time Time Domain and Frequency Domain plots. The peak frequency is highlighted.</p>
        </div>
        <div>
          <h3 class="font-semibold mb-1" style="color: #d0ae8c;">Equalizer</h3>
          <p>10-band graphic equalizer (31Hz — 16kHz). Adjust sliders to boost or cut specific frequency ranges. Use <strong>Flat</strong> to reset.</p>
        </div>
        <div>
          <h3 class="font-semibold mb-1" style="color: #d0ae8c;">Audio Playback</h3>
          <p>Load an audio file (MP3, WAV, OGG) and play it through the equalizer. <strong>Play Original</strong> bypasses EQ, <strong>Play Equalized</strong> applies current gain values.</p>
        </div>
        <div>
          <h3 class="font-semibold mb-1" style="color: #d0ae8c;">Export</h3>
          <p><strong>Save WAV</strong> exports the equalized audio as a 16-bit WAV file.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close'])
</script>
