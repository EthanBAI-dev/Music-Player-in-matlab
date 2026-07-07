<template>
  <div class="min-h-screen relative overflow-hidden" style="background: #050505;">
    <!-- Starfield Background -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <div v-for="i in 60" :key="i"
        class="absolute rounded-full animate-twinkle"
        :style="starStyle(i)"
      ></div>
    </div>

    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50" style="background: rgba(5,5,5,0.85); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(0,255,65,0.1);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 shrink-0">
          <!-- UFO Icon -->
          <div class="relative w-9 h-9 flex items-center justify-center animate-float">
            <svg viewBox="0 0 40 40" class="w-9 h-9">
              <ellipse cx="20" cy="20" rx="14" ry="5" fill="#00ff41" opacity="0.85"/>
              <ellipse cx="20" cy="18" rx="8" ry="6" fill="#00cc33"/>
              <ellipse cx="20" cy="18" rx="4" ry="3" fill="#7fff00" opacity="0.6"/>
              <ellipse cx="20" cy="22" rx="10" ry="3" fill="none" stroke="#7fff00" stroke-width="0.5" opacity="0.4"/>
            </svg>
          </div>
          <div>
            <h1 class="text-lg sm:text-xl font-bold text-glow-neon" style="background: linear-gradient(135deg, #00cc33, #7fff00); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">UFO Spectrum Analyzer</h1>
            <p class="hidden sm:block text-[11px] uppercase tracking-widest" style="color: #666666;">傅里叶变换频谱分析 &middot; 深空均衡器</p>
          </div>
        </div>
        <nav class="flex items-center gap-1">
          <a href="#signal" class="nav-link" :class="{ 'active': activeSection === 'signal' }" @click.prevent="scrollTo('signal')">Signal</a>
          <a href="#analyzer" class="nav-link" :class="{ 'active': activeSection === 'analyzer' }" @click.prevent="scrollTo('analyzer')">Analyzer</a>
          <a href="#equalizer" class="nav-link" :class="{ 'active': activeSection === 'equalizer' }" @click.prevent="scrollTo('equalizer')">EQ</a>
          <a href="#help" class="nav-link" @click.prevent="showHelp = true">Help</a>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style="padding-top: calc(4rem + 1.5rem); padding-bottom: 2rem;">
      <div class="flex flex-col gap-6">
        <!-- UFO Beam decorative -->
        <div class="relative">
          <div class="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 pointer-events-none opacity-15" style="background: radial-gradient(ellipse, rgba(0,255,65,0.25), transparent 70%); animation: beam 3s ease-in-out infinite;"></div>
        </div>

        <SignalControls
          :signal-type="fft.signalType.value"
          :frequency="fft.frequency.value"
          :amplitude="fft.amplitude.value"
          :phase="fft.phase.value"
          :sample-rate="fft.sampleRate.value"
          :fft-size="fft.fftSize.value"
          @update:signal-type="fft.signalType.value = $event"
          @update:frequency="fft.frequency.value = $event"
          @update:amplitude="fft.amplitude.value = $event"
          @update:phase="fft.phase.value = $event"
          @update:sample-rate="fft.sampleRate.value = $event"
          @update:fft-size="fft.fftSize.value = $event"
          @apply="fft.compute()"
          @reset="fft.reset()"
        />

        <SignalAnalyzer
          :time-labels="fft.timeLabels.value"
          :time-data="fft.timeData.value"
          :freq-labels="fft.freqLabels.value"
          :freq-data="fft.freqData.value"
          :stats-info="fft.statsInfo.value"
          :peak-freq="fft.peakFreq.value"
        />

        <EqualizerPanel
          :gains="eqGains"
          @update:gains="eqGains = $event"
          @flat="flatEq"
        />

        <AudioControls
          :status="audio.status.value"
          :file-name="audio.loadedFileName.value"
          @file-loaded="onFileLoaded"
          @play-original="audio.playOriginal(currentFs)"
          @play-equalized="audio.playEqualized(currentFs, eqGains)"
          @stop="audio.stop()"
          @save="onSave"
        />
      </div>
    </main>

    <HelpModal v-if="showHelp" @close="showHelp = false" />

    <footer class="relative z-10 text-center py-6 text-sm" style="color: #444444;">
      <p>UFO Spectrum Analyzer &mdash; Vue 3 + Tailwind CSS + math.js + Chart.js &mdash; 深空信号处理站</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useFFT } from './composables/useFFT.js'
import { useAudio } from './composables/useAudio.js'
import SignalControls from './components/SignalControls.vue'
import SignalAnalyzer from './components/SignalAnalyzer.vue'
import EqualizerPanel from './components/EqualizerPanel.vue'
import AudioControls from './components/AudioControls.vue'
import HelpModal from './components/HelpModal.vue'

const fft = useFFT()
const audio = useAudio()
const showHelp = ref(false)
const activeSection = ref('signal')
const currentFs = ref(2048)
const eqGains = reactive([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

function flatEq() { for (let i = 0; i < 10; i++) eqGains[i] = 0 }

function starStyle(i) {
  const size = 1 + (i % 3)
  return {
    width: size + 'px',
    height: size + 'px',
    left: ((i * 17) % 100) + '%',
    top: ((i * 13 + 7) % 100) + '%',
    background: i % 3 === 0 ? '#00ff41' : i % 3 === 1 ? '#e0e0e0' : '#7fff00',
    animationDelay: (i * 0.3) + 's',
    animationDuration: (3 + (i % 4)) + 's',
    opacity: 0.2 + (i % 5) * 0.16,
  }
}

async function onFileLoaded(file) {
  const decoded = await audio.loadFile(file)
  if (decoded) currentFs.value = decoded.sampleRate
}

function onSave() {
  const data = audio.saveWav()
  if (!data) return
  const numChannels = 1, sampleRate = currentFs.value, bitsPerSample = 16
  const dataLength = data.length * (bitsPerSample / 8)
  const buf = new ArrayBuffer(44 + dataLength)
  const v = new DataView(buf)
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  w(0, 'RIFF'); v.setUint32(4, buf.byteLength - 8, true); w(8, 'WAVE')
  w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true)
  v.setUint16(22, numChannels, true); v.setUint32(24, sampleRate, true)
  v.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true)
  v.setUint16(32, numChannels * (bitsPerSample / 8), true)
  v.setUint16(34, bitsPerSample, true)
  w(36, 'data'); v.setUint32(40, dataLength, true)
  let offset = 44
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]))
    v.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    offset += 2
  }
  const blob = new Blob([buf], { type: 'audio/wav' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(audio.loadedFileName.value || 'signal').replace(/\.[^.]+$/, '')}_equalized.wav`
  a.click(); URL.revokeObjectURL(url)
}

function scrollTo(section) {
  activeSection.value = section
  const el = document.getElementById(section)
  if (el) {
    const top = el.getBoundingClientRect().top + window.pageYOffset - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

onMounted(() => {
  fft.compute()
  const observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) activeSection.value = e.target.id
    }
  }, { rootMargin: '-80px 0px -60% 0px' })
  document.querySelectorAll('section[id]').forEach(el => observer.observe(el))
})
</script>

<style scoped>
.nav-link {
  @apply px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 no-underline;
  color: #666666;
}
.nav-link:hover { background: rgba(0, 255, 65, 0.08); color: #e0e0e0; }
.nav-link.active { background: rgba(0, 255, 65, 0.12); color: #00ff41; }
</style>
