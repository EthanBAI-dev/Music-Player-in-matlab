# 项目名称选型说明

## 最终选定：**Soniq**

---

## 1. 命名背景

原项目名称为 `fft-spectrum-analyzer`（首次 Web 重构）和 `Music-Player-in-matlab`（原始仓库名），两者均已无法准确反映当前项目的功能范围与技术定位。当前项目已演进为包含 **音乐播放器** 与 **软件合成器** 两大核心模块的全功能 Web 音频工作站，需要一个统一的、具备辨识度的品牌名称。

## 2. 候选名称分析

| 名称 | 词源 | 音节 | 优势 | 劣势 | 结论 |
|------|------|------|------|------|------|
| **Soniq** | sonic + -iq | 2 | 简短、易记、品牌感强、发音清晰 | 需解释拼写 | **最终选定** |
| WaveForge | wave + forge | 3 | 描述性强、有力量感 | 拼写较长、易与既有项目重名 | 备选 |
| SynthSight | synth + insight | 3 | 精准反映合成器功能 | 忽略音乐播放器、语义偏窄 | 排除 |
| Audion | audio + -ion | 3 | 语义清晰、元音流畅 | 与早期音频软件 Audion 重名风险 | 排除 |
| Tonica | tonic + -ica | 3 | 音乐感强、优雅 | 易与 Tonik（饮料品牌）混淆 | 排除 |

## 3. Soniq 选型理由

### 3.1 语言与传播
- **5 个字母，2 个音节** — 极短，适合 URL、CLI 命令、包名
- **拼写直观** — `So-niq`，无歧义发音
- **可记忆性高** — 异形拼写（-iq 代替 -ic）创造记忆锚点，类似 Pixar（pixel + art）、Sonos（sonic + os）等成功品牌

### 3.2 商标与可用性
- 经初步检索，`Soniq` 在软件/音频类别无已知注册商标冲突
- npm 包名 `soniq` 可用（如不可用则使用 `soniq-app`）
- 域名建议：`soniq.app` / `soniq.dev` / `soniq.studio`

### 3.3 语义契合度
- **son-** 词根（拉丁语 *sonus* = 声音）直接关联项目核心定位
- **-iq** 后缀暗示智能/品质（类比 unique → unique）
- 整体感受：现代、简洁、专业，适合音频工具类产品

### 3.4 视觉适配
- 短名称在 UI 标题栏、Logo、favicon 中均有良好适配空间
- 可与波形图标、音符符号等组合形成完整品牌标识

## 4. 命名映射表

| 场景 | 旧名称 | 新名称 |
|------|--------|--------|
| 项目目录 | `Music-Player-in-matlab` | `soniq` |
| npm 包名 | `fft-spectrum-analyzer` | `soniq-app` |
| HTML Title | `FFT Spectrum Analyzer & Equalizer` | `Soniq — Web Audio Studio` |
| 应用标题 (header) | `Music Player` | `Soniq` |

---

**选型日期**: 2026-07-07  
**选型人**: 项目团队  
**状态**: 已定稿
