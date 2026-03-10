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

// 计算连续练习天数
export async function getStreak(): Promise<number> {
  const sessions = await db.sessions.orderBy('date').reverse().toArray()
  if (sessions.length === 0) return 0

  const practicedDates = new Set(sessions.map((s) => s.date))
  let streak = 0
  const today = new Date()

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    const dateStr = checkDate.toISOString().slice(0, 10)

    if (practicedDates.has(dateStr)) {
      streak++
    } else if (i === 0) {
      // 今天还没练，不算中断，继续往前查
      continue
    } else {
      break
    }
  }

  return streak
}

export default db
