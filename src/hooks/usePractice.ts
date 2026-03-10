// 练习核心 Hook：管理练习状态、音频检测、计时

import { useState, useRef, useCallback, useEffect } from 'react'
import { audioDetector, type DebugInfo } from '../services/audioDetector'
import {
  createSession,
  updateSession,
  getSettings,
  getStreak,
  getRecentSessions,
} from '../services/db'
import { generateEncouragement } from '../services/llmService'

export type PracticeStatus = 'idle' | 'listening' | 'playing' | 'finished'

interface PracticeState {
  status: PracticeStatus
  activeDuration: number // 实际弹奏秒数
  totalDuration: number // 总经过秒数
  aiMessage: string | null
  error: string | null
  debug: DebugInfo | null
}

const AUTO_STOP_SILENCE_MS = 5 * 60 * 1000 // 5 分钟无琴声自动停止

export function usePractice() {
  const [state, setState] = useState<PracticeState>({
    status: 'idle',
    activeDuration: 0,
    totalDuration: 0,
    aiMessage: null,
    error: null,
    debug: null,
  })

  const sessionIdRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const activeTimeRef = useRef<number>(0)
  const timerRef = useRef<number | null>(null)
  const lastDetectedRef = useRef<number>(0)
  const isPlayingRef = useRef<boolean>(false)

  // 每秒更新计时器
  useEffect(() => {
    if (state.status === 'listening' || state.status === 'playing') {
      timerRef.current = window.setInterval(() => {
        const now = Date.now()
        const total = Math.floor((now - startTimeRef.current) / 1000)

        // 如果正在弹奏，增加有效时间
        if (isPlayingRef.current) {
          activeTimeRef.current += 1
        }

        setState((prev) => ({
          ...prev,
          totalDuration: total,
          activeDuration: activeTimeRef.current,
        }))

        // 检查是否超过静默超时
        if (
          lastDetectedRef.current > 0 &&
          now - lastDetectedRef.current > AUTO_STOP_SILENCE_MS
        ) {
          stopPractice()
        }
      }, 1000)

      return () => {
        if (timerRef.current !== null) {
          clearInterval(timerRef.current)
        }
      }
    }
  }, [state.status])

  // 开始练习
  const startPractice = useCallback(async () => {
    setState((prev) => ({ ...prev, error: null, aiMessage: null }))

    const now = Date.now()
    const today = new Date().toISOString().slice(0, 10)

    try {
      // 创建数据库记录
      const sessionId = await createSession({
        date: today,
        startTime: now,
        endTime: null,
        activeDuration: 0,
        totalDuration: 0,
        aiMessage: null,
      })
      sessionIdRef.current = sessionId

      // 注册调试信息回调
      audioDetector.onDebug((debug) => {
        setState((prev) => ({ ...prev, debug }))
      })

      // 启动音频检测
      await audioDetector.start((detected) => {
        if (detected) {
          lastDetectedRef.current = Date.now()
          isPlayingRef.current = true
          setState((prev) =>
            prev.status === 'listening'
              ? { ...prev, status: 'playing' }
              : prev,
          )
        } else {
          isPlayingRef.current = false
          setState((prev) =>
            prev.status === 'playing'
              ? { ...prev, status: 'listening' }
              : prev,
          )
        }
      })

      startTimeRef.current = now
      activeTimeRef.current = 0
      lastDetectedRef.current = 0
      isPlayingRef.current = false

      setState((prev) => ({
        ...prev,
        status: 'listening',
        activeDuration: 0,
        totalDuration: 0,
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('麦克风启动失败:', err)

      let userMsg: string
      if (!navigator.mediaDevices) {
        userMsg = '当前环境不支持麦克风访问（需要 HTTPS）。请确认使用 https:// 地址访问。'
      } else if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        userMsg = '麦克风权限被拒绝。请在浏览器地址栏左侧点击锁/设置图标，允许麦克风权限后刷新页面重试。'
      } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFound')) {
        userMsg = '未检测到麦克风设备。请确认设备已连接。'
      } else {
        userMsg = `麦克风访问失败：${msg}`
      }

      setState((prev) => ({
        ...prev,
        error: userMsg,
      }))
    }
  }, [])

  // 停止练习
  const stopPractice = useCallback(async () => {
    audioDetector.stop()

    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    const endTime = Date.now()
    const totalDuration = Math.floor(
      (endTime - startTimeRef.current) / 1000,
    )
    const activeDuration = activeTimeRef.current

    setState((prev) => ({
      ...prev,
      status: 'finished',
      totalDuration,
      activeDuration,
    }))

    // 生成 AI 鼓励消息
    try {
      const settings = await getSettings()
      const streak = await getStreak()
      const recent = await getRecentSessions(7)

      // 计算距上次练习天数
      const today = new Date().toISOString().slice(0, 10)
      const previousSessions = recent.filter((s) => s.date !== today)
      const daysSinceLastPractice =
        previousSessions.length > 0
          ? Math.floor(
              (Date.now() - previousSessions[0].startTime) /
                (1000 * 60 * 60 * 24),
            )
          : 999

      const message = await generateEncouragement({
        activeDuration,
        totalDuration,
        dailyGoal: settings.dailyGoalMinutes,
        streak: streak + (activeDuration > 0 ? 1 : 0), // 包含今天
        daysSinceLastPractice,
      })

      setState((prev) => ({ ...prev, aiMessage: message }))

      // 更新数据库记录
      if (sessionIdRef.current) {
        await updateSession(sessionIdRef.current, {
          endTime,
          activeDuration,
          totalDuration,
          aiMessage: message,
        })
      }
    } catch (error) {
      console.error('生成鼓励消息失败:', error)
      const errMsg = error instanceof Error ? error.message : String(error)
      // 显示 fallback 消息 + 错误提示
      const fallback = activeDuration >= 300
        ? `练了 ${Math.round(activeDuration / 60)} 分钟，不错！`
        : '今天坐到了琴凳上，这就是一个好的开始。'
      const aiMessage = `${fallback}\n\n(AI 鼓励生成失败：${errMsg})`

      setState((prev) => ({ ...prev, aiMessage }))

      if (sessionIdRef.current) {
        await updateSession(sessionIdRef.current, {
          endTime,
          activeDuration,
          totalDuration,
          aiMessage,
        })
      }
    }
  }, [])

  // 重置状态（回到首页）
  const reset = useCallback(() => {
    setState({
      status: 'idle',
      activeDuration: 0,
      totalDuration: 0,
      aiMessage: null,
      error: null,
      debug: null,
    })
    sessionIdRef.current = null
  }, [])

  return {
    ...state,
    startPractice,
    stopPractice,
    reset,
  }
}
