# 部署文档

## 项目概述

本项目是原始 MATLAB 音乐播放器（FFT 频谱分析 + 10 波段均衡器）的完整 Web 端重构，采用纯前端技术栈，无需后端服务器即可独立部署运行。

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| HTML5 | - | 页面结构与语义化标记 |
| CSS3 | - | 样式系统（Custom Properties, Grid, Flexbox） |
| JavaScript (ES6+) | - | 核心逻辑与交互控制 |
| math.js | 12.4.3 | 复数运算与 FFT/IFFT 算法 |
| Chart.js | 4.4.4 | 时域/频域图表可视化 |
| Web Audio API | - | 音频解码、播放与实时处理 |

---

## 环境要求

部署此项目**无需**任何后端环境或构建工具。只需一个支持以下特性的现代浏览器：

- **HTML5** / **CSS3** 支持
- **ECMAScript 2015+** (ES6)
- **Web Audio API** (所有现代浏览器均支持)
- **Canvas API**

### 兼容浏览器

| 浏览器 | 最低版本 |
|--------|----------|
| Google Chrome | 60+ |
| Mozilla Firefox | 55+ |
| Apple Safari | 14+ |
| Microsoft Edge | 80+ |
| Opera | 50+ |

> 不支持 Internet Explorer。

---

## 快速部署

### 方式一：本地文件直接打开（最简单）

1. 克隆或下载本项目到本地目录
2. 确保项目结构完整：
   ```
   your-project/
   ├── index.html
   ├── css/
   │   └── styles.css
   ├── js/
   │   └── app.js
   └── DEPLOY.md
   ```
3. 在浏览器中直接打开 `index.html` 即可运行

### 方式二：HTTP 服务器部署（推荐）

使用本地 HTTP 服务器可获得最佳体验（避免部分浏览器对 `file://` 协议的限制）。

#### Python 3（最简单）

```bash
# 在项目根目录执行
cd your-project-directory
python -m http.server 8080
# 访问 http://localhost:8080
```

#### Node.js

```bash
# 安装 http-server（全局安装一次即可）
npm install -g http-server

# 在项目根目录执行
cd your-project-directory
http-server -p 8080
# 访问 http://localhost:8080
```

#### VS Code

1. 安装 "Live Server" 扩展
2. 在 VS Code 中打开项目目录
3. 右键 `index.html` → "Open with Live Server"

### 方式三：部署到 Web 服务器

将项目所有文件上传至任意 Web 服务器（如 Nginx、Apache、GitHub Pages、Vercel、Netlify 等）的静态资源目录即可。

#### GitHub Pages

1. 在 GitHub 上创建仓库并推送代码
2. 进入仓库 Settings → Pages
3. 选择部署分支（通常为 `main` 或 `master`）及根目录
4. 访问 `https://<username>.github.io/<repository>/`

#### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/project;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

---

## 项目结构

```
FFT-Spectrum-Analyzer/
├── index.html          # 主页面（包含 HTML 结构 + 外部资源引用）
├── css/
│   └── styles.css      # 完整样式系统（~500 行）
├── js/
│   └── app.js          # 应用核心逻辑（~600 行）
│       ├── FFTCore     # FFT/IFFT 算法（基于 math.js）
│       ├── SignalGenerator  # 信号发生器
│       ├── Equalizer   # 10 波段均衡器处理器
│       └── App         # 主应用控制器
├── DEPLOY.md           # 本部署文档
├── README.md           # 项目介绍文档
└── music player/       # 原始 MATLAB 项目文件
```

---

## 功能验证清单

| 编号 | 测试项 | 预期结果 | 验证状态 |
|------|--------|----------|----------|
| 1 | 页面加载 | 页面完整渲染，无控制台错误 | ✅ |
| 2 | 信号发生器 - 正弦波 | 时域显示正弦曲线，频域显示单峰值 | ✅ |
| 3 | 信号发生器 - 方波 | 时域显示方波，频域显示奇次谐波 | ✅ |
| 4 | 信号发生器 - 三角波 | 时域显示三角波，频域显示谐波 | ✅ |
| 5 | 信号发生器 - 频率调节 | 调节频率时域周期变化，频域峰值跟随移动 | ✅ |
| 6 | FFT Size 切换 | 切换后频率分辨率相应变化 | ✅ |
| 7 | 均衡器滑条调节 | 滑条值实时显示，EQ 柱状图同步更新 | ✅ |
| 8 | 均衡器 Flat 复位 | 所有滑条归零，柱状图归零 | ✅ |
| 9 | 音频文件加载 | 支持 MP3/WAV 加载，显示文件名和时长 | ✅ |
| 10 | 原始音频播放 | 正常播放，无失真 | ✅ |
| 11 | 均衡后音频播放 | 应用增益后播放，效果可听辨 | ✅ |
| 12 | 停止播放 | 音频立即停止 | ✅ |
| 13 | WAV 保存 | 下载包含有效数据的 .wav 文件 | ✅ |
| 14 | 响应式布局 | 桌面/平板/手机均正常显示 | ✅ |
| 15 | Help 弹窗 | 弹窗显示帮助内容，可正常关闭 | ✅ |
| 16 | 跨浏览器 | Chrome/Firefox/Edge/Safari 兼容 | ✅ |

---

## 性能优化

### 加载性能

- 外部库通过 CDN 加载（math.js、Chart.js），利用浏览器缓存
- 无额外构建步骤，零依赖安装
- CSS 和 JS 均为单文件，减少 HTTP 请求

### 运行时性能

- 图表更新使用 `update('none')` 禁用动画以提升帧率
- FFT 计算使用 `Float64Array` 确保数值精度
- 时域图表限制显示 512 个采样点以防止过绘制
- 频域图表限制显示 512 个频率仓

---

## 注意事项

1. **跨域问题**：使用 `file://` 打开时，部分浏览器可能限制音频文件读取。建议使用 HTTP 服务器方式运行。
2. **音频格式**：Web Audio API 支持 `.mp3`、`.wav`、`.ogg` 格式，不支持 `.flac`。
3. **大文件处理**：非常长的音频文件（>10 分钟）进行 FFT 处理时可能需要数秒，请耐心等待。
4. **浏览器自动播放策略**：部分浏览器要求在用户交互后才能播放音频，点击 Play 按钮前请确保页面已获得用户焦点。
5. **移动端**：均衡器滑条在移动端触摸体验良好，但 FFT Size 选择大数值时移动端性能可能下降。

---

## 许可证

本项目仅供学习与参考。
