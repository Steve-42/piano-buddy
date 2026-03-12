// 练习中页面：花园 UI —— 植物成长 + 音符飘落

import { useEffect, useState, useRef, useCallback } from 'react'
import type { PracticeStatus } from '../hooks/usePractice'
import type { DebugInfo } from '../services/audioDetector'
import { getGrowthStage } from '../types'
import { getSettings } from '../services/db'

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

// 音符 emoji 候选
const NOTE_EMOJIS = ['🎵', '🎶', '♪', '♫']

interface FallingNote {
  id: number
  emoji: string
  left: number // 百分比位置
}

function formatTime(seconds: number): string {
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
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
  const [notes, setNotes] = useState<FallingNote[]>([])
  const [backgroundImage, setBackgroundImage] = useState('')
  const [showDebug, setShowDebug] = useState(false)
  const noteIdRef = useRef(0)
  const isPlaying = status === 'playing'
  const activeMin = Math.round(activeDuration / 60)
  const stage = getGrowthStage(activeMin)

  // 加载背景图片设置
  useEffect(() => {
    getSettings().then((s) => setBackgroundImage(s.backgroundImage || ''))
  }, [])

  // 生成音符的回调
  const spawnNote = useCallback(() => {
    const id = noteIdRef.current++
    const emoji = NOTE_EMOJIS[Math.floor(Math.random() * NOTE_EMOJIS.length)]
    const left = 10 + Math.random() * 80 // 10%-90% 水平位置

    setNotes((prev) => [...prev, { id, emoji, left }])

    // 动画结束后移除
    setTimeout(() => {
      setNotes((prev) => prev.filter((n) => n.id !== id))
    }, 3500)
  }, [])

  // 弹奏时定期生成音符
  useEffect(() => {
    if (!isPlaying) return

    // 立即生成一个
    spawnNote()

    const interval = setInterval(() => {
      spawnNote()
    }, 800) // 每 0.8 秒一个音符

    return () => clearInterval(interval)
  }, [isPlaying, spawnNote])

  // 错误状态
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-6 max-w-md text-center">
          <p className="text-red-300 text-lg mb-4">{error}</p>
          <button
            onClick={onReset}
            className="px-6 py-2 bg-amber-800/60 hover:bg-amber-700/60 text-amber-100 rounded-lg transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  // 练习结束
  if (status === 'finished') {
    return (
      <div
        className="garden-bg flex flex-col items-center justify-center min-h-screen px-6"
        style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}}
      >
        {/* 最终植物状态 */}
        <div className="text-center mb-6">
          <span
            className="plant-emoji inline-block"
            style={{ transform: `scale(${stage.scale})`, fontSize: '4rem' }}
          >
            {stage.emoji}
          </span>
          <p className="text-amber-200/80 text-sm mt-4">{stage.label}</p>
        </div>

        {/* 练习数据 */}
        <div className="text-center mb-6">
          <p className="text-amber-200/60 text-sm mb-1">今日练习</p>
          <p className="text-4xl font-bold text-white mb-1">
            {formatTime(activeDuration)}
          </p>
          <p className="text-amber-200/60 text-sm">实际弹奏 {activeMin} 分钟</p>
        </div>

        {/* AI 鼓励 */}
        {aiMessage && (
          <div className="w-full max-w-md bg-amber-900/20 rounded-2xl p-5 mb-6 border border-amber-700/30">
            <p className="text-amber-50 text-lg leading-relaxed">{aiMessage}</p>
          </div>
        )}

        <button
          onClick={onReset}
          className="px-8 py-3 bg-emerald-800/50 hover:bg-emerald-700/50 text-emerald-100 rounded-xl text-lg transition-colors border border-emerald-700/30"
        >
          返回首页
        </button>
      </div>
    )
  }

  // 练习中
  return (
    <div
      className="garden-bg flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden"
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}}
    >
      {/* 飘落的音符 */}
      {notes.map((note) => (
        <span
          key={note.id}
          className="falling-note"
          style={{ left: `${note.left}%` }}
        >
          {note.emoji}
        </span>
      ))}

      {/* 状态提示 */}
      <div className="mb-4 text-center">
        <div
          className={`w-3 h-3 rounded-full mx-auto mb-2 transition-colors duration-500 ${
            isPlaying
              ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50'
              : 'bg-amber-600/50'
          }`}
        />
        <p className="text-amber-200/60 text-sm">
          {isPlaying ? '检测到琴声，音符飘落中...' : '等待琴声...'}
        </p>
      </div>

      {/* 植物 */}
      <div className="my-8 text-center">
        <span
          className="plant-emoji inline-block"
          style={{ transform: `scale(${stage.scale})`, fontSize: '4rem' }}
        >
          {stage.emoji}
        </span>
        <p className="text-amber-200/60 text-xs mt-4">{stage.label}</p>
      </div>

      {/* 计时器（弱化显示） */}
      <div className="text-center mb-2">
        <p className="text-3xl font-mono font-bold text-white/80 tracking-wider">
          {formatTime(activeDuration)}
        </p>
        <p className="text-amber-200/40 text-xs mt-1">弹奏时间</p>
      </div>
      <div className="text-center mb-8">
        <p className="text-sm font-mono text-amber-200/30">
          {formatTime(totalDuration)}
        </p>
      </div>

      {/* 停止按钮 */}
      <button
        onClick={onStop}
        className="w-20 h-20 rounded-full bg-amber-800/40 hover:bg-amber-700/50
                   text-amber-200 text-base font-medium
                   border border-amber-600/30
                   transition-all duration-300 active:scale-95
                   flex items-center justify-center"
      >
        结束
      </button>

      {/* 调试面板开关 */}
      {debug && (
        <div className="w-full max-w-md mt-6">
          <button
            onClick={() => setShowDebug((prev) => !prev)}
            className="text-xs text-amber-200/30 hover:text-amber-200/50 transition-colors"
          >
            {showDebug ? '隐藏调试' : '调试信息'}
          </button>
          {showDebug && (
            <div className="mt-2 bg-black/30 rounded-xl p-3 border border-amber-900/30 font-mono text-xs">
              <p className="text-amber-200/40 mb-2">
                {debug.modelLoaded ? '每 4 秒更新' : debug.topClass || '加载模型中...'}
              </p>
              {debug.modelLoaded && (
                <div className="grid grid-cols-2 gap-y-1 gap-x-4">
                  <span className="text-amber-200/40">麦克风</span>
                  <span className={debug.audioLevel > 0.01 ? 'text-emerald-400' : 'text-red-400'}>
                    {debug.audioLevel.toFixed(3)}
                  </span>
                  <span className="text-amber-200/40">识别</span>
                  <span className="text-amber-200/60">{debug.topClass}</span>
                  <span className="text-amber-200/40">钢琴</span>
                  <span className={debug.isPiano ? 'text-emerald-400' : 'text-amber-200/40'}>
                    {(debug.pianoScore * 100).toFixed(1)}%
                  </span>
                  <span className="text-amber-200/40">判定</span>
                  <span className={debug.result === 'PIANO' ? 'text-emerald-400 font-bold' : 'text-amber-200/40'}>
                    {debug.result === 'PIANO' ? '琴声' : '—'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
