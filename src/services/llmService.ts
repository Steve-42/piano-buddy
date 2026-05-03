// LLM 服务：调用 OpenAI 兼容 API 生成有温度的鼓励语
//
// 配置优先级：
// 1. 用户在 Settings 里填了自己的 key  → 用用户的 endpoint/key/model
// 2. 环境变量 VITE_LLM_API_KEY 存在     → 用 BUILTIN_LLM (legacy 路径，key 会进 bundle)
// 3. fallback                           → 走同源 /api/llm 反代 (key 留在 nginx 服务器，最安全)

import { getSettings } from './db'
import { BUILTIN_LLM, BUILTIN_PROXY } from '../types'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ResolvedConfig {
  endpoint: string
  model: string
  apiKey: string  // 空字符串表示走 nginx 注入 (proxy mode)
  isProxy: boolean
}

function resolveLLMConfig(settings: {
  llmApiEndpoint: string
  llmApiKey: string
  llmModel: string
}): ResolvedConfig {
  // 1. 用户配置了自己的 Key
  if (settings.llmApiKey) {
    return {
      endpoint: settings.llmApiEndpoint,
      model: settings.llmModel,
      apiKey: settings.llmApiKey,
      isProxy: false,
    }
  }
  // 2. legacy: 环境变量内置 key
  if (BUILTIN_LLM.apiKey) {
    return {
      endpoint: BUILTIN_LLM.endpoint,
      model: BUILTIN_LLM.model,
      apiKey: BUILTIN_LLM.apiKey,
      isProxy: false,
    }
  }
  // 3. 默认：走同源 nginx 反代（key 在服务器端注入）
  return {
    endpoint: BUILTIN_PROXY.endpoint,
    model: BUILTIN_PROXY.model,
    apiKey: '',
    isProxy: true,
  }
}

// 鼓励消息的上下文
export interface EncouragementContext {
  activeDuration: number // 实际弹奏秒数
  totalDuration: number // 总时长秒数
  dailyGoal: number // 每日目标（分钟）
  streak: number // 连续练习天数
  daysSinceLastPractice: number // 距上次练习的天数
  timeOfDay: string // 练习时段（如 "晚上 21:30"）
  weeklyTotalMin: number // 本周累计弹奏（分钟）
  lastWeekTotalMin: number // 上周累计弹奏（分钟）
}

const ENCOURAGEMENT_SYSTEM_PROMPT = `你是 Piano Buddy，一个温暖、真诚的钢琴练习伙伴。

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
- 回归：中断后重新开始很难得

## 特殊情况：断练回归（"距上次" ≥ 3 天）
这是用户中断后回到琴前的第一次，是最关键的时刻。规则：
- 绝对不要提"中断了几天""终于回来了"这种凸显中断的话
- 不强调今天弹了多少（数据可能很少，强调反而打击）
- 重点是"你坐下来了"这个事实本身，用一句温柔的存在感肯定即可
- 例："看到你了。今天 N 分钟，刚刚好。"`

function buildEncouragementMessage(context: EncouragementContext): string {
  const activeMin = Math.round(context.activeDuration / 60)
  const totalMin = Math.round(context.totalDuration / 60)
  const focusRatio = context.totalDuration > 0
    ? Math.round((context.activeDuration / context.totalDuration) * 100)
    : 0
  const goalCompletion = Math.round((activeMin / context.dailyGoal) * 100)

  return `练习数据：
- 弹奏 ${activeMin} 分钟 / 总时长 ${totalMin} 分钟（专注度 ${focusRatio}%）
- 时段：${context.timeOfDay}
- 今日目标：${context.dailyGoal} 分钟（完成 ${goalCompletion}%）
- 连续练习：${context.streak} 天
- 距上次：${context.daysSinceLastPractice} 天
- 本周累计：${context.weeklyTotalMin} 分钟｜上周：${context.lastWeekTotalMin} 分钟

请给一条简短鼓励。`
}

// 生成练习结束后的鼓励消息
export async function generateEncouragement(
  context: EncouragementContext,
): Promise<string> {
  const settings = await getSettings()
  const config = resolveLLMConfig(settings)

  try {
    return await callLLM(config, [
      { role: 'system', content: ENCOURAGEMENT_SYSTEM_PROMPT },
      { role: 'user', content: buildEncouragementMessage(context) },
    ])
  } catch (error) {
    console.error('LLM 鼓励生成失败:', error)
    return getDefaultEncouragement(context)
  }
}

// 生成每日提醒消息
export async function generateReminder(context: {
  streak: number
  daysSinceLastPractice: number
  lastSessionDuration: number | null // 上次练习时长（秒）
}): Promise<string> {
  const settings = await getSettings()
  const config = resolveLLMConfig(settings)

  const systemPrompt = `你是一个温暖的钢琴练习伙伴。现在需要提醒用户去练琴。

你的风格：
- 温和，不施压
- 像朋友的轻推，不是闹钟的催促
- 如果用户已经连续练了很多天，要表达你注意到了
- 如果用户中断了几天，要体谅而不是责备
- 简短，1-2 句话

## 断练回归的特殊规则（"距上次" ≥ 3 天）
- 不要提具体中断了几天，不要让用户感受到"你又被记录了"
- 不要承诺式的话："欢迎回来""期待你""一起加油"——太正式
- 像很久没联系的朋友突然发的一条消息，轻、短、不带追问
- 例：「最近忙吗？想到你了。」「今天天气不错，琴还好吗？」`

  const userMessage = `当前情况：
- 连续练习：${context.streak} 天
- 距上次练习：${context.daysSinceLastPractice} 天
- 上次练习时长：${context.lastSessionDuration ? Math.round(context.lastSessionDuration / 60) + ' 分钟' : '无记录'}

请生成一条温暖的提醒。`

  try {
    return await callLLM(config, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ])
  } catch (error) {
    console.error('LLM 提醒生成失败:', error)
    return getDefaultReminder(context)
  }
}

// 判断用户自定义 endpoint 是否需要走 dev proxy（HTTPS→HTTP 混合内容问题）
function needsDevProxy(endpoint: string): boolean {
  if (!import.meta.env.DEV) return false
  if (typeof window === 'undefined') return false
  const pageIsHttps = window.location.protocol === 'https:'
  const apiIsHttp = endpoint.startsWith('http://')
  return pageIsHttps && apiIsHttp
}

// 调用 OpenAI 兼容 API
async function callLLM(config: ResolvedConfig, messages: ChatMessage[]): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  // proxy 模式：不带 Authorization，由 nginx 注入；用户/legacy 模式：带 key
  if (!config.isProxy && config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`
  }

  // proxy 路径同源，永远不需要 dev 转发；用户自填的 HTTP endpoint 仍然走老代理
  const fetchUrl =
    !config.isProxy && needsDevProxy(config.endpoint)
      ? `/api/llm-proxy/${encodeURIComponent(config.endpoint)}`
      : config.endpoint

  const response = await fetch(fetchUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: 2000, // 思考模型（如 gemini-2.5-pro）会消耗大量 token 做内部推理
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
  if (context.daysSinceLastPractice <= 2) {
    return '好几天没弹了，没关系，随时可以重新开始。'
  }
  // ≥ 3 天断练：温和、短、不追问
  return '最近忙吗？想到你了。'
}
