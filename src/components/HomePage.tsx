// 首页 v2 - cream + emerald, garden 主卡, 拟物 CTA, 回归态温柔卡片
// 设计来自 Claude Design 交接稿

import { useEffect, useState } from 'react'
import {
  getSessionsByDate,
  getStreakInfo,
  getRecentSessions,
  getSettings,
  getDailyActiveMinutes,
} from '../services/db'
import { generateReminder } from '../services/llmService'
import type { PracticeSession } from '../types'
import { PB, PAGE_BG, SERIF, plantStageForMinutes } from '../styles/tokens'
import { Plant, PlantSprout } from './plant/PlantSVG'
import { Garden } from './plant/Garden'

interface HomePageProps {
  onStartPractice: () => void
  onNavigate: (page: 'history' | 'settings') => void
}

const RETURNING_THRESHOLD_DAYS = 3

interface HomeData {
  todaySessions: PracticeSession[]
  sessionsByDay: readonly number[]
  streakDays: number
  streakIsSoft: boolean
  daysSinceLastPractice: number
  reminder: string
  dailyGoal: number
  loading: boolean
}

const INITIAL: HomeData = {
  todaySessions: [],
  sessionsByDay: [],
  streakDays: 0,
  streakIsSoft: false,
  daysSinceLastPractice: 0,
  reminder: '',
  dailyGoal: 30,
  loading: true,
}

export function HomePage({ onStartPractice, onNavigate }: HomePageProps) {
  const [data, setData] = useState<HomeData>(INITIAL)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const today = new Date().toISOString().slice(0, 10)
      const [sessions, streakInfo, settings, sessionsByDay, recent] = await Promise.all([
        getSessionsByDate(today),
        getStreakInfo(),
        getSettings(),
        getDailyActiveMinutes(30),
        getRecentSessions(7),
      ])
      const effectiveDaysSince = sessions.length > 0 ? 0 : streakInfo.daysSinceLastPractice
      const previousSessions = recent.filter((s) => s.date !== today)
      const lastSession = previousSessions[0]

      const reminder = await generateReminder({
        streak: streakInfo.days,
        daysSinceLastPractice: effectiveDaysSince,
        lastSessionDuration: lastSession?.activeDuration ?? null,
      })

      if (!alive) return
      setData({
        todaySessions: sessions,
        sessionsByDay,
        streakDays: streakInfo.days,
        streakIsSoft: streakInfo.isSoft,
        daysSinceLastPractice: effectiveDaysSince,
        reminder,
        dailyGoal: settings.dailyGoalMinutes,
        loading: false,
      })
    })()
    return () => {
      alive = false
    }
  }, [])

  const todayMin = Math.round(
    data.todaySessions.reduce((sum, s) => sum + s.activeDuration, 0) / 60,
  )
  const isReturning =
    data.daysSinceLastPractice >= RETURNING_THRESHOLD_DAYS && data.todaySessions.length === 0
  const todayStage = plantStageForMinutes(todayMin)
  const gardenMode = isReturning ? 'sinceLast' : 'recent'

  // 回归态：CTA 文案改为更轻盈的"摸一摸琴"
  const ctaLabel = isReturning ? '摸一摸琴' : '打开琴盖'

  return (
    <div
      className="screen-fade"
      style={{
        minHeight: '100vh',
        padding: '20px 22px 0',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'inherit',
        color: PB.ink,
        background: PAGE_BG,
        boxSizing: 'border-box',
      }}
    >
      {/* 顶部导航 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 0 0',
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 19,
            fontWeight: 500,
            color: PB.ink,
            letterSpacing: '-0.01em',
          }}
        >
          Piano Buddy
        </div>
        <div style={{ display: 'flex', gap: 18 }}>
          <NavBtn label="历史" onClick={() => onNavigate('history')} />
          <NavBtn label="设置" onClick={() => onNavigate('settings')} />
        </div>
      </div>

      {/* 回归卡片：≥3 天没练时显示，替代普通 AI 提醒 */}
      {isReturning && (
        <ComebackCard daysAway={data.daysSinceLastPractice} />
      )}

      {/* 花园主卡 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))',
          border: '1px solid rgba(120,100,70,0.08)',
          borderRadius: 22,
          padding: '20px 18px 22px',
          marginBottom: 18,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 6px 24px -12px rgba(120,100,70,0.18)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: SERIF,
                fontSize: 26,
                fontWeight: 400,
                color: PB.ink,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              你的花园
            </div>
            <div style={{ fontSize: 12, color: PB.inkDim, marginTop: 4, letterSpacing: '0.04em' }}>
              {gardenMode === 'sinceLast' ? '从上次起' : '过去 30 天'}
            </div>
          </div>
          <StreakBadge days={data.streakDays} isSoft={data.streakIsSoft} />
        </div>

        {/* 今日条 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '12px 14px',
            marginBottom: 16,
            background: 'rgba(16,185,129,0.05)',
            border: '1px solid rgba(16,185,129,0.15)',
            borderRadius: 14,
          }}
        >
          <div style={{ width: 56, height: 56, flexShrink: 0 }}>
            <Plant stage={todayStage} size={56} animated />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                color: PB.inkDim,
                letterSpacing: '0.06em',
                marginBottom: 2,
              }}
            >
              今天
            </div>
            <div
              style={{
                fontSize: 22,
                color: PB.ink,
                fontFamily: SERIF,
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {todayMin}{' '}
              <span style={{ fontSize: 13, color: PB.inkDim, fontFamily: 'inherit' }}>
                / {data.dailyGoal} 分钟
              </span>
            </div>
            <div
              style={{
                height: 4,
                background: 'rgba(120,100,70,0.08)',
                borderRadius: 99,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (todayMin / data.dailyGoal) * 100)}%`,
                  background: PB.emerald,
                  borderRadius: 99,
                  transition: 'width 500ms ease',
                }}
              />
            </div>
          </div>
        </div>

        {!data.loading && data.sessionsByDay.length > 0 && (
          <Garden sessionsByDay={data.sessionsByDay} mode={gardenMode} />
        )}
      </div>

      {!isReturning && data.reminder && <AIWhisper text={data.reminder} />}

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 32 }}>
        <TactileCTA
          label={ctaLabel}
          glow={isReturning}
          onPress={onStartPractice}
        />
      </div>
    </div>
  )
}

function NavBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        color: PB.inkDim,
        fontSize: 13,
        fontFamily: 'inherit',
        padding: 0,
        cursor: 'pointer',
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </button>
  )
}

interface StreakBadgeProps {
  days: number
  isSoft: boolean
}

function StreakBadge({ days, isSoft }: StreakBadgeProps) {
  if (days <= 0) {
    return (
      <span style={{ fontSize: 12, color: PB.inkDim, letterSpacing: '0.04em' }}>新的开始</span>
    )
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 12, color: PB.inkDim, letterSpacing: '0.04em' }}>连续</span>
      <span
        style={{
          fontSize: 22,
          color: PB.ink,
          fontWeight: 500,
          fontFamily: SERIF,
        }}
      >
        {days}
      </span>
      <span style={{ fontSize: 12, color: PB.inkDim }}>天</span>
      {isSoft && (
        <span
          title="允许中断 1 天的「软续」，不打破节奏"
          style={{
            marginLeft: 1,
            width: 8,
            height: 8,
            borderRadius: '50%',
            border: `1.5px dashed ${PB.emerald}`,
            display: 'inline-block',
          }}
        />
      )}
    </div>
  )
}

interface ComebackCardProps {
  daysAway: number
}

function ComebackCard({ daysAway }: ComebackCardProps) {
  return (
    <div
      style={{
        background: `linear-gradient(180deg, ${PB.creamWarm}, ${PB.cream})`,
        border: `1px solid ${PB.emeraldSoft}`,
        borderRadius: 20,
        padding: '20px 20px 22px',
        marginBottom: 18,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 14px -6px rgba(120,100,70,0.12)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -16,
          right: -10,
          width: 110,
          height: 110,
          opacity: 0.5,
          background: `radial-gradient(circle at 50% 50%, ${PB.emeraldSoft} 0%, transparent 70%)`,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
        <div
          style={{
            width: 64,
            height: 64,
            flexShrink: 0,
            animation: 'seed-resprout 3.2s ease-in-out infinite',
          }}
        >
          <PlantSprout size={64} animated />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 24,
              fontWeight: 400,
              color: PB.ink,
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
              marginBottom: 6,
            }}
          >
            你回来了。
          </div>
          <div style={{ fontSize: 13, color: PB.inkSoft, lineHeight: 1.55 }}>
            上次是 {daysAway} 天前。种子还在，
            <br />
            等你把它叫醒。
          </div>
        </div>
      </div>
    </div>
  )
}

function AIWhisper({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 13,
        color: PB.inkSoft,
        lineHeight: 1.6,
        textAlign: 'center',
        padding: '0 12px',
        marginBottom: 14,
        fontStyle: 'italic',
        fontFamily: SERIF,
        letterSpacing: '0.01em',
      }}
    >
      {text}
    </div>
  )
}

interface TactileCTAProps {
  label: string
  glow?: boolean
  onPress: () => void
}

function TactileCTA({ label, glow = false, onPress }: TactileCTAProps) {
  const [pressed, setPressed] = useState(false)
  const charCount = label.length
  const fontSize = charCount <= 4 ? 22 : charCount <= 5 ? 19 : charCount <= 6 ? 17 : 15
  const size = 156

  return (
    <button
      onClick={onPress}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `1.5px solid ${PB.emeraldDark}`,
        background: pressed
          ? `radial-gradient(circle at 50% 60%, ${PB.creamDeep} 0%, ${PB.creamWarm} 100%)`
          : `radial-gradient(circle at 50% 35%, #fffaee 0%, ${PB.creamWarm} 80%)`,
        boxShadow: pressed
          ? `inset 0 6px 14px rgba(5, 102, 105, 0.22), inset 0 -2px 4px rgba(255,255,255,0.4), 0 1px 2px rgba(61,52,40,0.06)`
          : `inset 0 1.5px 3px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(120, 90, 50, 0.12), 0 12px 32px -10px rgba(5, 102, 105, 0.28), 0 2px 6px rgba(61,52,40,0.06)${
              glow
                ? `, 0 0 0 8px rgba(16,185,129,0.06), 0 0 0 16px rgba(16,185,129,0.03)`
                : ''
            }`,
        color: PB.emeraldDeep,
        fontSize,
        fontWeight: 600,
        fontFamily: 'inherit',
        letterSpacing: '0.04em',
        cursor: 'pointer',
        transition: 'box-shadow 120ms ease, transform 120ms ease',
        transform: pressed ? 'translateY(1px)' : 'translateY(0)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        padding: 0,
        whiteSpace: 'nowrap',
      }}
    >
      <span>{label}</span>
    </button>
  )
}
