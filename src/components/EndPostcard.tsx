// 练习结束 · C 版明信片 - 来自 Claude Design 交接稿
// AI 鼓励文案 / 植物状态 / 邮戳 / "已经为你记下了"

import { PB, PRACTICE_BG, SERIF, plantStageForMinutes, STAGE_NAME, STAGE_TONE } from '../styles/tokens'
import { Plant } from './plant/PlantSVG'

interface EndPostcardProps {
  minutes: number
  goal: number
  aiMessage: string | null
  onClose: () => void
}

export function EndPostcard({ minutes, goal, aiMessage, onClose }: EndPostcardProps) {
  const stage = plantStageForMinutes(minutes)
  const renderStage = stage === 'empty' ? 'sprout' : stage
  const stageName = STAGE_NAME[renderStage]

  // 优先用 AI 生成的鼓励文案；fallback 用阶段固定 tone
  const quote = aiMessage?.trim() || STAGE_TONE[renderStage]

  // 邮戳显示今天日期
  const today = new Date()
  const stampMonth = `${today.getMonth() + 1}月`
  const stampDay = String(today.getDate()).padStart(2, '0')

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
        padding: '20px 22px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: PB.inkDim,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          关闭
        </button>
        <span
          style={{
            fontSize: 11,
            color: PB.inkDim,
            letterSpacing: '0.08em',
            alignSelf: 'center',
          }}
        >
          目标 {goal} 分钟
        </span>
      </div>

      {/* 明信片 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: '100%',
            maxWidth: 320,
            background: `linear-gradient(160deg, #fffaee 0%, ${PB.creamWarm} 60%, ${PB.creamDeep} 100%)`,
            borderRadius: 22,
            padding: '32px 26px 28px',
            border: '1px solid rgba(120,100,70,0.10)',
            boxShadow:
              '0 18px 36px -16px rgba(120,100,70,0.30), 0 4px 10px rgba(120,100,70,0.08)',
            position: 'relative',
            overflow: 'hidden',
            animation: 'plant-end-grow 1.4s cubic-bezier(.2,.8,.3,1) both',
          }}
        >
          {/* 邮戳 */}
          <div
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: `1px dashed ${PB.emerald}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: PB.emeraldDeep,
              fontSize: 9,
              letterSpacing: '0.1em',
              fontFamily: SERIF,
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            {stampMonth}
            <br />
            {stampDay}
          </div>

          {/* 植物 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 6,
              marginBottom: 18,
              filter: 'drop-shadow(0 8px 18px rgba(16,185,129,0.18))',
            }}
          >
            <Plant stage={renderStage} size={170} animated glow={renderStage === 'bloom'} />
          </div>

          {/* 鼓励文案 */}
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 18,
              fontWeight: 400,
              color: PB.ink,
              lineHeight: 1.45,
              textAlign: 'center',
              letterSpacing: '-0.005em',
              marginBottom: 14,
              whiteSpace: 'pre-wrap',
            }}
          >
            “{quote}”
          </div>

          {/* 数据条 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 14,
              borderTop: '1px dashed rgba(120,100,70,0.18)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 9,
                  color: PB.inkDim,
                  letterSpacing: '0.12em',
                  marginBottom: 2,
                }}
              >
                本次
              </div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: 20,
                  color: PB.ink,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                }}
              >
                {minutes}{' '}
                <span style={{ fontSize: 12, color: PB.inkDim, fontFamily: 'inherit' }}>分钟</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 9,
                  color: PB.inkDim,
                  letterSpacing: '0.12em',
                  marginBottom: 2,
                }}
              >
                植物
              </div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: 14,
                  color: PB.emeraldDeep,
                  lineHeight: 1.2,
                }}
              >
                {stageName}
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 8,
              color: PB.inkDim,
              letterSpacing: '0.32em',
            }}
          >
            PIANO BUDDY
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px 18px',
            borderRadius: 14,
            border: `1px solid ${PB.emeraldDark}`,
            background: `linear-gradient(180deg, #fffaee, ${PB.creamWarm})`,
            color: PB.emeraldDeep,
            fontSize: 15,
            fontWeight: 600,
            fontFamily: 'inherit',
            letterSpacing: '0.04em',
            cursor: 'pointer',
            boxShadow:
              'inset 0 1.5px 3px rgba(255,255,255,0.9), 0 6px 18px -8px rgba(5,102,105,0.25), 0 2px 4px rgba(61,52,40,0.06)',
          }}
        >
          回到主页
        </button>
        <div
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: PB.inkDim,
            letterSpacing: '0.04em',
          }}
        >
          已经为你记下了。
        </div>
      </div>
    </div>
  )
}
