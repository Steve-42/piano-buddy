# Piano Buddy

帮你坚持每天练琴的 AI 伙伴。

不是教你弹对，而是帮你坚持弹。

## 功能

- **音频检测**：通过麦克风检测钢琴声，自动记录实际弹奏时间
- **AI 鼓励**：练习结束后生成基于数据的真诚鼓励（支持 OpenAI 兼容 API）
- **练习追踪**：每日目标进度、连续天数、历史记录
- **隐私优先**：所有数据存储在本地，音频仅在内存中分析

## 快速开始

```bash
npm install
npm run dev
```

打开浏览器访问 `http://localhost:5173`。

## 技术栈

- React + TypeScript + Vite
- Tailwind CSS
- PWA（可安装到手机桌面）
- IndexedDB（本地数据存储）
- Web Audio API（音频检测）

## AI 配置

在设置页面配置 OpenAI 兼容 API 的地址和密钥即可获得个性化 AI 鼓励。
未配置时使用内置的默认鼓励语，不影响核心功能。

## 开源协议

MIT
