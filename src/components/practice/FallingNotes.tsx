// 飘落音符层 - 多种音符 SVG，多种透明度/大小/旋转/速度

import { useMemo } from 'react'

export type NoteDensity = 'sparse' | 'medium' | 'dense'

type NoteKind = 'quarter' | 'eighth' | 'sixteenth' | 'beam'

interface NoteGlyphProps {
  kind: NoteKind
  size: number
  color: string
}

function NoteGlyph({ kind, size, color }: NoteGlyphProps) {
  const stroke = color
  if (kind === 'quarter') {
    return (
      <svg width={size} height={size * 1.4} viewBox="0 0 14 20" style={{ overflow: 'visible' }}>
        <ellipse cx="5" cy="15.5" rx="4" ry="3" fill={stroke} transform="rotate(-22 5 15.5)" />
        <line x1="8.6" y1="14.5" x2="8.6" y2="2" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    )
  }
  if (kind === 'eighth') {
    return (
      <svg width={size} height={size * 1.4} viewBox="0 0 14 20" style={{ overflow: 'visible' }}>
        <ellipse cx="5" cy="15.5" rx="4" ry="3" fill={stroke} transform="rotate(-22 5 15.5)" />
        <line x1="8.6" y1="14.5" x2="8.6" y2="2" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M8.6 2 Q12.5 4 12 9" stroke={stroke} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </svg>
    )
  }
  if (kind === 'sixteenth') {
    return (
      <svg width={size} height={size * 1.4} viewBox="0 0 14 20" style={{ overflow: 'visible' }}>
        <ellipse cx="5" cy="15.5" rx="4" ry="3" fill={stroke} transform="rotate(-22 5 15.5)" />
        <line x1="8.6" y1="14.5" x2="8.6" y2="2" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M8.6 2 Q12.5 4 12 9" stroke={stroke} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M8.6 6 Q12.5 8 12 13" stroke={stroke} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width={size * 1.6} height={size * 1.4} viewBox="0 0 22 20" style={{ overflow: 'visible' }}>
      <ellipse cx="4" cy="15.5" rx="3.5" ry="2.6" fill={stroke} transform="rotate(-22 4 15.5)" />
      <ellipse cx="15" cy="15.5" rx="3.5" ry="2.6" fill={stroke} transform="rotate(-22 15 15.5)" />
      <line x1="7.4" y1="14.5" x2="7.4" y2="3" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="18.4" y1="14.5" x2="18.4" y2="3" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M7 3 L19 3" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

interface FallingNote {
  kind: NoteKind
  x: number
  size: number
  opacity: number
  rotate: number
  delay: number
  duration: number
  sway: 1 | -1
}

const KINDS: readonly NoteKind[] = ['quarter', 'eighth', 'sixteenth', 'beam']

export function FallingNotes({ density = 'medium' }: { density?: NoteDensity }) {
  const counts = { sparse: 7, medium: 14, dense: 22 }
  const n = counts[density]

  const notes = useMemo<FallingNote[]>(() => {
    const out: FallingNote[] = []
    for (let i = 0; i < n; i++) {
      const seed = (i + 1) * 9301
      const r1 = ((seed * 1103) % 10000) / 10000
      const r2 = ((seed * 7919) % 10000) / 10000
      const r3 = ((seed * 2347) % 10000) / 10000
      const r4 = ((seed * 4421) % 10000) / 10000
      const r5 = ((seed * 6529) % 10000) / 10000
      out.push({
        kind: KINDS[Math.floor(r1 * 4)],
        x: r2 * 100,
        size: 14 + r3 * 18,
        opacity: 0.18 + r4 * 0.42,
        rotate: -25 + r5 * 50,
        delay: -r1 * 18,
        duration: 14 + r2 * 14,
        sway: r3 > 0.5 ? 1 : -1,
      })
    }
    return out
  }, [n])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      {notes.map((nt, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '-10%',
            left: `${nt.x}%`,
            opacity: nt.opacity,
            transform: `rotate(${nt.rotate}deg)`,
            animation: `note-fall-${nt.sway > 0 ? 'r' : 'l'} ${nt.duration}s linear infinite`,
            animationDelay: `${nt.delay}s`,
            willChange: 'transform',
            // CSS var consumed by keyframes for opacity
            ['--note-opacity' as string]: nt.opacity,
          } as React.CSSProperties}
        >
          <NoteGlyph kind={nt.kind} size={nt.size} color={`rgba(16,185,129,${nt.opacity + 0.1})`} />
        </div>
      ))}
    </div>
  )
}
