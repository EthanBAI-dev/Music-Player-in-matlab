<template>
  <section id="signal" class="panel-card">
    <div class="panel-header">
      <div class="flex items-center gap-3">
        <h2 class="text-base sm:text-lg font-semibold" style="color: #e2e8f0;">Signal Generator</h2>
        <span class="text-[11px] px-2.5 py-0.5 rounded-full font-medium" style="background: rgba(0,180,216,0.12); color: #00e5ff;">信号发生器</span>
      </div>
    </div>
    <div class="panel-body">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
        <div class="flex flex-col gap-1.5">
          <label class="control-label">Waveform</label>
          <select class="control-select" :value="signalType" @change="$emit('update:signalType', $event.target.value)">
            <option value="sine">Sine 正弦波</option>
            <option value="square">Square 方波</option>
            <option value="triangle">Triangle 三角波</option>
            <option value="sawtooth">Sawtooth 锯齿波</option>
          </select>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="control-label">Frequency (Hz)</label>
          <input type="range" class="control-slider" min="1" max="2000" :value="frequency" @input="update('frequency', $event)">
          <input type="number" class="control-number" min="1" max="2000" :value="frequency" @input="update('frequency', $event)">
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="control-label">Amplitude</label>
          <input type="range" class="control-slider" min="0" max="2" step="0.01" :value="amplitude" @input="update('amplitude', $event)">
          <input type="number" class="control-number" min="0" max="2" step="0.01" :value="amplitude" @input="update('amplitude', $event)">
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="control-label">Phase (&deg;)</label>
          <input type="range" class="control-slider" min="0" max="360" :value="phase" @input="update('phase', $event)">
          <input type="number" class="control-number" min="0" max="360" :value="phase" @input="update('phase', $event)">
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="control-label">Sample Rate</label>
          <select class="control-select" :value="sampleRate" @change="$emit('update:sampleRate', Number($event.target.value))">
            <option :value="1024">1024 Hz</option>
            <option :value="2048">2048 Hz</option>
            <option :value="4096">4096 Hz</option>
            <option :value="8192">8192 Hz</option>
          </select>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="control-label">FFT Size</label>
          <select class="control-select" :value="fftSize" @change="$emit('update:fftSize', Number($event.target.value))">
            <option :value="256">256</option>
            <option :value="512">512</option>
            <option :value="1024">1024</option>
            <option :value="2048">2048</option>
            <option :value="4096">4096</option>
          </select>
        </div>
        <div class="flex items-end gap-3 sm:col-span-2 lg:col-span-6 xl:col-span-6">
          <button class="btn btn-primary" @click="$emit('apply')">Apply</button>
          <button class="btn btn-secondary" @click="$emit('reset')">Reset</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  signalType: String, frequency: Number, amplitude: Number, phase: Number,
  sampleRate: Number, fftSize: Number
})
const emit = defineEmits(['update:signalType', 'update:frequency', 'update:amplitude', 'update:phase', 'update:sampleRate', 'update:fftSize', 'apply', 'reset'])
function update(field, e) {
  emit(`update:${field}`, parseFloat(e.target.type === 'number' ? e.target.value : e.target.value))
}
</script>
