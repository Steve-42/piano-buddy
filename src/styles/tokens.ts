// 设计 tokens - cream + emerald palette, 来自 Claude Design 交接稿

export const PB = {
  cream: '#fef8ed',
  creamWarm: '#fbf2dc',
  creamDeep: '#f5e9c9',
  ink: '#3d3428',
  inkSoft: '#6b5e4c',
  inkDim: '#a39684',
  divider: 'rgba(61, 52, 40, 0.08)',
  emerald: '#10b981',
  emeraldDark: '#059669',
  emeraldDeep: '#047857',
  emeraldSoft: '#d1fae5',
  emeraldBg: '#ecfdf5',
} as const

export const PAGE_BG = `radial-gradient(at 20% 0%, ${PB.creamWarm} 0%, transparent 50%), radial-gradient(at 90% 100%, ${PB.creamDeep} 0%, transparent 60%), ${PB.cream}`
export const PRACTICE_BG = `radial-gradient(at 30% 0%, ${PB.creamWarm} 0%, transparent 50%), radial-gradient(at 70% 100%, ${PB.creamDeep} 0%, transparent 60%), ${PB.cream}`

export const SERIF = '"Fraunces", Georgia, serif'

// 植物档位：1-10 嫩芽 / 10-20 小苗 / 20+ 开花
// 0 → empty，由花园格子用「萌芽种子」隐喻填充
export type PlantStage = 'empty' | 'sprout' | 'growing' | 'bloom'

export function plantStageForMinutes(minutes: number): PlantStage {
  if (!minutes || minutes <= 0) return 'empty'
  if (minutes < 10) return 'sprout'
  if (minutes < 20) return 'growing'
  return 'bloom'
}

export const STAGE_NAME: Record<Exclude<PlantStage, 'empty'>, string> = {
  sprout: '一株嫩芽',
  growing: '一株小苗',
  bloom: '一朵花',
}

export const STAGE_TONE: Record<Exclude<PlantStage, 'empty'>, string> = {
  sprout: '没有目标地弹一会儿。',
  growing: '专注的一段时间。',
  bloom: '完整的、不被打扰的练习。',
}
