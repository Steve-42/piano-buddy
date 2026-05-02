// 植物 4 阶段 SVG - 来自 Claude Design 交接稿
// stages: empty / sprout / growing / bloom
// 同一组件支持小尺寸 (32px 花园格) 与大尺寸 (300px 练习中)

import { useId } from 'react'
import type { PlantStage } from '../../styles/tokens'

const C = {
  soilDark: '#5a4836',
  soilMid: '#7a6447',
  soilLight: '#a08362',
  soilHighlight: '#c9a98a',
  stem: '#10b981',
  stemDark: '#059669',
  stemDeep: '#047857',
  leaf: '#34d399',
  leafLight: '#6ee7b7',
  leafDark: '#10b981',
  bloom: '#f4a4a4',
  bloomDeep: '#e88080',
  bloomCenter: '#fef3c7',
  bloomCenterDeep: '#fde68a',
  seedShellLight: '#a98869',
  seedShellDark: '#5a4836',
  seedShellHi: '#c9a98a',
  veinLight: '#a7f3d0',
}

interface DefsProps {
  id: string
}

function PlantDefs({ id }: DefsProps) {
  return (
    <defs>
      <radialGradient id={`${id}-soil`} cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor={C.soilLight} />
        <stop offset="60%" stopColor={C.soilMid} />
        <stop offset="100%" stopColor={C.soilDark} />
      </radialGradient>
      <linearGradient id={`${id}-leaf`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={C.leafLight} />
        <stop offset="100%" stopColor={C.leafDark} />
      </linearGradient>
      <linearGradient id={`${id}-leaf-dark`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={C.leaf} />
        <stop offset="100%" stopColor={C.stemDeep} />
      </linearGradient>
      <linearGradient id={`${id}-stem`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={C.stemDark} />
        <stop offset="50%" stopColor={C.stem} />
        <stop offset="100%" stopColor={C.stemDeep} />
      </linearGradient>
      <radialGradient id={`${id}-petal`} cx="50%" cy="40%" r="65%">
        <stop offset="0%" stopColor="#fbcccc" />
        <stop offset="60%" stopColor={C.bloom} />
        <stop offset="100%" stopColor={C.bloomDeep} />
      </radialGradient>
      <radialGradient id={`${id}-seed`} cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor={C.seedShellHi} />
        <stop offset="50%" stopColor={C.seedShellLight} />
        <stop offset="100%" stopColor={C.seedShellDark} />
      </radialGradient>
      <radialGradient id={`${id}-center`} cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor={C.bloomCenter} />
        <stop offset="100%" stopColor={C.bloomCenterDeep} />
      </radialGradient>
    </defs>
  )
}

function SoilMound({ id, width = 60 }: { id: string; width?: number }) {
  const half = width / 2
  return (
    <g>
      <ellipse cx="50" cy="89" rx={half} ry="3.5" fill={`url(#${id}-soil)`} />
      <ellipse cx="50" cy="87.5" rx={half - 3} ry="1.4" fill={C.soilHighlight} opacity="0.5" />
      <ellipse cx="50" cy="91" rx={half - 1} ry="1" fill={C.soilDark} opacity="0.45" />
      <circle cx={50 - width * 0.2} cy="89.5" r="0.6" fill={C.soilDark} opacity="0.5" />
      <circle cx={50 + width * 0.15} cy="88.2" r="0.5" fill={C.soilDark} opacity="0.55" />
      <circle cx={50 - width * 0.05} cy="90" r="0.45" fill={C.soilDark} opacity="0.5" />
      <circle cx={50 + width * 0.25} cy="89.8" r="0.5" fill={C.soilDark} opacity="0.45" />
    </g>
  )
}

interface LeafProps {
  id: string
  cx: number
  cy: number
  length: number
  angle?: number
  dark?: boolean
  flip?: boolean
}

function Leaf({ id, cx, cy, length, angle = 0, dark = false, flip = false }: LeafProps) {
  const w = length / 2.4
  const dir = flip ? -1 : 1
  const d = `M ${cx} ${cy}
             Q ${cx - dir * length * 0.6} ${cy - w * 0.9}
               ${cx - dir * length} ${cy - w * 0.05}
             Q ${cx - dir * length * 0.6} ${cy + w * 0.5}
               ${cx} ${cy} Z`
  const veinX2 = cx - dir * length * 0.92
  const veinY2 = cy - w * 0.08
  return (
    <g transform={`rotate(${angle} ${cx} ${cy})`}>
      <path d={d} fill={C.stemDeep} opacity="0.18" transform="translate(0.5 1)" />
      <path d={d} fill={dark ? `url(#${id}-leaf-dark)` : `url(#${id}-leaf)`} />
      <line
        x1={cx - dir * 1.5}
        y1={cy - 0.5}
        x2={veinX2}
        y2={veinY2}
        stroke={C.veinLight}
        strokeWidth="0.5"
        opacity="0.85"
        strokeLinecap="round"
      />
      <line
        x1={cx - dir * length * 0.25}
        y1={cy - 1}
        x2={cx - dir * length * 0.45}
        y2={cy - w * 0.55}
        stroke={C.veinLight}
        strokeWidth="0.3"
        opacity="0.6"
        strokeLinecap="round"
      />
      <line
        x1={cx - dir * length * 0.55}
        y1={cy - 1}
        x2={cx - dir * length * 0.75}
        y2={cy - w * 0.4}
        stroke={C.veinLight}
        strokeWidth="0.3"
        opacity="0.55"
        strokeLinecap="round"
      />
      <ellipse
        cx={cx - dir * length * 0.3}
        cy={cy - w * 0.3}
        rx={length * 0.18}
        ry={w * 0.25}
        fill={C.leafLight}
        opacity="0.45"
        transform={`rotate(${angle * 0.6} ${cx} ${cy})`}
      />
    </g>
  )
}

interface PlantProps {
  size?: number
  animated?: boolean
  glow?: boolean
}

function PlantSeed({ size = 64, animated = false }: PlantProps) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', overflow: 'visible' }}>
      <PlantDefs id={id} />
      <SoilMound id={id} width={52} />
      <g style={animated ? { animation: 'plant-seed-wiggle 3.2s ease-in-out infinite', transformOrigin: '50px 86px' } : undefined}>
        <ellipse cx="51" cy="91" rx="8" ry="1.2" fill={C.soilDark} opacity="0.4" />
        <ellipse cx="50" cy="83" rx="9" ry="11.5" fill={`url(#${id}-seed)`} />
        <path d="M50 73 Q52.5 83 50 93.5" stroke={C.seedShellDark} strokeWidth="0.7" fill="none" opacity="0.7" />
        <ellipse cx="46" cy="78" rx="2.4" ry="4.5" fill="#fff" opacity="0.4" />
        <ellipse cx="46.5" cy="78" rx="1.2" ry="2.5" fill="#fff" opacity="0.6" />
        <path d="M50 74 Q50.5 73 51 72" stroke={C.stemDeep} strokeWidth="0.6" fill="none" opacity="0.7" />
      </g>
    </svg>
  )
}

function PlantSprout({ size = 64, animated = false }: PlantProps) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', overflow: 'visible' }}>
      <PlantDefs id={id} />
      <SoilMound id={id} width={56} />
      <path d="M44 88 Q50 85 56 88 Q53 90 47 90 Z" fill={C.seedShellDark} opacity="0.55" />
      <g style={animated ? { animation: 'plant-sway 4s ease-in-out infinite', transformOrigin: '50px 88px' } : undefined}>
        <path d="M50 86 Q49.6 78 50 70" stroke={`url(#${id}-stem)`} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <Leaf id={id} cx={50} cy={70} length={11} angle={-30} />
        <Leaf id={id} cx={50} cy={70} length={11} angle={30} flip />
        <ellipse cx="50" cy="68" rx="1.4" ry="2" fill={C.stemDeep} />
        <circle cx="50" cy="67" r="0.6" fill={C.leafLight} opacity="0.8" />
      </g>
    </svg>
  )
}

function PlantGrowing({ size = 64, animated = false }: PlantProps) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', overflow: 'visible' }}>
      <PlantDefs id={id} />
      <SoilMound id={id} width={62} />
      <g style={animated ? { animation: 'plant-sway 4s ease-in-out infinite', transformOrigin: '50px 88px' } : undefined}>
        <path
          d="M50 86 Q48 70 50.5 50 Q52 38 50 30"
          stroke={`url(#${id}-stem)`}
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
        />
        <Leaf id={id} cx={49.5} cy={66} length={18} angle={-12} dark />
        <Leaf id={id} cx={50.5} cy={66} length={18} angle={12} flip dark />
        <Leaf id={id} cx={50} cy={48} length={13} angle={-18} />
        <Leaf id={id} cx={50.5} cy={48} length={13} angle={18} flip />
        <Leaf id={id} cx={50} cy={36} length={8} angle={-22} />
        <Leaf id={id} cx={50.3} cy={36} length={8} angle={22} flip />
        <ellipse cx="50" cy="29" rx="2.2" ry="3.4" fill={C.stemDeep} />
        <ellipse cx="49.3" cy="28" rx="0.9" ry="2" fill={C.leafLight} opacity="0.8" />
      </g>
    </svg>
  )
}

function PlantBloom({ size = 64, animated = false, glow = false }: PlantProps) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', overflow: 'visible' }}>
      <PlantDefs id={id} />
      {glow && (
        <>
          <defs>
            <radialGradient id={`${id}-glow`} cx="50%" cy="30%" r="55%">
              <stop offset="0%" stopColor={C.bloom} stopOpacity="0.45" />
              <stop offset="100%" stopColor={C.bloom} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="26" r="42" fill={`url(#${id}-glow)`}>
            {animated && <animate attributeName="r" values="38;46;38" dur="3s" repeatCount="indefinite" />}
          </circle>
        </>
      )}
      <SoilMound id={id} width={64} />
      <g style={animated ? { animation: 'plant-sway 4.5s ease-in-out infinite', transformOrigin: '50px 88px' } : undefined}>
        <path
          d="M50 86 Q48 68 50.5 48 Q52 36 50 26"
          stroke={`url(#${id}-stem)`}
          strokeWidth="2.8"
          fill="none"
          strokeLinecap="round"
        />
        <Leaf id={id} cx={49.5} cy={68} length={20} angle={-10} dark />
        <Leaf id={id} cx={50.5} cy={68} length={20} angle={10} flip dark />
        <Leaf id={id} cx={50} cy={50} length={15} angle={-16} />
        <Leaf id={id} cx={50.5} cy={50} length={15} angle={16} flip />
        <Leaf id={id} cx={50} cy={36} length={9} angle={-22} />
        <Leaf id={id} cx={50.3} cy={36} length={9} angle={22} flip />
        <g style={animated ? { animation: 'plant-bloom-pulse 3.5s ease-in-out infinite', transformOrigin: '50px 26px' } : undefined}>
          <ellipse cx="50" cy="17" rx="6" ry="8" fill={C.bloomDeep} opacity="0.9" />
          <ellipse cx="40" cy="22" rx="6" ry="8" fill={C.bloomDeep} opacity="0.9" transform="rotate(-65 40 22)" />
          <ellipse cx="60" cy="22" rx="6" ry="8" fill={C.bloomDeep} opacity="0.9" transform="rotate(65 60 22)" />
          <ellipse cx="42" cy="34" rx="6" ry="8" fill={C.bloomDeep} opacity="0.9" transform="rotate(-130 42 34)" />
          <ellipse cx="58" cy="34" rx="6" ry="8" fill={C.bloomDeep} opacity="0.9" transform="rotate(130 58 34)" />
          <ellipse cx="50" cy="18" rx="5" ry="7" fill={`url(#${id}-petal)`} />
          <ellipse cx="41" cy="23" rx="5" ry="7" fill={`url(#${id}-petal)`} transform="rotate(-65 41 23)" />
          <ellipse cx="59" cy="23" rx="5" ry="7" fill={`url(#${id}-petal)`} transform="rotate(65 59 23)" />
          <ellipse cx="43" cy="33" rx="5" ry="7" fill={`url(#${id}-petal)`} transform="rotate(-130 43 33)" />
          <ellipse cx="57" cy="33" rx="5" ry="7" fill={`url(#${id}-petal)`} transform="rotate(130 57 33)" />
          <ellipse cx="50.5" cy="15" rx="1.5" ry="3" fill="#fff" opacity="0.45" />
          <ellipse cx="40" cy="20.5" rx="1.5" ry="3" fill="#fff" opacity="0.4" transform="rotate(-65 40 20.5)" />
          <ellipse cx="60" cy="20.5" rx="1.5" ry="3" fill="#fff" opacity="0.4" transform="rotate(65 60 20.5)" />
          <circle cx="50" cy="26" r="3.6" fill={`url(#${id}-center)`} />
          <circle cx="49.2" cy="25" r="1.1" fill="#fff" opacity="0.45" />
        </g>
      </g>
    </svg>
  )
}

function PlantEmpty({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
      <circle cx="50" cy="86" r="3" fill={C.soilDark} opacity={0.18} />
    </svg>
  )
}

// 花园空格：暖棕土壤 + 萌芽中的小种子
export function EmptyCell({ size = 32, recentlyAway = false }: { size?: number; recentlyAway?: boolean }) {
  const seedOpacity = recentlyAway ? 0.85 : 0.65
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', overflow: 'visible' }}>
      <ellipse cx="50" cy="78" rx="30" ry="6" fill="#8b7355" opacity="0.42" />
      <ellipse cx="50" cy="74" rx="26" ry="5" fill="#a08362" opacity="0.55" />
      <path d="M28 73 Q40 70 50 72 T72 73" stroke="#6b5b48" strokeWidth="1.4" fill="none" opacity="0.45" strokeLinecap="round" />
      <path d="M30 79 Q42 76 50 78 T70 79" stroke="#6b5b48" strokeWidth="1.4" fill="none" opacity="0.40" strokeLinecap="round" />
      <ellipse cx="50" cy="69" rx="3.6" ry="2.6" fill="#5a4836" opacity={seedOpacity} />
      <path d="M50 67 Q49 62 50 58" stroke="#10b981" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity={seedOpacity} />
      <ellipse cx="48.5" cy="59" rx="2.2" ry="1.1" fill="#34d399" opacity={seedOpacity} transform="rotate(-25 48.5 59)" />
      <ellipse cx="51.5" cy="59" rx="2.2" ry="1.1" fill="#34d399" opacity={seedOpacity} transform="rotate(25 51.5 59)" />
    </svg>
  )
}

interface PlantOuterProps extends PlantProps {
  stage: PlantStage
}

export function Plant({ stage, size = 64, animated = false, glow = false }: PlantOuterProps) {
  switch (stage) {
    case 'sprout':
      return <PlantSprout size={size} animated={animated} />
    case 'growing':
      return <PlantGrowing size={size} animated={animated} />
    case 'bloom':
      return <PlantBloom size={size} animated={animated} glow={glow} />
    case 'empty':
    default:
      return <PlantEmpty size={size} />
  }
}

// 仅在 Comeback 卡片中使用的 sprout（保留导出，方便外部按需引用）
export { PlantSprout, PlantSeed }
