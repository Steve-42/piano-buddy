// 花园网格 - 用于 HomePage（30 天，可裁剪到 sinceLast 模式）
// HistoryView 用月历布局，是另一个组件

import { PB } from '../../styles/tokens'
import type { PlantStage } from '../../styles/tokens'
import { plantStageForMinutes } from '../../styles/tokens'
import { Plant, EmptyCell } from './PlantSVG'

export type GardenMode = 'recent' | 'sinceLast'

interface GardenProps {
  // 索引 0 = 今天，索引 i = i 天前的实际弹奏分钟数
  readonly sessionsByDay: readonly number[]
  readonly mode?: GardenMode
}

interface Cell {
  stage: PlantStage
  daysAgo: number
  minutes: number
  isToday: boolean
}

export function Garden({ sessionsByDay, mode = 'recent' }: GardenProps) {
  let days = 30
  let startBack = 29

  if (mode === 'sinceLast') {
    let lastIdx = -1
    for (let i = 1; i < sessionsByDay.length; i++) {
      if ((sessionsByDay[i] || 0) > 0) {
        lastIdx = i
        break
      }
    }
    if (lastIdx < 0) lastIdx = 6
    days = Math.max(7, Math.min(30, lastIdx + 2))
    startBack = days - 1
  }

  const cells: Cell[] = []
  for (let i = startBack; i >= 0; i--) {
    const min = sessionsByDay[i] || 0
    cells.push({
      stage: plantStageForMinutes(min),
      daysAgo: i,
      minutes: min,
      isToday: i === 0,
    })
  }

  const cellSize = days <= 14 ? 44 : days <= 21 ? 38 : 32
  const gap = days <= 14 ? 6 : 4
  const cols = days <= 14 ? days : 7

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gap,
        justifyContent: 'center',
      }}
    >
      {cells.map((c, idx) => {
        const isEmpty = c.stage === 'empty'
        return (
          <div
            key={idx}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: 8,
              background: c.isToday
                ? `radial-gradient(circle at 50% 50%, rgba(16,185,129,0.28), rgba(16,185,129,0.08) 70%)`
                : isEmpty
                  ? 'linear-gradient(180deg, rgba(180, 150, 110, 0.10), rgba(139, 115, 85, 0.16))'
                  : 'rgba(255, 255, 255, 0.55)',
              border: c.isToday
                ? `1.5px solid ${PB.emerald}`
                : isEmpty
                  ? '1px solid rgba(120, 95, 65, 0.18)'
                  : '1px solid rgba(120, 100, 70, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: c.isToday
                ? '0 0 0 3px rgba(16,185,129,0.16), 0 0 0 7px rgba(16,185,129,0.08), 0 0 14px rgba(16,185,129,0.18)'
                : c.stage === 'bloom'
                  ? '0 1px 3px rgba(244,164,164,0.25)'
                  : 'none',
              animation: c.isToday ? 'today-pulse 2.6s ease-in-out infinite' : undefined,
            }}
            title={
              isEmpty
                ? `${c.daysAgo === 0 ? '今天' : `${c.daysAgo} 天前`}：尚未练习`
                : `${c.daysAgo === 0 ? '今天' : `${c.daysAgo} 天前`}：${c.minutes} 分钟`
            }
          >
            {isEmpty ? (
              <EmptyCell size={cellSize - 6} recentlyAway={c.daysAgo <= 4} />
            ) : (
              <Plant stage={c.stage} size={cellSize - 6} animated={c.isToday} />
            )}
          </div>
        )
      })}
    </div>
  )
}
