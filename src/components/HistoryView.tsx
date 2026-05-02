// 历史 · B 版月历 - iOS 风月历翻页 + 底部 3 列汇总

import { useEffect, useState } from 'react'
import { getMonthDailyMinutes } from '../services/db'
import { PB, PAGE_BG, SERIF, plantStageForMinutes } from '../styles/tokens'
import { Plant } from './plant/PlantSVG'

interface HistoryViewProps {
  onBack: () => void
}

const MONTH_NAMES_ZH = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const WEEKDAYS_ZH = ['一', '二', '三', '四', '五', '六', '日']

export function HistoryView({ onBack }: HistoryViewProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [dailyMinutes, setDailyMinutes] = useState<readonly number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    getMonthDailyMinutes(year, month).then((data) => {
      if (alive) {
        setDailyMinutes(data)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [year, month])

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
  const todayDay = isCurrentMonth ? today.getDate() : -1

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // 周一为首列：JS getDay() 0=Sun..6=Sat → 转成 0=Mon..6=Sun
  const firstDate = new Date(year, month, 1)
  const startPad = (firstDate.getDay() + 6) % 7

  // 汇总：练琴天数 / 总分钟 / 最长一次
  const practiceDays = dailyMinutes.filter((m) => m > 0).length
  const totalMin = dailyMinutes.reduce((a, b) => a + b, 0)
  const longest = dailyMinutes.length > 0 ? Math.max(0, ...dailyMinutes) : 0

  function goPrev() {
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function goNext() {
    if (year === today.getFullYear() && month >= today.getMonth()) return
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const canGoNext = !(year === today.getFullYear() && month >= today.getMonth())

  return (
    <div
      className="screen-fade"
      style={{
        minHeight: '100vh',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'inherit',
        color: PB.ink,
        background: PAGE_BG,
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <button onClick={onBack} aria-label="返回" style={navArrowBtn}>
          ‹
        </button>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 19,
              fontWeight: 500,
              color: PB.ink,
              letterSpacing: '-0.01em',
            }}
          >
            {MONTH_NAMES_ZH[month]} {year}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={goPrev} aria-label="上个月" style={navArrowBtn}>
            ‹
          </button>
          <button
            onClick={goNext}
            aria-label="下个月"
            disabled={!canGoNext}
            style={{ ...navArrowBtn, opacity: canGoNext ? 1 : 0.3, cursor: canGoNext ? 'pointer' : 'default' }}
          >
            ›
          </button>
        </div>
      </div>

      {/* 周首字 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 10 }}>
        {WEEKDAYS_ZH.map((d) => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              fontSize: 11,
              color: PB.inkDim,
              letterSpacing: '0.06em',
              padding: '4px 0',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 月历 */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridAutoRows: 'minmax(46px, 1fr)',
          gap: 4,
        }}
      >
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const min = dailyMinutes[i] || 0
          const stage = plantStageForMinutes(min)
          const isToday = day === todayDay
          const isEmpty = stage === 'empty'
          return (
            <div
              key={day}
              title={
                isEmpty
                  ? `${MONTH_NAMES_ZH[month]}${day}日：未练习`
                  : `${MONTH_NAMES_ZH[month]}${day}日：${min} 分钟`
              }
              style={{
                borderRadius: 8,
                background: isToday
                  ? 'radial-gradient(circle, rgba(16,185,129,0.18), rgba(16,185,129,0.04))'
                  : isEmpty
                    ? 'linear-gradient(180deg, rgba(180,150,110,0.08), rgba(139,115,85,0.12))'
                    : 'rgba(255,255,255,0.5)',
                border: isToday
                  ? `1.5px solid ${PB.emerald}`
                  : isEmpty
                    ? '1px solid rgba(120,95,65,0.14)'
                    : '1px solid rgba(120,100,70,0.06)',
                padding: 4,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: 5,
                  fontSize: 9,
                  color: PB.inkDim,
                  letterSpacing: '0.04em',
                }}
              >
                {day}
              </div>
              {!isEmpty && <Plant stage={stage} size={32} />}
            </div>
          )
        })}
      </div>

      {/* 汇总 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          marginTop: 18,
          padding: '14px 0',
          background: 'rgba(255,255,255,0.5)',
          borderRadius: 14,
          border: '1px solid rgba(120,100,70,0.08)',
        }}
      >
        <SummaryStat label="练琴" value={practiceDays} unit="天" loading={loading} />
        <Divider />
        <SummaryStat label="总计" value={totalMin} unit="分" loading={loading} />
        <Divider />
        <SummaryStat label="最长" value={longest} unit="分" loading={loading} />
      </div>
    </div>
  )
}

function SummaryStat({ label, value, unit, loading }: { label: string; value: number; unit: string; loading: boolean }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: PB.inkDim, letterSpacing: '0.08em', marginBottom: 3 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 22,
          fontWeight: 400,
          color: PB.ink,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {loading ? '—' : value} <span style={{ fontSize: 11, color: PB.inkDim }}>{unit}</span>
      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 24, background: 'rgba(120,100,70,0.15)' }} />
}

const navArrowBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 99,
  border: '1px solid rgba(120,100,70,0.12)',
  background: 'rgba(255,255,255,0.5)',
  color: PB.inkSoft,
  fontSize: 16,
  lineHeight: 1,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
