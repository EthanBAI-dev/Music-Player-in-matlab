<template>
  <section id="analyzer" class="panel-card">
    <div class="panel-header">
      <h2 class="text-base sm:text-lg font-semibold" style="color: #e0e0e0;">Signal Analyzer</h2>
      <div class="flex items-center gap-2 flex-wrap">
        <span class="stats-badge">{{ statsInfo }}</span>
        <span class="stats-badge" style="border-color: rgba(0,255,65,0.2); background: rgba(0,255,65,0.06); color: #00ff41;">Peak: {{ peakFreq }}</span>
      </div>
    </div>
    <div class="panel-body">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Time Domain <span class="text-[11px] font-mono opacity-60">时域</span></h3>
            <span class="chart-unit">Amplitude</span>
          </div>
          <div class="chart-container">
            <Line v-if="chartDataTime" :data="chartDataTime" :options="timeOptions" />
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Frequency Domain <span class="text-[11px] font-mono opacity-60">频域</span></h3>
            <span class="chart-unit">Magnitude</span>
          </div>
          <div class="chart-container">
            <Bar v-if="chartDataFreq" :data="chartDataFreq" :options="freqOptions" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Line, Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend)

const props = defineProps({
  timeLabels: Array, timeData: Array, freqLabels: Array, freqData: Array,
  statsInfo: String, peakFreq: String
})

const baseOpts = {
  responsive: true, maintainAspectRatio: false,
  animation: { duration: 300 },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(5,5,5,0.9)', titleColor: '#e0e0e0',
      bodyColor: '#a0a0a0', borderColor: 'rgba(0,255,65,0.3)', borderWidth: 1,
      padding: 8, cornerRadius: 8
    }
  },
  scales: {
    x: { grid: { color: 'rgba(0,255,65,0.06)' }, ticks: { color: '#666666', font: { size: 10, family: 'monospace' }, maxTicksLimit: 10 } },
    y: { grid: { color: 'rgba(0,255,65,0.06)' }, ticks: { color: '#666666', font: { size: 10, family: 'monospace' } }, beginAtZero: true }
  },
  interaction: { intersect: false, mode: 'index' }
}

const chartDataTime = computed(() => ({
  labels: props.timeLabels,
  datasets: [{
    label: 'Amplitude', data: props.timeData,
    borderColor: '#00ff41', borderWidth: 1.5,
    backgroundColor: (ctx) => {
      if (!ctx.chart?.ctx) return 'rgba(0,255,65,0.08)'
      const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260)
      g.addColorStop(0, 'rgba(0,255,65,0.15)')
      g.addColorStop(1, 'rgba(0,255,65,0)')
      return g
    },
    pointRadius: 0, tension: 0.1, fill: true
  }]
}))

const chartDataFreq = computed(() => ({
  labels: props.freqLabels,
  datasets: [{
    label: 'Magnitude', data: props.freqData,
    backgroundColor: (ctx) => {
      const v = ctx.parsed?.y || 0
      return v > 0.5 ? '#7fff00' : v > 0.1 ? '#00ff41' : '#00cc33'
    },
    borderWidth: 0, borderRadius: 1
  }]
}))

const timeOptions = computed(() => ({
  ...baseOpts,
  scales: {
    ...baseOpts.scales,
    x: { ...baseOpts.scales.x, title: { display: true, text: 'Time (s)', color: '#666666', font: { size: 10 } } },
    y: { ...baseOpts.scales.y, title: { display: true, text: 'Amplitude', color: '#666666', font: { size: 10 } } }
  }
}))

const freqOptions = computed(() => ({
  ...baseOpts,
  scales: {
    ...baseOpts.scales,
    x: { ...baseOpts.scales.x, title: { display: true, text: 'Frequency (Hz)', color: '#666666', font: { size: 10 } } },
    y: { ...baseOpts.scales.y, title: { display: true, text: 'Magnitude', color: '#666666', font: { size: 10 } } }
  }
}))
</script>
