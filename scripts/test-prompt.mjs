// 提示词测试脚本：模拟不同练习场景，对比模型输出
// 用法: node scripts/test-prompt.mjs [模型名]

import { readFileSync } from 'fs'

// 读取 API 配置
const envContent = readFileSync('.env.test', 'utf-8')
const env = Object.fromEntries(
  envContent.trim().split('\n').map(line => line.split('=').map(s => s.trim()))
)
const API_BASE = env.LLM_API_BASE
const API_KEY = env.LLM_API_KEY
const MODEL = process.argv[2] || 'gpt-4o'

// ========== 提示词定义 ==========

const SYSTEM_PROMPT = `你是 Piano Buddy，一个温暖、真诚的钢琴练习伙伴。

## 你的身份
- 像一个关心对方的好朋友，不是老师或教练
- 你在陪伴用户的练琴旅程，注意到他们的每一点变化

## 回复规则
1. 简短有力：2-3 句话，不超过 80 字
2. 基于数据：必须引用至少一个具体数字或事实
3. 禁止空洞的话："继续加油""你很棒"这类不说
4. 语气自然：像朋友发微信，不像机器人
5. 如果练习时间很短，肯定"坐下来开始"的行为本身

## 可以关注的角度（选 1-2 个，不要全用）
- 专注度：弹奏时间占总时间的比例
- 时段：早起/深夜练琴值得一提
- 趋势：和最近几天对比，是否有变化
- 目标：完成度、超额或差一点
- 坚持：连续天数是一个里程碑
- 回归：中断后重新开始很难得`

function buildUserMessage(scenario) {
  const {
    activeDuration,
    totalDuration,
    dailyGoal,
    streak,
    daysSinceLastPractice,
    timeOfDay,
    weeklyTotalMin,
    lastWeekTotalMin,
  } = scenario

  const activeMin = Math.round(activeDuration / 60)
  const totalMin = Math.round(totalDuration / 60)
  const focusRatio = totalDuration > 0
    ? Math.round((activeDuration / totalDuration) * 100)
    : 0
  const goalCompletion = Math.round((activeMin / dailyGoal) * 100)

  return `练习数据：
- 弹奏 ${activeMin} 分钟 / 总时长 ${totalMin} 分钟（专注度 ${focusRatio}%）
- 时段：${timeOfDay}
- 今日目标：${dailyGoal} 分钟（完成 ${goalCompletion}%）
- 连续练习：${streak} 天
- 距上次：${daysSinceLastPractice} 天
- 本周累计：${weeklyTotalMin} 分钟｜上周：${lastWeekTotalMin} 分钟

请给一条简短鼓励。`
}

// ========== 测试场景 ==========

const SCENARIOS = {
  '短暂练习': {
    activeDuration: 180, totalDuration: 300, dailyGoal: 30,
    streak: 0, daysSinceLastPractice: 5, timeOfDay: '晚上 21:30',
    weeklyTotalMin: 3, lastWeekTotalMin: 0,
  },
  '超额完成': {
    activeDuration: 2700, totalDuration: 3000, dailyGoal: 30,
    streak: 7, daysSinceLastPractice: 0, timeOfDay: '下午 16:00',
    weeklyTotalMin: 180, lastWeekTotalMin: 150,
  },
  '深夜坚持': {
    activeDuration: 1200, totalDuration: 1800, dailyGoal: 30,
    streak: 3, daysSinceLastPractice: 0, timeOfDay: '深夜 23:45',
    weeklyTotalMin: 90, lastWeekTotalMin: 60,
  },
  '中断回归': {
    activeDuration: 600, totalDuration: 900, dailyGoal: 30,
    streak: 0, daysSinceLastPractice: 14, timeOfDay: '上午 10:00',
    weeklyTotalMin: 10, lastWeekTotalMin: 0,
  },
  '刚好达标': {
    activeDuration: 1800, totalDuration: 2400, dailyGoal: 30,
    streak: 15, daysSinceLastPractice: 0, timeOfDay: '傍晚 18:30',
    weeklyTotalMin: 150, lastWeekTotalMin: 140,
  },
}

// ========== 调用 API ==========

async function callLLM(messages) {
  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 2000,
      temperature: 0.8,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`API ${response.status}: ${body.slice(0, 200)}`)
  }

  const data = await response.json()
  return data.choices[0].message.content.trim()
}

// ========== 运行测试 ==========

console.log(`\n模型: ${MODEL}`)
console.log('='.repeat(60))

for (const [name, scenario] of Object.entries(SCENARIOS)) {
  const userMsg = buildUserMessage(scenario)
  console.log(`\n【${name}】`)
  console.log(`  ${userMsg.split('\n').join('\n  ')}`)
  console.log(`  ---`)

  try {
    const reply = await callLLM([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMsg },
    ])
    console.log(`  回复: ${reply}`)
  } catch (err) {
    console.log(`  错误: ${err.message}`)
  }
}

console.log('\n' + '='.repeat(60))
