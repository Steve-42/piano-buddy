// Wake Lock：练习期间阻止屏幕自动锁定
// 使用 Screen Wake Lock API，主流移动浏览器均支持

import { useEffect, useRef } from 'react'

export function useWakeLock(active: boolean): void {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active) {
      release(wakeLockRef.current)
      wakeLockRef.current = null
      return
    }

    // 不支持 Wake Lock API 则静默跳过
    if (!('wakeLock' in navigator)) {
      console.warn('Wake Lock API 不可用，屏幕可能自动锁定')
      return
    }

    const acquire = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch (err) {
        console.warn('Wake Lock 请求失败:', err)
      }
    }

    acquire()

    // 用户切换标签页后回来时，需要重新获取锁
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && active) {
        acquire()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      release(wakeLockRef.current)
      wakeLockRef.current = null
    }
  }, [active])
}

function release(lock: WakeLockSentinel | null): void {
  if (lock) {
    lock.release().catch(() => {})
  }
}
