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

// 注：植物档位逻辑已移到 styles/tokens.ts (plantStageForMinutes / PlantStage)
// 旧的 emoji-based GROWTH_STAGES 在 Claude Design 改版后删除
