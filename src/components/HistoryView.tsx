// 历史页面：展示练习记录、连续天数统计

import { useEffect, useState } from 'react'
import { getAllSessions, getStreak } from '../services/db'
import type { PracticeSession } from '../types'

interface HistoryViewProps {
  onBack: () => void
}

function formatTime(seconds: number): string {
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  if (dateStr === today) return '今天'
  if (dateStr === yesterday) return '昨天'

  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function HistoryView({ onBack }: HistoryViewProps) {
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [streak, setStreak] = useState(0)
  const [totalDays, setTotalDays] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const allSessions = await getAllSessions()
    setSessions(allSessions)
    setStreak(await getStreak())

    // 计算总练习天数
    const uniqueDays = new Set(allSessions.map((s) => s.date))
    setTotalDays(uniqueDays.size)
  }

  // 按日期分组
  const groupedByDate = sessions.reduce<Record<string, PracticeSession[]>>(
    (groups, session) => {
      const date = session.date
      return {
        ...groups,
        [date]: [...(groups[date] ?? []), session],
      }
    },
    {},
  )

  const totalActiveMinutes = Math.round(
    sessions.reduce((sum, s) => sum + s.activeDuration, 0) / 60,
  )

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-md mx-auto">
        {/* 顶部 */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white transition-colors mr-4"
          >
            ← 返回
          </button>
          <h1 className="text-2xl font-bold text-white">练习记录</h1>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
            <p className="text-2xl font-bold text-amber-400">{streak}</p>
            <p className="text-xs text-slate-400 mt-1">连续天数</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
            <p className="text-2xl font-bold text-emerald-400">{totalDays}</p>
            <p className="text-xs text-slate-400 mt-1">总天数</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
            <p className="text-2xl font-bold text-indigo-400">{totalActiveMinutes}</p>
            <p className="text-xs text-slate-400 mt-1">总分钟</p>
          </div>
        </div>

        {/* 日历热力图（简化版：最近 30 天） */}
        <div className="mb-8">
          <p className="text-sm text-slate-400 mb-3">最近 30 天</p>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 30 }, (_, i) => {
              const date = new Date()
              date.setDate(date.getDate() - (29 - i))
              const dateStr = date.toISOString().slice(0, 10)
              const daySessions = groupedByDate[dateStr]
              const dayMinutes = daySessions
                ? Math.round(
                    daySessions.reduce((sum, s) => sum + s.activeDuration, 0) / 60,
                  )
                : 0

              let bgColor = 'bg-slate-800'
              if (dayMinutes > 0) bgColor = 'bg-emerald-800'
              if (dayMinutes >= 15) bgColor = 'bg-emerald-600'
              if (dayMinutes >= 30) bgColor = 'bg-emerald-400'

              return (
                <div
                  key={dateStr}
                  className={`w-[calc((100%-6*0.25rem)/7)] aspect-square rounded-sm ${bgColor}`}
                  title={`${dateStr}: ${dayMinutes} 分钟`}
                />
              )
            })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span>少</span>
            <div className="w-3 h-3 bg-slate-800 rounded-sm" />
            <div className="w-3 h-3 bg-emerald-800 rounded-sm" />
            <div className="w-3 h-3 bg-emerald-600 rounded-sm" />
            <div className="w-3 h-3 bg-emerald-400 rounded-sm" />
            <span>多</span>
          </div>
        </div>

        {/* 练习记录列表 */}
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">还没有练习记录</p>
            <p className="text-slate-600 text-sm mt-1">开始第一次练琴吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedByDate).map(([date, daySessions]) => {
              const dayActiveMin = Math.round(
                daySessions.reduce((sum, s) => sum + s.activeDuration, 0) / 60,
              )
              return (
                <div
                  key={date}
                  className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-medium">
                      {formatDate(date)}
                    </span>
                    <span className="text-emerald-400 text-sm">
                      {dayActiveMin} 分钟
                    </span>
                  </div>
                  {daySessions.map((session) => (
                    <div key={session.id} className="mt-2">
                      <div className="text-xs text-slate-500">
                        {new Date(session.startTime).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · 弹奏 {formatTime(session.activeDuration)}
                      </div>
                      {session.aiMessage && (
                        <p className="text-sm text-slate-400 mt-1 italic">
                          "{session.aiMessage}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
