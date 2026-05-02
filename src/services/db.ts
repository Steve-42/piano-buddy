import Dexie, { type EntityTable } from 'dexie'
import { type PracticeSession, type UserSettings, DEFAULT_SETTINGS } from '../types'

const db = new Dexie('PianoBuddyDB') as Dexie & {
  sessions: EntityTable<PracticeSession, 'id'>
  settings: EntityTable<UserSettings, 'id'>
}

db.version(1).stores({
  sessions: '++id, date, startTime',
  settings: '++id',
})

// v2: 新增 backgroundImage 字段（Dexie 自动处理，无需修改 stores）
db.version(2).stores({
  sessions: '++id, date, startTime',
  settings: '++id',
})

// 获取用户设置，如果没有则创建默认设置
export async function getSettings(): Promise<UserSettings> {
  const existing = await db.settings.toCollection().first()
  if (existing) return existing
  const id = await db.settings.add({ ...DEFAULT_SETTINGS })
  return { ...DEFAULT_SETTINGS, id: id as number }
}

// 更新用户设置
export async function updateSettings(
  settings: Partial<UserSettings>,
): Promise<void> {
  const current = await getSettings()
  if (current.id) {
    await db.settings.update(current.id, settings)
  }
}

// 创建新的练习记录（开始练琴时调用）
export async function createSession(
  session: Omit<PracticeSession, 'id'>,
): Promise<number> {
  return (await db.sessions.add(session)) as number
}

// 更新练习记录（结束练琴时调用）
export async function updateSession(
  id: number,
  updates: Partial<PracticeSession>,
): Promise<void> {
  await db.sessions.update(id, updates)
}

// 获取某一天的练习记录
export async function getSessionsByDate(
  date: string,
): Promise<PracticeSession[]> {
  return db.sessions.where('date').equals(date).toArray()
}

// 获取最近 N 天的练习记录
export async function getRecentSessions(
  days: number,
): Promise<PracticeSession[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceDate = since.toISOString().slice(0, 10)
  return db.sessions.where('date').aboveOrEqual(sinceDate).toArray()
}

// 获取所有练习记录
export async function getAllSessions(): Promise<PracticeSession[]> {
  return db.sessions.orderBy('startTime').reverse().toArray()
}

// 计算连续练习天数（硬续：一断即清零）
export async function getStreak(): Promise<number> {
  const info = await getStreakInfo()
  return info.days
}

export interface StreakInfo {
  readonly days: number // 连续天数（含宽限日）
  readonly isSoft: boolean // 是否使用了宽限日（软续）
  readonly lastPracticeDate: string | null
  readonly daysSinceLastPractice: number // 999 表示从未练过
}

// 软续允许的最大连续中断天数：1 天偶尔断，不清零
const SOFT_STREAK_GRACE_DAYS = 1

// 计算连续练习天数（软续：允许中断 1 天不清零）+ 完整的最近练习状态
export async function getStreakInfo(): Promise<StreakInfo> {
  const sessions = await db.sessions.orderBy('date').reverse().toArray()
  if (sessions.length === 0) {
    return {
      days: 0,
      isSoft: false,
      lastPracticeDate: null,
      daysSinceLastPractice: 999,
    }
  }

  const practicedDates = new Set(sessions.map((s) => s.date))
  const lastPracticeDate = sessions[0].date

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const lastDate = new Date(lastPracticeDate + 'T00:00:00')
  const todayDateOnly = new Date(todayStr + 'T00:00:00')
  const daysSinceLastPractice = Math.max(
    0,
    Math.round(
      (todayDateOnly.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
    ),
  )

  let streak = 0
  let isSoft = false
  let consecutiveMisses = 0

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    const dateStr = checkDate.toISOString().slice(0, 10)

    if (practicedDates.has(dateStr)) {
      streak++
      consecutiveMisses = 0
    } else if (i === 0) {
      // 今天还没练不算断，继续往前看
      continue
    } else {
      consecutiveMisses++
      if (consecutiveMisses > SOFT_STREAK_GRACE_DAYS) break
      // 在宽限期内，标记软续后继续
      isSoft = true
    }
  }

  return {
    days: streak,
    isSoft,
    lastPracticeDate,
    daysSinceLastPractice,
  }
}

export default db
