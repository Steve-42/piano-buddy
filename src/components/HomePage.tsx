// 首页：展示今日状态、AI 消息、开始练琴按钮

import { useEffect, useState } from 'react'
import { getSessionsByDate, getStreak, getRecentSessions, getSettings } from '../services/db'
import { generateReminder } from '../services/llmService'
import type { PracticeSession } from '../types'

interface HomePageProps {
  onStartPractice: () => void
  onNavigate: (page: 'history' | 'settings') => void
}

export function HomePage({ onStartPractice, onNavigate }: HomePageProps) {
  const [todaySessions, setTodaySessions] = useState<PracticeSession[]>([])
  const [streak, setStreak] = useState(0)
  const [reminder, setReminder] = useState('')
  const [dailyGoal, setDailyGoal] = useState(30)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const today = new Date().toISOString().slice(0, 10)
    const sessions = await getSessionsByDate(today)
    setTodaySessions(sessions)

    const currentStreak = await getStreak()
    setStreak(currentStreak)

    const settings = await getSettings()
    setDailyGoal(settings.dailyGoalMinutes)

    // 获取提醒消息
    const recent = await getRecentSessions(7)
    const previousSessions = recent.filter((s) => s.date !== today)
    const daysSinceLastPractice =
      previousSessions.length > 0
        ? Math.floor(
            (Date.now() - Math.max(...previousSessions.map((s) => s.startTime))) /
              (1000 * 60 * 60 * 24),
          )
        : 999

    const lastSession = previousSessions[0]
    const msg = await generateReminder({
      streak: currentStreak,
      daysSinceLastPractice: sessions.length > 0 ? 0 : daysSinceLastPractice,
      lastSessionDuration: lastSession?.activeDuration ?? null,
    })
    setReminder(msg)
  }

  // 今日已练总时长
  const todayActiveMinutes = Math.round(
    todaySessions.reduce((sum, s) => sum + s.activeDuration, 0) / 60,
  )
  const goalProgress = Math.min(100, (todayActiveMinutes / dailyGoal) * 100)

  return (
    <div className="flex flex-col items-center min-h-screen px-6 py-8">
      {/* 顶部导航 */}
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Piano Buddy</h1>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('history')}
            className="text-slate-400 hover:text-white transition-colors"
          >
            历史
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className="text-slate-400 hover:text-white transition-colors"
          >
            设置
          </button>
        </div>
      </div>

      {/* 连续天数 */}
      {streak > 0 && (
        <div className="mb-6 text-center">
          <span className="text-4xl font-bold text-amber-400">{streak}</span>
          <p className="text-slate-400 text-sm mt-1">连续练习天数</p>
        </div>
      )}

      {/* AI 提醒消息 */}
      {reminder && (
        <div className="w-full max-w-md bg-slate-800/50 rounded-2xl p-5 mb-6 border border-slate-700/50">
          <p className="text-slate-200 text-lg leading-relaxed">{reminder}</p>
        </div>
      )}

      {/* 今日进度 */}
      <div className="w-full max-w-md mb-8">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>今日练习</span>
          <span>
            {todayActiveMinutes} / {dailyGoal} 分钟
          </span>
        </div>
        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${goalProgress}%` }}
          />
        </div>
      </div>

      {/* 开始练琴按钮 */}
      <button
        onClick={onStartPractice}
        className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                   hover:from-indigo-400 hover:to-purple-500
                   text-white text-xl font-semibold
                   shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50
                   transition-all duration-300 active:scale-95
                   flex items-center justify-center"
      >
        开始练琴
      </button>

      {/* 最近一次练习的 AI 消息 */}
      {todaySessions.length > 0 && todaySessions[todaySessions.length - 1].aiMessage && (
        <div className="w-full max-w-md mt-8 bg-indigo-900/30 rounded-2xl p-5 border border-indigo-700/30">
          <p className="text-sm text-indigo-300 mb-1">上次练习后的鼓励</p>
          <p className="text-slate-200">
            {todaySessions[todaySessions.length - 1].aiMessage}
          </p>
        </div>
      )}
    </div>
  )
}
