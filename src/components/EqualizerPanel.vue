<template>
  <section id="equalizer" class="panel-card">
    <div class="panel-header">
      <div class="flex items-center gap-3">
        <h2 class="text-base sm:text-lg font-semibold" style="color: #d4cfc8;">10-Band Equalizer</h2>
        <span class="text-[11px] px-2.5 py-0.5 rounded-full font-medium" style="background: rgba(196,149,106,0.08); color: #d0ae8c;">均衡器</span>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn btn-sm btn-secondary" @click="$emit('flat')">Flat</button>
      </div>
    </div>
    <div class="panel-body">
      <div class="flex justify-around items-end gap-1 sm:gap-2 py-4 min-h-[260px]">
        <div v-for="(band, i) in bands" :key="band.name" class="flex flex-col items-center gap-2 flex-1 max-w-[44px] sm:max-w-[70px]">
          <span class="font-mono text-[11px] font-semibold" style="color: #666360;">{{ band.name }}</span>
          <input
            type="range" class="eq-slider"
            min="-30" max="30"
            :value="gains[i]"
            @input="updateGain(i, $event)"
          >
          <span class="font-mono text-[11px] min-w-[36px] text-center" style="color: #8a857e;">
            {{ gains[i] > 0 ? '+' : '' }}{{ gains[i] }} dB
          </span>
        </div>
      </div>
      <div class="relative w-full h-[120px] mt-2">
        <Bar v-if="eqChartData" :data="eqChartData" :options="eqOptions" />
      </div>
      <div class="flex justify-center gap-4 mt-3 text-xs" style="color: #666360;">
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm inline-block" style="background: #c4956a;"></span> Boost</span>
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm inline-block" style="background: #4a3420;"></span> Neutral</span>
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm inline-block" style="background: #ff3355;"></span> Cut</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const props = defineProps({ gains: Array })
const emit = defineEmits(['update:gains', 'flat'])

const bands = [
  { name: '31' }, { name: '62' }, { name: '125' }, { name: '250' }, { name: '500' },
  { name: '1k' }, { name: '2k' }, { name: '4k' }, { name: '8k' }, { name: '16k' }
]

function updateGain(i, e) {
  const val = parseFloat(e.target.value)
  const newGains = [...props.gains]
  newGains[i] = val
  emit('update:gains', newGains)
}

const eqChartData = computed(() => ({
  labels: bands.map(b => b.name),
  datasets: [{
    label: 'Gain (dB)',
    data: props.gains,
    backgroundColor: props.gains.map(g => {
      const a = Math.abs(g) / 30
      if (g > 0) return `rgba(196,149,106,${0.3 + a * 0.7})`
      if (g < 0) return `rgba(255,51,85,${0.3 + a * 0.7})`
      return '#4a3420'
    }),
    borderRadius: 3,
    borderSkipped: false
  }]
}))

const eqOptions = {
  responsive: true, maintainAspectRatio: false,
  animation: { duration: 200 },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(5,5,5,0.9)',
      callbacks: { label: (ctx) => `${ctx.parsed.y.toFixed(1)} dB` }
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#666360', font: { size: 10, family: 'monospace' } } },
    y: { grid: { color: 'rgba(196,149,106,0.04)' }, ticks: { color: '#666360', font: { size: 10 } }, min: -35, max: 35 }
  }
}
</script>

<style scoped>
.eq-slider {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 180px;
  background: transparent; cursor: pointer;
  writing-mode: vertical-lr; direction: rtl;
}
@media (max-width: 640px) { .eq-slider { height: 140px; } }
@media (max-width: 480px) { .eq-slider { height: 100px; } }
.eq-slider::-webkit-slider-runnable-track {
  width: 4px; height: 100%;
  background: linear-gradient(to top, #4a3420, #a37a52, #c4956a);
  border-radius: 9999px;
}
.eq-slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 18px; height: 18px;
  border-radius: 50%; background: #c4956a; cursor: pointer;
  margin-left: -7px;
  box-shadow: 0 0 0 3px rgba(196,149,106,0.15);
}
.eq-slider::-moz-range-track {
  width: 4px; height: 100%;
  background: linear-gradient(to top, #4a3420, #a37a52, #c4956a);
  border-radius: 9999px;
}
.eq-slider::-moz-range-thumb {
  width: 18px; height: 18px; border-radius: 50%;
  background: #c4956a; cursor: pointer; border: none;
}
</style>
