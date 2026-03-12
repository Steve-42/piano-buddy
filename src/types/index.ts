export interface PracticeSession {
  id?: number
  date: string // YYYY-MM-DD
  startTime: number // timestamp
  endTime: number | null // timestamp, null if in progress
  activeDuration: number // seconds of actual playing detected
  totalDuration: number // seconds from start to end
  aiMessage: string | null // LLM-generated encouragement
}

export interface UserSettings {
  id?: number
  dailyGoalMinutes: number
  reminderTime: string // HH:MM
  llmApiEndpoint: string
  llmApiKey: string
  llmModel: string
  backgroundImage: string // 自定义背景图片（data URL），空字符串表示使用默认渐变
}

// Vite 环境变量注入的内置 AI 配置（在 Vercel 后台设置）
export const BUILTIN_LLM = {
  endpoint: import.meta.env.VITE_LLM_ENDPOINT as string || '',
  apiKey: import.meta.env.VITE_LLM_API_KEY as string || '',
  model: import.meta.env.VITE_LLM_MODEL as string || '',
} as const

export const DEFAULT_SETTINGS: UserSettings = {
  dailyGoalMinutes: 30,
  reminderTime: '20:00',
  llmApiEndpoint: '',
  llmApiKey: '',
  llmModel: '',
  backgroundImage: '',
}

// 植物成长阶段定义
export interface GrowthStage {
  minMinutes: number
  emoji: string
  label: string
  scale: number
}

export const GROWTH_STAGES: readonly GrowthStage[] = [
  { minMinutes: 0, emoji: '🌰', label: '种子', scale: 1.0 },
  { minMinutes: 5, emoji: '🌱', label: '发芽', scale: 1.5 },
  { minMinutes: 15, emoji: '🌿', label: '成长', scale: 2.0 },
  { minMinutes: 30, emoji: '🌸', label: '开花', scale: 3.0 },
]

export function getGrowthStage(activeMinutes: number): GrowthStage {
  let stage = GROWTH_STAGES[0]
  for (const s of GROWTH_STAGES) {
    if (activeMinutes >= s.minMinutes) stage = s
  }
  return stage
}
