# 部署指南 — Soniq

> Soniq 是一款纯前端 Web 应用，无需后端服务器即可独立部署运行。

---

## 目录

- [环境要求](#环境要求)
- [快速部署](#快速部署)
- [构建与部署](#构建与部署)
- [服务器配置](#服务器配置)
- [GitHub Pages 部署](#github-pages-部署)
- [Docker 部署](#docker-部署)
- [性能优化](#性能优化)
- [注意事项](#注意事项)

---

## 环境要求

### 开发环境

| 工具 | 最低版本 | 说明 |
|------|----------|------|
| Node.js | 18.x | 运行时环境 |
| npm | 9.x | 包管理器 |

### 生产环境

部署 Soniq **无需**任何后端服务器。只需一个支持以下特性的现代浏览器：

- HTML5 / CSS3
- ECMAScript 2015+ (ES6)
- Web Audio API
- Canvas API

### 兼容浏览器

| 浏览器 | 最低版本 |
|--------|----------|
| Google Chrome | 80+ |
| Mozilla Firefox | 75+ |
| Apple Safari | 14.1+ |
| Microsoft Edge | 80+ |
| Opera | 64+ |

> 不支持 Internet Explorer。移动端 Safari 的 Web Audio API 可能受限。

---

## 快速部署

### 方式一：Vite 开发服务器（开发调试）

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 指定端口
npm run dev -- --port 3000

# 允许局域网访问
npm run dev -- --host
```

### 方式二：静态文件部署（生产环境）

```bash
# 构建生产版本
npm run build

# 部署 dist/ 目录到任意静态服务器
```

构建产物位于 `dist/` 目录，可直接部署到任意 HTTP 服务器。

---

## 构建与部署

### 生产构建

```bash
npm run build
```

构建产物包含以下优化：

- **代码分割**: Vue 运行时、Chart.js、math.js 分离为独立 chunk
- **CSS 压缩**: Tailwind 未使用样式被 tree-shaking
- **gzip 压缩**: 建议在服务器端启用 gzip（参考下方 Nginx 配置）
- **缓存策略**: 文件名含 content hash，支持长期缓存

### 预览生产构建

```bash
npm run preview
```

---

## 服务器配置

### Nginx

```nginx
server {
    listen 80;
    server_name soniq.example.com;
    root /var/www/soniq/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/css application/javascript image/svg+xml;
    gzip_min_length 1024;

    # SPA 路由支持（如果需要）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Apache

```apache
<VirtualHost *:80>
    ServerName soniq.example.com
    DocumentRoot /var/www/soniq/dist

    <Directory /var/www/soniq/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Gzip 压缩
    AddOutputFilterByType DEFLATE text/css application/javascript text/html
</VirtualHost>
```

---

## GitHub Pages 部署

### 从 gh-pages 分支

本项目的 `gh-pages` 分支已配置为 GitHub Pages 部署源：

1. 构建生产版本：`npm run build`
2. 将 `dist/` 内容提交并推送
3. 在仓库 Settings → Pages 中设置源为 `gh-pages` 分支

### 使用 GitHub Actions（自动部署）

在 `.github/workflows/deploy.yml` 中配置如下：

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [gh-pages]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 自定义域名

在 `dist/` 目录下创建 `CNAME` 文件：

```
soniq.example.com
```

---

## Docker 部署

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  soniq:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

---

## 性能优化

### 加载性能

- **Vite 构建**: ESM 模块 + Rollup 打包，Tree-shaking 去除无用代码
- **代码分割**: Vue / Chart.js / math.js 分离，并行加载
- **Google Fonts**: DM Sans 字体通过 CDN 预加载（`preconnect`）
- **gzip**: 构建产物体积约 300KB（gzip 后约 100KB）

### 运行时性能

- **Canvas 渲染**: 使用 `requestAnimationFrame` 同步刷新率，避免多余绘制
- **FFT 分析**: AnalyserNode 硬件加速，不占用主线程
- **粒子系统**: 每帧动态生成，不维护持久状态，避免内存泄漏
- **合成器**: AudioParam 原生调度（`setValueAtTime` / `linearRampToValueAtTime`），无需 JS 定时器

### 优化建议

| 场景 | 建议 |
|------|------|
| 大流量站点 | 启用 CDN，配置浏览器缓存 |
| 移动端 | 减小 FFT Size（512），关闭粒子效果 |
| 高并发 | 使用 Nginx 反向代理 + 负载均衡 |

---

## 注意事项

1. **AudioContext 策略**: 浏览器要求用户交互后激活音频上下文。页面加载后鼠标点击或按键即可激活。
2. **跨域问题**: 本地 `file://` 协议可能限制音频文件读取，建议使用 HTTP 服务器。
3. **音频格式**: MP3 / WAV / OGG 格式受支持，不支持 FLAC / ALAC 格式。
4. **浏览器标签页**: 未激活标签页的 `requestAnimationFrame` 会被浏览器限频，影响可视化帧率。
5. **iOS Safari**: 移动端 Safari 的 Web Audio API 延迟高于桌面端，合成器响应可能略有滞后。
