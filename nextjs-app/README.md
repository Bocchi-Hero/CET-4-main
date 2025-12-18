# CET-4 Vocabulary Master (Next.js 版)

基于 SM-2 算法的 CET-4 英语四级高频词汇学习应用 - Next.js 前后端分离版本。

## 🔐 安全特性

- **API Key 安全存储**: Gemini API Key 存储在服务端环境变量中，不会暴露给客户端
- **后端 AI 调用**: 所有 AI 功能通过 `/api/ai/*` 路由在服务端执行
- **API 路由保护**: 客户端无法直接访问 Gemini API

## 🚀 快速开始

### 1. 安装依赖

```bash
cd nextjs-app
npm install
```

### 2. 配置环境变量

在 `nextjs-app` 目录下创建 `.env.local` 文件（已创建模板）：

```env
# Gemini API Key - 从 Google AI Studio 获取
GEMINI_API_KEY=your_actual_api_key_here
```

获取 API Key: https://aistudio.google.com/apikey

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
nextjs-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── ai/              # AI API 路由（服务端）
│   │   │       ├── word-help/   # 单词详解
│   │   │       ├── quick-define/# 快速定义
│   │   │       └── generate-batch/ # 批量生成
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/              # React 组件
│   ├── constants/               # 常量与词库数据
│   ├── lib/                     # 服务端库
│   │   └── gemini.ts           # Gemini AI 服务（服务端）
│   ├── services/                # 客户端服务
│   │   ├── geminiService.ts    # AI 服务客户端（调用 API 路由）
│   │   ├── dbService.ts        # IndexedDB 本地存储
│   │   └── sm2Service.ts       # SM-2 记忆算法
│   └── types/                   # TypeScript 类型定义
├── .env.local                   # 环境变量（API Key 存这里）
├── .env.example                 # 环境变量模板
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 🔑 API 安全架构

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    客户端       │       │    服务端       │       │   Google AI     │
│   (Browser)     │  -->  │  (Next.js API)  │  -->  │   (Gemini)      │
│                 │       │                 │       │                 │
│ geminiService   │ HTTP  │ /api/ai/*       │ SDK   │ Gemini API      │
│ (fetch调用)     │ POST  │ + process.env   │       │                 │
│                 │       │ .GEMINI_API_KEY │       │                 │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                              ↑
                              │
                    API Key 安全存储在这里
                    客户端无法访问
```

## ✨ 主要功能

- 📚 **词库学习**: 基于 SM-2 算法的科学记忆法
- 🔄 **智能复习**: 自动提醒到期单词
- ✅ **实战测试**: 填空与释义双模式测试
- 📷 **OCR 识词**: 图片文字识别提取生词
- 🔍 **AI 词典**: Gemini AI 提供详细词解
- ⭐ **生词收藏**: 手动标记重点词汇
- 📊 **学情统计**: 可视化学习进度

## 📦 技术栈

- **框架**: Next.js 14 (App Router)
- **UI**: React 18 + Tailwind CSS
- **AI**: Google Gemini API
- **图表**: Chart.js + react-chartjs-2
- **OCR**: Tesseract.js
- **存储**: IndexedDB (客户端)
- **算法**: SM-2 间隔重复

## 📝 从原项目迁移

原项目是纯前端 Vite + React 应用，API Key 暴露在客户端。
本项目迁移到 Next.js 架构，实现：

1. API Key 移至服务端 `.env.local`
2. 创建 API 路由处理 AI 请求
3. 前端通过 fetch 调用后端 API
4. 保持原有功能和 UI 不变

## ⚠️ 注意事项

- 确保 `.env.local` 不要提交到 Git（已在 .gitignore 中排除）
- IndexedDB 仅在浏览器端可用，因此页面使用 `dynamic import` 禁用 SSR
- Tesseract OCR 功能需要下载语言包，首次使用可能较慢
