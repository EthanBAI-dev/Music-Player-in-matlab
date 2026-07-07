<template>
  <div class="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6" style="background: rgba(5,5,5,0.85); backdrop-filter: blur(8px);" @click.self="$emit('close')">
    <div class="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border shadow-2xl animate-[slideUp_300ms_ease]" style="background: rgba(10,10,10,0.95); border-color: rgba(0,255,65,0.15);">
      <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: rgba(0,255,65,0.08);">
        <h2 class="text-xl font-bold" style="color: #e0e0e0;">UFO Spectrum Analyzer</h2>
        <button class="text-2xl leading-none transition-colors bg-transparent border-none cursor-pointer" style="color: #666666;" @click="$emit('close')">&times;</button>
      </div>
      <div class="px-6 py-5 space-y-4 text-sm" style="color: #a0a0a0;">
        <p class="text-base font-semibold" style="color: #e0e0e0;">深空信号处理站 &mdash; 操作手册</p>
        <p>本项目是原始 MATLAB 音乐播放器的 Web 重构版，以 UFO/深空为主题，专注于 FFT 可视化学习与音频信号处理。</p>
        <div>
          <h4 class="text-sm font-semibold mb-1.5" style="color: #00ff41;">核心功能</h4>
          <ul class="space-y-1 pl-4 list-disc">
            <li><strong style="color: #e0e0e0;">Signal Generator</strong> &mdash; 生成 4 种波形，调节频率/幅值/相位</li>
            <li><strong style="color: #e0e0e0;">FFT Spectrum Analyzer</strong> &mdash; 实时时域与频域可视化</li>
            <li><strong style="color: #e0e0e0;">10-Band Equalizer</strong> &mdash; 31Hz ~ 16kHz 频段增益调节</li>
            <li><strong style="color: #e0e0e0;">Audio Processing</strong> &mdash; 加载 MP3/WAV，应用均衡并保存</li>
          </ul>
        </div>
        <div>
          <h4 class="text-sm font-semibold mb-1.5" style="color: #00ff41;">技术栈</h4>
          <ul class="space-y-1 pl-4 list-disc">
            <li>Vue 3 + Vite + Tailwind CSS</li>
            <li>math.js &mdash; FFT/IFFT 算法</li>
            <li>Chart.js &mdash; 图表可视化</li>
            <li>Web Audio API &mdash; 音频播放</li>
          </ul>
        </div>
        <div>
          <h4 class="text-sm font-semibold mb-1.5" style="color: #00ff41;">操作提示</h4>
          <ol class="space-y-1 pl-4 list-decimal">
            <li>在 Signal 面板调整参数后点击 <strong style="color: #e0e0e0;">Apply</strong></li>
            <li>上传音频文件后点击 <strong style="color: #e0e0e0;">Play Original</strong></li>
            <li>调整 EQ 滑条后点击 <strong style="color: #e0e0e0;">Play EQ</strong></li>
            <li>点击 <strong style="color: #e0e0e0;">Save WAV</strong> 导出处理后的音频</li>
            <li>FFT Size 越大，频率分辨率越高</li>
          </ol>
        </div>
      </div>
      <div class="flex justify-end px-6 py-4 border-t" style="border-color: rgba(0,255,65,0.08);">
        <button class="btn btn-primary" @click="$emit('close')">Got it</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close'])
</script>
