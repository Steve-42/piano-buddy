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

export const DEFAULT_SETTINGS: UserSettings = {
  dailyGoalMinutes: 30,
  reminderTime: '20:00',
  llmApiEndpoint: 'https://api.openai.com/v1/chat/completions',
  llmApiKey: '',
  llmModel: 'gpt-4o-mini',
}
