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

// 同源代理：默认 AI 走 nginx 反代到内部 LLM 服务，key 不出服务器
// 任何用户访问 piano.huttonorbital.top 都会自动启用 AI，无需自己配置
export const BUILTIN_PROXY = {
  endpoint: '/api/llm',
  model: 'claudeP-opus-4-6',
} as const

// 兼容旧路径：通过环境变量内置 key（不安全，会进 JS bundle，仅用于兼容老部署）
// 优先级低于 BUILTIN_PROXY；新部署不要用这个
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
