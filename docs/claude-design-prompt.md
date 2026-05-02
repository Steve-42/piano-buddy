# Claude Design 开场 Prompt

> 用法：打开 https://claude.ai/design，新建项目，把下面整段粘到对话框。
> Onboarding 阶段链接 GitHub 仓库 `https://github.com/Steve-42/piano-buddy`
> 并用 Web Capture 抓取 `https://piano-buddy-rho.vercel.app`。

---

## Prompt 内容

```
我在做一个叫 Piano Buddy 的 PWA，定位是"成人业余自学钢琴的习惯陪伴 App"——
不教你弹对，帮你坚持弹。代码我已链接（GitHub: Steve-42/piano-buddy，
线上：piano-buddy-rho.vercel.app）。

## 用户画像
30 岁左右上班族，自学钢琴 0-2 年，时间碎片，最大痛点是"看不见进步"
和"断练后愧疚→放弃"。手机端使用为主，每次开 App 时间 10 秒-1 小时不等。

## 现有设计语言（请保留并精修，不要推翻）
- 主题：米色 / 米白磨砂玻璃（cream + frosted glass）
- 强调色：emerald（绿色）—— 代表生长
- 隐喻：植物成长（🌰 种子 → 🌱 发芽 → 🌿 成长 → 🌸 开花），按今日实际弹奏
  分钟数演进
- 动效：练习时音符 emoji（🎵 🎶 🎼）从顶部缓慢飘落
- 情绪：低压、温柔、不施压；不要任何"加油""坚持""你能行"的鸡汤感
- 不要：游戏化积分、排行榜、社交元素、教学反馈

## 我希望你重做的 5 个屏幕（按优先级）

### 1. 首页（HomePage）★★★ 最优先
当前问题：信息单薄，只有"今日 X 分钟 + 连续 N 天"，看不到长期成长。
希望加入：
- 一个"过去 30 天热力图"或"365 天成长曲线"卡片（核心新增）
- 软连续天数（允许中断 1 天不清零，用细微视觉区分"硬续"vs"软续"）
- 当用户≥3 天没练时，首屏显示一个特殊的"欢迎回来"卡片（米色更暖、
  emerald 强调、文案占主导），而不是普通的 AI 提醒
- 「开始练琴」CTA 仍是视觉重心

### 2. 练习中（PracticeView）★★ 次优先
当前问题：信息层级模糊，植物 emoji 略小。
希望优化：
- 植物作为绝对视觉主角（中央巨大）
- 计时器降级为辅助信息
- 麦克风状态指示更克制（小圆点已经在做，可以更优雅）
- 飘落音符层次更丰富（多种透明度、大小、旋转）

### 3. 练习结束（PracticeView 的 finished 态）★★
- 植物最终态全屏 celebration（不要 confetti，要克制的发光）
- AI 鼓励文案要有"被认真读"的设计感（衬线字体？大行距？）
- 一个"看看本周轨迹"的次要 CTA（连接到历史）

### 4. 历史（HistoryView）★
- 30 天热力图 + 月度回看 + 我的练琴画像（什么时段最常练、平均时长）
- 长期可视化是用户能"看见进步"的核心载体

### 5. 设置（SettingsView）★
当前还是上一版的深色配色（slate/indigo），需要统一到新主题。
功能维持不变：每日目标、AI API 配置、背景图上传。

## 技术约束（让生成的代码能直接落地）
- React 19 + TypeScript + Tailwind CSS v4
- 移动端优先（max-w-md 容器，PWA）
- 不要引入新依赖（已有：react、react-dom、dexie、react-router-dom）
- 不要用 framer-motion（项目没装，纯 CSS 动效 OK）
- 现有数据 hooks 不动：getSessionsByDate, getStreak, getRecentSessions,
  getSettings, generateReminder, generateEncouragement

## 工作方式
请先生成首页（屏幕 1）的 2-3 版方向，让我挑。我选定后再依次推进其他屏。
完成后用 "Handoff to Claude Code" 打包，我会接到 Claude Code 里整合。

参考线上现状请用 Web Capture：piano-buddy-rho.vercel.app
```

---

## 注意事项

- 不要一次让 Claude Design 生成全部 5 屏 —— 信息太多容易跑偏，按优先级一屏一屏来
- Web Capture 用过一次就够，主要是让模型理解现状，不是要它复刻
- 选定首页方向后，再让它派生其他屏的设计（保持一致性）
- 满意后点 **"Handoff to Claude Code"**，会得到一段 prompt + bundle URL，
  把那段 prompt 整段贴回 Claude Code 给我，我会自动 fetch bundle 并落地
