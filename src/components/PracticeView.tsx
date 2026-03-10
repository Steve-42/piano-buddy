// 练习中页面：实时计时、音频状态显示

import type { PracticeStatus } from '../hooks/usePractice'
import type { DebugInfo } from '../services/audioDetector'

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
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-6 max-w-md text-center">
          <p className="text-red-300 text-lg mb-4">{error}</p>
          <button
            onClick={onReset}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  // 练习结束后展示结果
  if (status === 'finished') {
    const activeMin = Math.round(activeDuration / 60)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="text-center mb-8">
          <p className="text-slate-400 text-sm mb-2">今日练习</p>
          <p className="text-5xl font-bold text-white mb-1">
            {formatTime(activeDuration)}
          </p>
          <p className="text-slate-400">实际弹奏 {activeMin} 分钟</p>
        </div>

        {aiMessage && (
          <div className="w-full max-w-md bg-indigo-900/30 rounded-2xl p-6 mb-8 border border-indigo-700/30">
            <p className="text-slate-200 text-lg leading-relaxed">{aiMessage}</p>
          </div>
        )}

        <button
          onClick={onReset}
          className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-lg transition-colors"
        >
          返回首页
        </button>
      </div>
    )
  }

  // 练习中
  const isPlaying = status === 'playing'

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      {/* 状态指示器 */}
      <div className="mb-8 text-center">
        <div
          className={`w-4 h-4 rounded-full mx-auto mb-3 transition-colors duration-500 ${
            isPlaying ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-500'
          }`}
        />
        <p className="text-slate-400 text-sm">
          {isPlaying ? '检测到琴声，正在计时...' : '等待琴声...'}
        </p>
      </div>

      {/* 实际弹奏时间（主计时器） */}
      <div className="text-center mb-4">
        <p className="text-6xl font-mono font-bold text-white tracking-wider">
          {formatTime(activeDuration)}
        </p>
        <p className="text-slate-400 text-sm mt-2">实际弹奏</p>
      </div>

      {/* 总时长（次要） */}
      <div className="text-center mb-12">
        <p className="text-xl font-mono text-slate-500">
          {formatTime(totalDuration)}
        </p>
        <p className="text-slate-500 text-xs mt-1">总时长</p>
      </div>

      {/* 停止按钮 */}
      <button
        onClick={onStop}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600
                   hover:from-red-400 hover:to-red-500
                   text-white text-lg font-semibold
                   shadow-lg shadow-red-500/30
                   transition-all duration-300 active:scale-95
                   flex items-center justify-center"
      >
        结束
      </button>

      {/* 调试面板：显示 YAMNet 检测数据 */}
      {debug && (
        <div className="w-full max-w-md mt-8 bg-slate-800/70 rounded-xl p-4 border border-slate-700/50 font-mono text-xs">
          <p className="text-slate-500 mb-2">
            {debug.modelLoaded ? '调试数据（每 4 秒更新）' : debug.topClass || '正在加载 AI 模型...'}
          </p>
          {debug.modelLoaded && (
            <div className="grid grid-cols-2 gap-y-1 gap-x-4">
              <span className="text-slate-400">麦克风电平</span>
              <span className={debug.audioLevel > 0.01 ? 'text-emerald-400' : 'text-red-400'}>
                {debug.audioLevel.toFixed(3)} {debug.audioLevel < 0.001 ? '(无声音)' : ''}
              </span>
              <span className="text-slate-400">识别结果</span>
              <span className="text-slate-300">{debug.topClass}</span>
              <span className="text-slate-400">识别置信度</span>
              <span className="text-slate-500">{(debug.topScore * 100).toFixed(1)}%</span>
              <span className="text-slate-400">钢琴置信度</span>
              <span className={debug.isPiano ? 'text-emerald-400' : 'text-slate-500'}>
                {(debug.pianoScore * 100).toFixed(1)}%
              </span>
              <span className="text-slate-400">判定</span>
              <span className={debug.result === 'PIANO' ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {debug.result === 'PIANO' ? '钢琴声' : '非钢琴'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
