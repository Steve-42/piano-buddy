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
}
