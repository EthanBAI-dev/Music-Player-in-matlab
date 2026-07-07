# 贡献指南

感谢您考虑为 **Soniq** 做出贡献！本文档旨在帮助您高效地参与项目开发。

---

## 目录

- [行为准则](#行为准则)
- [开发环境](#开发环境)
- [代码规范](#代码规范)
- [分支管理](#分支管理)
- [提交信息规范](#提交信息规范)
- [Pull Request 流程](#pull-request-流程)
- [测试](#测试)
- [报告问题](#报告问题)

---

## 行为准则

本项目采用开源社区标准行为准则。参与本项目即表示您同意：

- 使用包容、尊重的语言
- 接受建设性的反馈
- 专注于对项目最有利的事情
- 对其他贡献者保持同理心

---

## 开发环境

### 前置依赖

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### 设置开发环境

```bash
# Fork 并克隆仓库
git clone https://github.com/<your-username>/Music-Player-in-matlab.git
cd Music-Player-in-matlab

# 安装依赖
npm install

# 启动开发服务器（HMR 热更新）
npm run dev

# 生产构建
npm run build
```

开发服务器默认运行在 `http://localhost:5173`。

---

## 代码规范

### 通用规则

- 使用 **ES6+** 语法
- 避免遗留 console.log（调试用途除外）
- Vue 组件使用 `<script setup>` + Composition API
- 模板中避免过长的内联逻辑，提取到 computed 或 methods

### 命名约定

| 类别 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `MusicPlayer.vue` |
| 组合式函数 | camelCase, 前缀 `use` | `useSynth.js` |
| 变量/函数 | camelCase | `noteOn()`, `currentPreset` |
| CSS 变量 | kebab-case, 前缀 `--` | `--accent-copper`, `--space-4` |
| 常量 | UPPER_SNAKE_CASE | `MAX_VOICES` |

### Vue 组件结构

```vue
<template>
  <!-- 模板代码 -->
</template>

<script setup>
// 导入语句
// 响应式状态
// 计算属性
// 方法
// 生命周期钩子
</script>

<style scoped>
/* 组件样式（使用 CSS 变量） */
</style>
```

### CSS 规则

- 优先使用 CSS Custom Properties（`var(--token-name)`）
- 避免硬编码颜色值
- Tailwind 工具类可与 CSS 变量组合使用
- scoped 样式优先，避免全局污染

---

## 分支管理

| 分支 | 用途 |
|------|------|
| `gh-pages` | 主分支，保持稳定可发布 |
| `feature/*` | 新功能开发 |
| `fix/*` | Bug 修复 |
| `refactor/*` | 重构 |

新分支应从 `gh-pages` 创建，完成后通过 Pull Request 合并回 `gh-pages`。

---

## 提交信息规范

使用简洁、描述性的提交信息，推荐格式：

```
<类型>: <简短描述>

<详细说明（可选）>
```

**类型前缀**:

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `refactor` | 重构 |
| `docs` | 文档更新 |
| `style` | 样式/格式调整 |
| `chore` | 构建/工具/依赖 |

**示例**:

```
fix: set filterEnv gain to 1 instead of 0

Bug: filterEnv GainNode in the main audio signal chain had gain=0,
silencing all audio before it reached the AnalyserNode.
```

---

## Pull Request 流程

1. 确保您的分支基于最新的 `gh-pages`
2. 在 `feature/` 或 `fix/` 分支上开发
3. 运行 `npm run build` 确保构建无错误
4. 提交 Pull Request，清晰地描述变更内容
5. 等待代码审查

### PR 检查清单

- [ ] 代码无构建错误
- [ ] 已测试功能正常
- [ ] 已添加或更新文档（如需要）
- [ ] 无硬编码颜色值（使用 CSS 变量）
- [ ] 提交信息符合规范

---

## 测试

当前项目未引入自动化测试框架。手动测试步骤如下：

1. **Player 模块**: 加载音频文件，确认波形/频谱/粒子可视化正常显示，播放控制正常
2. **Synth 模块**: 按下每个键盘按键，确认发声和频谱显示正常，切换预设后参数正确更新
3. **响应式**: 缩放浏览器窗口，确认布局在不同断点下正常
4. **控制台**: 确认无报错信息

---

## 报告问题

提交 Issue 时请包含以下信息：

- **描述**: 清晰简洁地描述问题
- **复现步骤**: 如何复现该问题
- **预期行为**: 期望的正确行为
- **实际行为**: 实际发生的错误行为
- **环境信息**: 浏览器/操作系统版本
- **截图**: 如适用
