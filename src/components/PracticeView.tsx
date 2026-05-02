// 练习中视图 - B 版进度环 + 飘落音符 + 巨大中心植物
// 结束态：渲染 EndPostcard 明信片

import { useEffect, useState } from 'react'
import type { PracticeStatus } from '../hooks/usePractice'
import type { DebugInfo } from '../services/audioDetector'
import { getSettings } from '../services/db'
import { useWakeLock } from '../hooks/useWakeLock'
import { PB, PRACTICE_BG, SERIF, plantStageForMinutes } from '../styles/tokens'
import { Plant } from './plant/PlantSVG'
import { FallingNotes } from './practice/FallingNotes'
import { EndPostcard } from './EndPostcard'

interface PracticeViewProps {
  status: PracticeStatus
  activeDuration: number
  totalDuration: number
  aiMessage: string | null
  error: string | null
  debug: DebugInfo | null
  onStop: () => void
  onReset: () => void
}

function formatTime(seconds: number): string {
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

export function PracticeView({
  status,
  activeDuration,
  totalDuration,
  aiMessage,
  error,
  debug,
  onStop,
  onReset,
}: PracticeViewProps) {
  const [dailyGoal, setDailyGoal] = useState(30)
  const [showDebug, setShowDebug] = useState(false)
  const isPlaying = status === 'playing'
  const isPracticing = status === 'playing' || status === 'listening'
  const activeMin = activeDuration / 60
  const stage = plantStageForMinutes(activeMin)

  useWakeLock(isPracticing)

  useEffect(() => {
    getSettings().then((s) => setDailyGoal(s.dailyGoalMinutes))
  }, [])

  // 错误态
  if (error) {
    return (
      <div
        className="screen-fade"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          background: PRACTICE_BG,
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(232, 128, 128, 0.4)',
            borderRadius: 18,
            padding: 24,
            maxWidth: 360,
            textAlign: 'center',
            backdropFilter: 'blur(8px)',
          }}
        >
          <p style={{ color: '#b25656', fontSize: 16, margin: '0 0 16px', lineHeight: 1.5 }}>{error}</p>
          <button
            onClick={onReset}
            style={{
              padding: '10px 22px',
              borderRadius: 12,
              border: `1px solid ${PB.emeraldDark}`,
              background: `linear-gradient(180deg, #fffaee, ${PB.creamWarm})`,
              color: PB.emeraldDeep,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.04em',
            }}
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  // 结束态 → 明信片
  if (status === 'finished') {
    return (
      <EndPostcard
        minutes={Math.max(1, Math.round(activeDuration / 60))}
        goal={dailyGoal}
        aiMessage={aiMessage}
        onClose={onReset}
      />
    )
  }

  const progress = Math.min(1, activeMin / dailyGoal)
  const R = 124
  const Cm = 2 * Math.PI * R

  return (
    <div
      className="screen-fade"
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: PRACTICE_BG,
        fontFamily: 'inherit',
        color: PB.ink,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <FallingNotes density={isPlaying ? 'medium' : 'sparse'} />

      {/* 顶部：退出 + 麦克风指示 */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 22px 0',
        }}
      >
        <button
          onClick={onStop}
          aria-label="结束"
          style={{
            width: 36,
            height: 36,
            borderRadius: 99,
            border: '1px solid rgba(120,100,70,0.10)',
            background: 'rgba(255,255,255,0.5)',
            color: PB.inkSoft,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 6 L18 18 M6 18 L18 6" />
          </svg>
        </button>

        <MicIndicator listening={isPracticing} active={isPlaying} />
      </div>

      {/* 中央：进度环 + 植物 */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
        }}
      >
        <div style={{ position: 'relative', width: 280, height: 280 }}>
          <svg
            width="280"
            height="280"
            style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
          >
            <circle cx="140" cy="140" r={R} fill="none" stroke="rgba(120,100,70,0.10)" strokeWidth="2.5" />
            <circle
              cx="140"
              cy="140"
              r={R}
              fill="none"
              stroke={PB.emerald}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={Cm}
              strokeDashoffset={Cm * (1 - progress)}
              style={{
                transition: 'stroke-dashoffset 1s linear',
                filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.4))',
              }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plant
              stage={stage === 'empty' ? 'sprout' : stage}
              size={200}
              animated
              glow={stage === 'bloom'}
            />
          </div>
        </div>
      </div>

      {/* 底部：计时 + 目标 */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          padding: '0 22px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 24,
              fontWeight: 400,
              color: PB.ink,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {formatTime(activeDuration)}
          </div>
          <div
            style={{
              fontSize: 11,
              color: PB.inkDim,
              letterSpacing: '0.06em',
              marginTop: 6,
            }}
          >
            目标 {dailyGoal} 分钟 · 总用时 {formatTime(totalDuration)}
          </div>
        </div>

        {debug && (
          <div style={{ width: '100%', maxWidth: 360 }}>
            <button
              onClick={() => setShowDebug((prev) => !prev)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 11,
                color: PB.inkDim,
                cursor: 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '0.04em',
                padding: 4,
              }}
            >
              {showDebug ? '隐藏调试' : '调试信息'}
            </button>
            {showDebug && (
              <div
                style={{
                  marginTop: 6,
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(120,100,70,0.08)',
                  borderRadius: 12,
                  padding: 10,
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: PB.inkSoft,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <p style={{ margin: '0 0 6px', color: PB.inkDim }}>
                  {debug.modelLoaded ? '每 4 秒更新' : debug.topClass || '加载模型中...'}
                </p>
                {debug.modelLoaded && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 12, rowGap: 3 }}>
                    <span style={{ color: PB.inkDim }}>麦克风</span>
                    <span style={{ color: debug.audioLevel > 0.01 ? PB.emerald : '#b25656' }}>
                      {debug.audioLevel.toFixed(3)}
                    </span>
                    <span style={{ color: PB.inkDim }}>识别</span>
                    <span>{debug.topClass}</span>
                    <span style={{ color: PB.inkDim }}>钢琴</span>
                    <span style={{ color: debug.isPiano ? PB.emerald : PB.inkDim }}>
                      {(debug.pianoScore * 100).toFixed(1)}%
                    </span>
                    <span style={{ color: PB.inkDim }}>判定</span>
                    <span style={{ color: debug.result === 'PIANO' ? PB.emerald : PB.inkDim, fontWeight: debug.result === 'PIANO' ? 700 : 400 }}>
                      {debug.result === 'PIANO' ? '琴声' : '—'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface MicIndicatorProps {
  listening: boolean
  active: boolean
}

function MicIndicator({ listening, active }: MicIndicatorProps) {
  if (!listening) {
    return <span style={{ width: 14 }} />
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <svg width="14" height="14" viewBox="0 0 14 14">
        <circle cx="7" cy="7" r="3" fill={PB.emerald} opacity={active ? 0.95 : 0.5} />
        <circle cx="7" cy="7" r="6" fill="none" stroke={PB.emerald} strokeWidth="0.8" opacity="0.4">
          <animate attributeName="r" from="3.5" to="6.5" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.5" to="0" dur="1.6s" repeatCount="indefinite" />
        </circle>
      </svg>
      <span style={{ fontSize: 11, color: PB.inkDim, letterSpacing: '0.05em' }}>
        {active ? '正在听到琴声' : '正在听'}
      </span>
    </div>
  )
}
