# Kontext 本地图片编辑器

一个基于 Flux Kontext dev 的图片编辑器前端界面，提供极简的图片编辑体验。

## ✨ 功能特性

- **🖼️ 图片上传**: 支持拖拽和点击上传 JPG/PNG 格式图片
- **✍️ 提示词编辑**: 直观的文本输入界面，支持中英文描述
- **🎯 一键处理**: 简单的点击即可调用 ComfyUI 工作流处理图片
- **📜 历史记录**: 自动保存编辑历史，支持版本切换比较
- **💾 快速下载**: 一键下载处理后的图片

## 🚀 快速开始

### 环境要求

- Node.js 16+ 
- npm 或 yarn
- 运行中的 ComfyUI 服务 (http://localhost:8188)

### 安装运行

```bash
# 克隆项目
git clone https://github.com/BronLau/kontext_dev_editor.git

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 使用方法

1. **启动应用**: 访问 http://localhost:3000
2. **上传图片**: 点击中央区域或拖拽图片文件上传
3. **输入提示词**: 在底部输入框描述你想要的编辑效果
4. **开始处理**: 点击"开始处理"按钮调用 ComfyUI
5. **查看结果**: 处理完成后查看新图片并可下载
6. **历史回顾**: 左侧面板查看和切换历史版本

## 🏗️ 技术架构

### 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式方案**: Tailwind CSS
- **状态管理**: Zustand
- **图标库**: Lucide React
- **开发工具**: ESLint + PostCSS

### 项目结构

```
src/
├── components/          # React 组件
│   ├── ImageCanvas.tsx     # 图片画布组件
│   ├── PromptInput.tsx     # 提示词输入组件  
│   ├── HistoryPanel.tsx    # 历史记录面板
│   └── ErrorToast.tsx      # 错误提示组件
├── store/              # 状态管理
│   └── useAppStore.ts      # Zustand 状态管理
├── types/              # TypeScript 类型定义
│   └── index.ts
├── utils/              # 工具函数
│   └── imageUtils.ts       # 图片处理工具
├── App.tsx             # 主应用组件
├── main.tsx            # 应用入口
└── index.css           # 全局样式
```

## 🎨 界面预览

### 主界面布局

- **左侧**: 历史记录面板，显示编辑版本缩略图
- **中央**: 图片画布区域，支持上传和显示图片
- **底部**: 提示词输入和处理控制区域
- **顶部**: 应用标题和状态信息

### 交互流程

1. 空状态显示上传提示
2. 图片上传后显示在画布中央
3. 输入提示词，状态指示器实时反馈
4. 处理过程中显示加载状态和进度
5. 完成后自动更新画布，历史版本进入左侧面板

## 🔌 ComfyUI 集成

### API 接口

1. 确保 ComfyUI 服务运行在 `http://localhost:8188`

```

## 📝 待办事项

- [ ] 添加图片处理参数配置
- [ ] 支持批量图片处理
- [ ] 添加更多图片格式支持
- [ ] 实现工作流选择功能
- [ ] 添加快捷键支持

## 🐛 已知问题

- 大文件上传可能需要进度指示
- 历史记录暂存在内存中，刷新页面会丢失

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！ 