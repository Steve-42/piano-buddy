// 首页：展示今日状态、植物、AI 消息、开始练琴按钮

import { useEffect, useState } from 'react'
import {
  getSessionsByDate,
  getStreakInfo,
  getRecentSessions,
  getSettings,
} from '../services/db'
import { generateReminder } from '../services/llmService'
import type { PracticeSession } from '../types'
import { getGrowthStage } from '../types'

interface HomePageProps {
  onStartPractice: () => void
  onNavigate: (page: 'history' | 'settings') => void
}

// 距上次练习多少天起，触发"回归态"温柔提醒
const RETURNING_THRESHOLD_DAYS = 3

export function HomePage({ onStartPractice, onNavigate }: HomePageProps) {
  const [todaySessions, setTodaySessions] = useState<PracticeSession[]>([])
  const [streak, setStreak] = useState(0)
  const [streakIsSoft, setStreakIsSoft] = useState(false)
  const [daysSinceLastPractice, setDaysSinceLastPractice] = useState(0)
  const [reminder, setReminder] = useState('')
  const [dailyGoal, setDailyGoal] = useState(30)
  const [backgroundImage, setBackgroundImage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const today = new Date().toISOString().slice(0, 10)
    const sessions = await getSessionsByDate(today)
    setTodaySessions(sessions)

    const streakInfo = await getStreakInfo()
    setStreak(streakInfo.days)
    setStreakIsSoft(streakInfo.isSoft)
    // 今天已练 → 距上次为 0；否则用 streakInfo 算出的天数
    const effectiveDaysSince =
      sessions.length > 0 ? 0 : streakInfo.daysSinceLastPractice
    setDaysSinceLastPractice(effectiveDaysSince)

    const settings = await getSettings()
    setDailyGoal(settings.dailyGoalMinutes)
    setBackgroundImage(settings.backgroundImage || '')

    // 获取提醒消息（最近一次练习时长用于上下文）
    const recent = await getRecentSessions(7)
    const previousSessions = recent.filter((s) => s.date !== today)
    const lastSession = previousSessions[0]
    const msg = await generateReminder({
      streak: streakInfo.days,
      daysSinceLastPractice: effectiveDaysSince,
      lastSessionDuration: lastSession?.activeDuration ?? null,
    })
    setReminder(msg)
  }

  const isReturning =
    daysSinceLastPractice >= RETURNING_THRESHOLD_DAYS && todaySessions.length === 0

  // 今日已练总时长
  const todayActiveMinutes = Math.round(
    todaySessions.reduce((sum, s) => sum + s.activeDuration, 0) / 60,
  )
  const goalProgress = Math.min(100, (todayActiveMinutes / dailyGoal) * 100)
  const stage = getGrowthStage(todayActiveMinutes)

  return (
    <div
      className="garden-bg flex flex-col items-center min-h-screen px-6 py-8"
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}}
    >
      {/* 顶部导航 */}
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-stone-700">Piano Buddy</h1>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('history')}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            历史
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            设置
          </button>
        </div>
      </div>

      {/* 连续天数 */}
      {streak > 0 && (
        <div className="mb-6 text-center">
          <span className="text-4xl font-bold text-emerald-600">{streak}</span>
          <p className="text-stone-400 text-sm mt-1">
            连续练习天数
            {streakIsSoft && (
              <span
                className="ml-1 text-emerald-500/70"
                title="允许中断 1 天的「软续」，不打破节奏"
              >
                · 灵活续
              </span>
            )}
          </p>
        </div>
      )}

      {/* AI 提醒消息（断练 ≥3 天时使用更温暖的"回归"样式） */}
      {reminder && (
        <div
          className={`w-full max-w-md backdrop-blur-sm rounded-2xl p-5 mb-6 border ${
            isReturning
              ? 'bg-emerald-50/80 border-emerald-200/70'
              : 'bg-white/60 border-stone-200/60'
          }`}
        >
          {isReturning && (
            <p className="text-xs text-emerald-600/70 mb-2">欢迎回到琴前</p>
          )}
          <p
            className={`text-lg leading-relaxed ${
              isReturning ? 'text-emerald-900' : 'text-stone-700'
            }`}
          >
            {reminder}
          </p>
        </div>
      )}

      {/* 今日植物状态 + 进度 */}
      <div className="w-full max-w-md mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{stage.emoji}</span>
          <div className="flex-1">
            <div className="flex justify-between text-sm text-stone-400 mb-1">
              <span>今日练习</span>
              <span>{todayActiveMinutes} / {dailyGoal} 分钟</span>
            </div>
            <div className="w-full h-3 bg-stone-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 开始练琴按钮 */}
      <button
        onClick={onStartPractice}
        className="w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-400
                   hover:from-emerald-400 hover:to-emerald-300
                   text-white text-xl font-semibold
                   shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/30
                   transition-all duration-300 active:scale-95
                   flex items-center justify-center
                   border border-emerald-400/30"
      >
        开始练琴
      </button>

      {/* 最近一次练习的 AI 消息 */}
      {todaySessions.length > 0 && todaySessions[todaySessions.length - 1].aiMessage && (
        <div className="w-full max-w-md mt-8 bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-emerald-200/60">
          <p className="text-sm text-emerald-600/60 mb-1">上次练习后的鼓励</p>
          <p className="text-stone-700">
            {todaySessions[todaySessions.length - 1].aiMessage}
          </p>
        </div>
      )}
    </div>
  )
}
