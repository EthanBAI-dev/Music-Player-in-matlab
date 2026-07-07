# FFT Spectrum Analyzer & Equalizer

基于 **Vue 3 + Vite** 构建的 Web 端傅里叶变换频谱分析与 10 波段均衡器。本项目是原始 MATLAB 音乐播放器的完整重构版本，专注于 FFT 可视化的学习与音频数字信号处理。

![Vue 3](https://img.shields.io/badge/Vue_3-4FC08D?logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![math.js](https://img.shields.io/badge/math.js-1D253C?logo=javascript&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?logo=chart.js&logoColor=white)

---

## 功能特性

| 功能 | 说明 |
|------|------|
| **信号发生器** | 生成正弦波、方波、三角波、锯齿波，频率/幅值/相位可调 |
| **FFT 频谱分析** | 实时时域与频域可视化，显示峰值频率 |
| **FFT Size 可调** | 256/512/1024/2048/4096 点 FFT 切换 |
| **10 波段均衡器** | 31Hz ~ 16kHz 频段增益调节（-30dB ~ +30dB） |
| **音频文件加载** | 支持 MP3/WAV 格式导入 |
| **原始音频播放** | Web Audio API 播放原始音频 |
| **均衡后播放** | 频域增益处理后播放，效果可听辨 |
| **WAV 导出保存** | 将均衡处理后的音频导出为 `.wav` 文件 |

---

## 项目结构

```
FFT-Spectrum-Analyzer/
├── index.html              # Vite 入口 HTML
├── package.json             # 依赖管理
├── vite.config.js           # Vite 配置（含代码分割）
├── src/
│   ├── main.js              # Vue 应用入口
│   ├── App.vue              # 根组件（布局 + 状态协调）
│   ├── assets/
│   │   └── styles.css       # 全局样式系统（暗色主题 + 响应式）
│   ├── components/
│   │   ├── SignalControls.vue    # 信号发生器控制面板
│   │   ├── SignalAnalyzer.vue    # 时域/频域图表（vue-chartjs）
│   │   ├── EqualizerPanel.vue    # 10 波段均衡器
│   │   ├── AudioControls.vue     # 音频加载/播放/保存
│   │   └── HelpModal.vue         # 帮助弹窗
│   ├── composables/
│   │   ├── useFFT.js        # FFT 信号处理组合式函数
│   │   └── useAudio.js      # 音频播放组合式函数
│   └── utils/
│       ├── fft-core.js      # FFT/IFFT 算法（基于 math.js）
│       ├── signal-generator.js  # 信号发生器
│       └── equalizer.js     # 10 波段均衡器处理器
├── DEPLOY.md                # 部署文档
└── README.md                # 项目介绍文档
```

---

## 核心算法

### FFT 频谱分析

采用 Cooley-Tukey 基-2 FFT 算法实现：

```
输入信号 -> 分帧（N 点）-> math.js fft() -> 幅值计算 -> 单边频谱 -> 柱状图
```

### 10 波段均衡器

频域均衡处理流程：

1. 整段音频 **FFT** 变换
2. 根据滑条增益（`exp(gain/20)`）缩放各频段
3. 同时对正负频率分量做相同处理
4. **IFFT** 恢复时域信号

| 频段 | 中心频率 | 范围 |
|------|----------|------|
| 1-5 | 31 / 62 / 125 / 250 / 500 Hz | 低频 |
| 6-10 | 1k / 2k / 4k / 8k / 16k Hz | 高频 |

---

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

---

## 技术栈

| 技术 | 用途 |
|------|------|
| **Vue 3** (Composition API) | 组件化 UI 框架，响应式数据流 |
| **Vite 5** | 构建工具，秒级 HMR，Rollup 生产打包 |
| **math.js** | 复数运算与 FFT/IFFT 算法 |
| **Chart.js + vue-chartjs** | 时域/频域/均衡器图表可视化 |
| **Web Audio API** | 音频解码、播放与实时处理 |
| **CSS Custom Properties** | 暗色主题设计系统，响应式布局 |
