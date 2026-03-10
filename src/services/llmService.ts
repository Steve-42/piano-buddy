// LLM 服务：调用 OpenAI 兼容 API 生成有温度的鼓励语

import { getSettings } from './db'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// 生成练习结束后的鼓励消息
export async function generateEncouragement(context: {
  activeDuration: number // 实际弹奏秒数
  totalDuration: number // 总时长秒数
  dailyGoal: number // 每日目标（分钟）
  streak: number // 连续练习天数
  daysSinceLastPractice: number // 距上次练习的天数
}): Promise<string> {
  const settings = await getSettings()

  if (!settings.llmApiKey) {
    return getDefaultEncouragement(context)
  }

  const activeMin = Math.round(context.activeDuration / 60)
  const totalMin = Math.round(context.totalDuration / 60)

  const systemPrompt = `你是一个温暖、真诚的钢琴练习伙伴。你的任务是在用户完成练琴后给予鼓励。

你的风格：
- 像一个关心你的好朋友，不是老师或教练
- 真诚，不要空洞的赞美
- 注意到具体的细节（练习时长、坚持天数等）
- 简短有力，2-3 句话即可
- 如果用户练的时间很短，也要肯定他们坐下来开始的勇气
- 偶尔用轻松幽默的方式

重要：不要说"继续加油"这类空洞的话。要基于数据说出具体的观察。`

  const userMessage = `用户刚完成一次练琴：
- 实际弹奏时间：${activeMin} 分钟
- 总时长：${totalMin} 分钟
- 每日目标：${context.dailyGoal} 分钟
- 连续练习：${context.streak} 天
- 距上次练习：${context.daysSinceLastPractice} 天

请给予简短的鼓励。`

  if (!settings.llmApiKey) {
    return getDefaultEncouragement(context)
  }

  // 有 API Key 时调用 LLM，失败则抛出错误让调用方处理
  return await callLLM(settings, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ])
}

// 生成每日提醒消息
export async function generateReminder(context: {
  streak: number
  daysSinceLastPractice: number
  lastSessionDuration: number | null // 上次练习时长（秒）
}): Promise<string> {
  const settings = await getSettings()

  if (!settings.llmApiKey) {
    return getDefaultReminder(context)
  }

  const systemPrompt = `你是一个温暖的钢琴练习伙伴。现在需要提醒用户去练琴。

你的风格：
- 温和，不施压
- 像朋友的轻推，不是闹钟的催促
- 如果用户已经连续练了很多天，要表达你注意到了
- 如果用户中断了几天，要体谅而不是责备
- 简短，1-2 句话`

  const userMessage = `当前情况：
- 连续练习：${context.streak} 天
- 距上次练习：${context.daysSinceLastPractice} 天
- 上次练习时长：${context.lastSessionDuration ? Math.round(context.lastSessionDuration / 60) + ' 分钟' : '无记录'}

请生成一条温暖的提醒。`

  try {
    return await callLLM(settings, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ])
  } catch (error) {
    console.error('LLM 提醒生成失败:', error)
    return getDefaultReminder(context)
  }
}

// 判断是否需要走代理（HTTPS 页面访问 HTTP API 时需要）
function needsProxy(endpoint: string): boolean {
  if (typeof window === 'undefined') return false
  const pageIsHttps = window.location.protocol === 'https:'
  const apiIsHttp = endpoint.startsWith('http://')
  return pageIsHttps && apiIsHttp
}

// 调用 OpenAI 兼容 API
async function callLLM(
  settings: { llmApiEndpoint: string; llmApiKey: string; llmModel: string },
  messages: ChatMessage[],
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${settings.llmApiKey}`,
  }

  // 如果页面是 HTTPS 但 API 是 HTTP，走 Vite 代理避免混合内容限制
  // 将目标 URL 编码到代理路径中: /api/llm-proxy/<encoded-url>
  const fetchUrl = needsProxy(settings.llmApiEndpoint)
    ? `/api/llm-proxy/${encodeURIComponent(settings.llmApiEndpoint)}`
    : settings.llmApiEndpoint

  const response = await fetch(fetchUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: settings.llmModel,
      messages,
      max_tokens: 200,
      temperature: 0.8,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`LLM API 错误 ${response.status}: ${body.slice(0, 200)}`)
  }

  const data = await response.json()
  return data.choices[0].message.content.trim()
}

// 当 API 不可用时的默认鼓励语
function getDefaultEncouragement(context: {
  activeDuration: number
  dailyGoal: number
  streak: number
}): string {
  const activeMin = Math.round(context.activeDuration / 60)
  const goalReached = activeMin >= context.dailyGoal

  if (goalReached) {
    return `太棒了！今天练了 ${activeMin} 分钟，达成目标！${context.streak > 1 ? `已经连续 ${context.streak} 天了，这份坚持很了不起。` : ''}`
  }

  if (activeMin >= 5) {
    return `今天练了 ${activeMin} 分钟，每一分钟都算数。${context.streak > 0 ? `连续第 ${context.streak} 天坐到琴凳上，这本身就很棒。` : '能开始就是最大的胜利。'}`
  }

  return '今天坐到了琴凳上，这就是一个好的开始。明天再见！'
}

// 默认提醒语
function getDefaultReminder(context: {
  streak: number
  daysSinceLastPractice: number
}): string {
  if (context.daysSinceLastPractice === 0) {
    return '今天还没有练琴哦，要不要弹一会儿？'
  }
  if (context.daysSinceLastPractice <= 1) {
    return context.streak > 3
      ? `已经连续 ${context.streak} 天了，今天继续？`
      : '新的一天，来弹弹琴吧？'
  }
  if (context.daysSinceLastPractice <= 3) {
    return '好几天没弹了，没关系，随时可以重新开始。'
  }
  return '想你了。什么时候方便弹一会儿？'
}
