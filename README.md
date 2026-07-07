# Soniq — Web Audio Studio

> 一个集音乐播放器与软件合成器于一体的 Web 音频工作站。基于 Vue 3 + Web Audio API，在浏览器中提供专业级音频可视化与声音合成体验。

![Vue 3](https://img.shields.io/badge/Vue_3-4FC08D?logo=vue.js&logoColor=white)
![Vite 5](https://img.shields.io/badge/Vite_5-646CFF?logo=vite&logoColor=white)
![Web Audio API](https://img.shields.io/badge/Web_Audio_API-FF6F00?logo=webaudio&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=white)

---

## 目录

- [项目简介](#项目简介)
- [核心功能](#核心功能)
- [快速入门](#快速入门)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [模块详解](#模块详解)
  - [Player 模块](#player-模块)
  - [Synth 模块](#synth-模块)
  - [Waveform 可视化](#waveform-可视化)
- [API 文档](#api-文档)
- [主题与样式](#主题与样式)
- [常见问题（FAQ）](#常见问题faq)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

---

## 项目简介

**Soniq** 是一款在浏览器中运行的音频工作站应用，包含两大核心模块：

- **🎵 Player** — 音乐播放器：加载本地音频文件，实时显示波形与频谱，配备 8 段图形均衡器和可切换的粒子可视化模式。
- **🎛️ Synth** — 软件合成器：双振荡器 + ADSR 包络 + 多模滤波器 + LFO + 混响/延迟效果器 + 5 个八度钢琴键盘 + 预设管理系统。

项目采用 **Vue 3 Composition API** 构建，音频引擎基于 **Web Audio API**（OscillatorNode, AnalyserNode, BiquadFilterNode, ConvolverNode），所有可视化通过 **Canvas API** 实时渲染。

---

## 核心功能

### Player — 音频播放与分析

| 功能 | 说明 |
|------|------|
| 音频文件加载 | 支持 MP3 / WAV / OGG 格式，显示文件名与时长 |
| 波形可视化 | Canvas 实时绘制音频时域波形 |
| 频谱分析 | 64 段频率柱状图，峰值频率跟踪 |
| 粒子可视化 | 音频驱动的粒子特效，粒子数量/大小/颜色随频率和音量实时变化 |
| 频谱/EQ 叠加 | 在频谱上叠加 EQ 增益曲线（虚线），支持点击频谱定位频段 |
| 8 段均衡器 | 62Hz ~ 16kHz 频段增益调节，点击频谱切换 Boost/Flat |
| 播放控制 | 播放/暂停/停止，进度条拖拽跳转 |

### Synth — 软件合成器

| 功能 | 说明 |
|------|------|
| 双振荡器 | 独立波形选择（sine/square/triangle/sawtooth）、detune、电平、八度、开关 |
| 波形预览 | 每个振荡器配有独立 Canvas 实时波形预览 |
| ADSR 包络 | Attack/Decay/Sustain/Release 四段可调，SVG 曲线实时预览 |
| 多模滤波器 | lowpass / highpass / bandpass / notch 切换，截止频率、谐振、包络调制量 |
| LFO 低频振荡 | 波形/速率/深度/目标选择（pitch / cutoff / volume） |
| 效果器 | 混响（ConvolverNode + 程序化脉冲响应）、延迟（Feedback） |
| 钢琴键盘 | C3~C5 共 25 键，鼠标/触屏/键盘（ASDFGHJKL 键位映射） |
| 预设管理 | Warm Pad / Lead / Bass / Pluck / Default 5 个预设，支持保存/删除 |

### Waveform — 独立示波器

| 功能 | 说明 |
|------|------|
| 全屏示波器 | 高对比度绿色波形实时显示（retro 风格） |
| 音频输入 | 麦克风或系统音频输入（通过 getUserMedia） |
| 持续渲染 | requestAnimationFrame 循环，>60fps |

---

## 快速入门

### 前置要求

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/EthanBAI-dev/Music-Player-in-matlab.git
cd Music-Player-in-matlab

# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

### 浏览器支持

| 浏览器 | 最低版本 |
|--------|----------|
| Google Chrome | 80+ |
| Mozilla Firefox | 75+ |
| Apple Safari | 14.1+ |
| Microsoft Edge | 80+ |

> 需要 Web Audio API 支持，不支持 Internet Explorer。

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Vue 3** | ^3.4 | 组件化 UI 框架，Composition API + reactive ref 响应式系统 |
| **Vite 5** | ^5.4 | 构建工具，ESM 开发服务器，Rollup 生产打包 |
| **Web Audio API** | — | 音频播放、合成、分析（AudioContext, AnalyserNode, OscillatorNode 等） |
| **Canvas API** | — | 波形/频谱/粒子/波形预览实时渲染（requestAnimationFrame） |
| **Tailwind CSS 3** | ^3.4 | 原子化 CSS 工具类，配合 CSS Custom Properties 主题系统 |
| **CSS Custom Properties** | — | 完整的浅色主题设计令牌系统（色彩/间距/阴影/圆角） |

---

## 项目结构

```
soniq/
├── index.html                    # Vite 入口 HTML（含 Google Fonts 加载）
├── package.json                  # 依赖管理
├── vite.config.js                # Vite 配置（含代码分割）
├── tailwind.config.js            # Tailwind 配置（铜色 tokens）
├── NAME-SELECTION.md             # 项目名称选型说明
├── light-theme-spec.md           # 浅色主题设计规范文档
├── DEPLOY.md                     # 部署指南
├── CONTRIBUTING.md               # 贡献指南
├── public/
│   └── visualizer/
│       └── waveform-visualizer.html   # 独立示波器页面
├── src/
│   ├── main.js                   # Vue 应用入口
│   ├── App.vue                   # 根组件（标签页导航 + 布局）
│   ├── assets/
│   │   └── styles.css            # 全局样式 + 主题 CSS 变量系统
│   ├── components/
│   │   ├── MusicPlayer.vue       # Player 标签页（播放器 + 波形/频谱/均衡器/粒子）
│   │   ├── Synthesizer.vue       # Synth 标签页（振荡器 + ADSR + 滤波器 + 键盘）
│   │   ├── SignalControls.vue    # （旧组件，未删除但已弃用）
│   │   ├── SignalAnalyzer.vue    # （旧组件，未删除但已弃用）
│   │   ├── EqualizerPanel.vue    # （旧组件，未删除但已弃用）
│   │   └── AudioControls.vue     # （旧组件，未删除但已弃用）
│   └── composables/
│       ├── useAudio.js           # 音频播放组合式函数（AudioContext + AnalyserNode）
│       └── useSynth.js           # 合成器引擎（Voice 类 + ADSR + 滤波 + 效果器）
```

---

## 模块详解

### Player 模块

Player 模块由 `MusicPlayer.vue` 实现，完整的音频管线如下：

```
用户加载文件 → AudioContext.decodeAudioData()
                     ↓
           BufferSourceNode (循环播放)
                     ↓
              AnalyserNode (FFT 分析)
                     ↓
                ctx.destination
                     ↓
          +---- 波形 Canvas (getByteTimeDomainData)
          +---- 频谱 Canvas (getByteFrequencyData)
          +---- 粒子 Canvas (getByteFrequencyData → 音频驱动粒子系统)
```

**视图切换**：频谱面板右上角的 `〰` / `✦` 按钮可在频谱柱状图和粒子可视化之间切换。

**EQ 交互**：在频谱模式下点击频谱图可切换对应频段的增益状态（Boost ↔ Flat），频谱上叠加显示 EQ 增益虚线曲线。

### Synth 模块

Synth 模块由 `Synthesizer.vue` + `useSynth.js` 实现，音频信号链路：

```
Voice 1 (Oscillator → Gain)  ─┐
Voice 2 (Oscillator → Gain)  ─┤
Noise Source (Buffer → Gain) ─┘
         │
    envGain (ADSR 包络)
         │
    filterNode (BiquadFilterNode)
         │
    filterEnv (直通 GainNode)
         │
    masterGain (总音量)
         │
    analyser (FFT 分析)
         │
    ┌────┴────┐
    │         │
 ctx.dest    fxSend → reverbNode → ctx.dest
             fxSend → delayNode → feedback → delayNode
```

**多复音架构**：支持最多 16 个同时发音（`MAX_VOICES = 16`），通过 Voice 对象池管理，超出时自动窃取最早触发的音。

**预设系统**：5 个内置预设（Warm Pad / Lead / Bass / Pluck / Default），支持用户保存和删除自定义预设。

### Waveform 可视化

独立页面的示波器风格波形可视化，位于 `/visualizer/waveform-visualizer.html`。通过 `getUserMedia` 获取音频输入，使用 `AnalyserNode.getByteTimeDomainData` 实时绘制绿色波形线。

---

## API 文档

### `useAudio()` — 音频播放组合式函数

```
返回对象:
  audioCtx: Ref<AudioContext | null>
  analyserNode: Ref<AnalyserNode | null>
  isPlaying: Ref<boolean>
  currentTime: Ref<number>
  duration: Ref<number>
  loadedFileName: Ref<string>

方法:
  loadFile(file: File): Promise<void>
    加载并解码音频文件

  play(): void
    开始播放（从当前位置）

  pause(): void
    暂停播放

  stop(): void
    停止播放（重置位置）

  seek(time: number): void
    跳转到指定时间位置
```

### `useSynth()` — 合成器引擎

```
返回对象:
  osc1/osc2: Reactive — { type, gain, detune, octave, active }
  adsr: Reactive — { attack, decay, sustain, release }
  filterCfg: Reactive — { type, cutoff, resonance, envAmt }
  lfoCfg: Reactive — { type, rate, amount, target }
  fx: Reactive — { reverb, delay, feedback }
  noiseLevel: Ref<number>
  presets: Ref<Preset[]>
  currentPreset: Ref<string>

方法:
  init(): void
    初始化 AudioContext 与音频节点链

  noteOn(midi: number, velocity?: number): void
    触发音符（midi 编号 0-127）

  noteOff(midi: number): void
    释放音符

  updateFilter(): void
    应用 filterCfg 到 filterNode

  updateLFORouting(): void
    重新配置 LFO 调制路由

  loadPreset(name: string): void
    加载预设

  savePreset(name: string): void
    保存当前参数为预设

  getAnalyser(): AnalyserNode | null
    获取 AnalyserNode 引用（用于频谱渲染）

工具函数:
  midiToFreq(midi: number): number
    将 MIDI 编号转换为频率（A4 = 440Hz）

  midiToName(midi: number): string
    将 MIDI 编号转换为音名（如 60 → "C4"）
```

### 主题 CSS 变量

完整的主题 token 系统定义在 `src/assets/styles.css` 中，所有组件通过 `var(--token-name)` 引用。

**色调**: 暖白浅色背景（`#F4F2ED`）+ 铜色强调（`#C4845C`）+ 鼠尾绿/金/暗蓝灰辅助色。

详见 [light-theme-spec.md](./light-theme-spec.md)。

---

## 主题与样式

Soniq 采用 **CSS Custom Properties** 驱动的设计令牌系统，实现完整的浅色主题。所有颜色、间距、阴影、圆角均通过语义化变量引用，确保风格一致性。

### 调色板概览

| 角色 | 色值 | 用途 |
|------|------|------|
| 主背景 | `#F4F2ED` | 页面底色 |
| 卡片/面板 | `#FFFFFF` | 内容表面 |
| 主要文字 | `#1E1D1A` | 正文 |
| 次要文字 | `#6B6760` | 标签/说明 |
| **铜色** | `#C4845C` | 主交互色 |
| 鼠尾绿 | `#6B8F7A` | 辅助色 |
| 金色 | `#C9A04A` | 高亮色 |
| 暗蓝灰 | `#5A7D8F` | 信息色 |

---

## 常见问题（FAQ）

### Q1: 为什么 Synthesizer 没有声音 / 频谱不显示？

这是已知问题，已在 48d94ab 修复。原因为 filterEnv GainNode 增益被误设为 0，导致音频信号被静音。请确保版本 ≥ 48d94ab。

### Q2: 浏览器提示 "AudioContext was not allowed to start"？

这是浏览器的自动播放策略。点击页面任意位置（如按下键盘按键）即可激活 AudioContext。

### Q3: 均衡器调节后没有听到变化？

Player 模块的均衡器为可视化 EQ 曲线叠加，实际增益通过点击频谱切换 Boost/Flat 生效。

### Q4: 合成器支持 MIDI 键盘输入吗？

当前版本不支持外部 MIDI 设备。键盘映射为电脑键盘：`A W S E D F T G Y H U J K O L P` 对应 C3 ~ D5。

### Q5: 如何添加新的合成器预设？

在界面中调整参数后点击 "Save" 按钮，输入预设名称即可保存。也可通过 "Del" 按钮删除自定义预设（Default 预设不可删除）。

### Q6: 浏览器兼容性如何？

支持 Chrome 80+ / Firefox 75+ / Safari 14.1+ / Edge 80+。不支持 Internet Explorer。移动端 Safari 的 Web Audio API 支持有限。

---

## 贡献指南

请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## 许可证

本项目仅供学习与参考。

---

## 致谢

- 原始 MATLAB 项目启发 Web 端重构
- Web Audio API 提供底层音频能力
- Vue 社区提供优秀的开发框架
