import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useStore } from '../../store'
import { paintCardsInto } from '../../ui/cardPaint'
import { Box, Poster, Screen, useGlow, type V3 } from '../common'
import { Shell } from './Shell'

const Y1 = 3.6

/* ---------- STUDIO: 4 massings under a moving sun, Givoni chart ---------- */

function Massing({ p, blocks }: { p: V3; blocks: [number, number, number, number, number][] }) {
  return (
    <group position={p}>
      <Box p={[0, 0.01, 0]} s={[0.62, 0.02, 0.62]} c="#b7ae9c" />
      {blocks.map(([x, z, w, d, h], i) => (
        <Box key={i} p={[x, 0.02 + h / 2, z]} s={[w, h, d]} c="#f2efe7" />
      ))}
    </group>
  )
}

function SunArc({ p }: { p: V3 }) {
  // the sun swings between its December and June noon heights, 24° and 69°
  const sun = useRef<THREE.Mesh>(null)
  const glow = useGlow('studio', '#ffcf7a', 3, 'equip', 0.05)
  useFrame(({ clock }) => {
    if (!sun.current) return
    const k = (Math.sin(clock.elapsedTime * 0.5) + 1) / 2
    const a = THREE.MathUtils.degToRad(24 + k * 45)
    const R = 1.25
    sun.current.position.set(0, Math.sin(a) * R, Math.cos(a) * R)
  })
  return (
    <group position={p}>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1.25, 0.008, 4, 48, Math.PI]} />
        <meshBasicMaterial color="#ffcf7a" transparent opacity={0.45} />
      </mesh>
      <mesh ref={sun} material={glow} userData={{ dynamic: true }}>
        <sphereGeometry args={[0.07, 12, 8]} />
      </mesh>
    </group>
  )
}

export function Studio() {
  return (
    <group>
      <Shell id="studio" x0={-8.92} x1={-0.08} y={Y1} floor="#7a5a3e" wall="#ddd7cb" battens={3} />
      {/* model table: the 4 massings compared */}
      <group position={[-6.1, Y1, -2.9]}>
        <Box p={[0, 0.88, 0]} s={[3.0, 0.06, 1.4]} c="#e7e1d4" />
        {[-1.4, 1.4].map((x) => (
          <Box key={x} p={[x, 0.44, 0]} s={[0.06, 0.88, 1.3]} c="#3a3f46" />
        ))}
        <Massing p={[-1.05, 0.91, 0]} blocks={[[0, 0, 0.4, 0.4, 0.42]]} />
        <Massing p={[-0.35, 0.91, 0]} blocks={[[-0.12, 0, 0.16, 0.5, 0.34], [0.12, 0, 0.16, 0.5, 0.24]]} />
        <Massing p={[0.35, 0.91, 0]} blocks={[[0, -0.12, 0.5, 0.18, 0.4], [0, 0.14, 0.3, 0.18, 0.18]]} />
        <Massing p={[1.05, 0.91, 0]} blocks={[[-0.14, -0.14, 0.2, 0.2, 0.46], [0.12, 0.08, 0.26, 0.3, 0.22]]} />
        <SunArc p={[0, 0.95, 0]} />
      </group>
      {/* desk with the Revit model */}
      <group position={[-2.5, Y1, -5.3]}>
        <Box p={[0, 0.76, 0]} s={[2.2, 0.06, 0.9]} c="#c9c4b8" />
        {[-1.0, 1.0].map((x) => (
          <Box key={x} p={[x, 0.38, 0]} s={[0.06, 0.76, 0.8]} c="#2a2e34" />
        ))}
        <Screen
          id="studio"
          p={[0, 1.16, -0.2]}
          size={[0.95, 0.55]}
          px={[400, 230]}
          fps={2}
          paint={(ctx, t, w, h) => {
            ctx.fillStyle = '#dfe3e6'
            ctx.fillRect(0, 0, w, h)
            // an axonometric block model, slowly turning
            const a = t * 0.3
            ctx.strokeStyle = '#2b4a6a'
            ctx.lineWidth = 2
            const pts = [
              [-1, -1], [1, -1], [1, 1], [-1, 1],
            ].map(([x, z]) => [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)])
            const proj = (x: number, z: number, y: number) => [w / 2 + x * 70, h * 0.62 + z * 28 - y * 60]
            for (const lvl of [0, 1, 2]) {
              ctx.beginPath()
              pts.forEach(([x, z], i) => {
                const [px, py] = proj(x, z, lvl * 0.7)
                if (i) ctx.lineTo(px, py)
                else ctx.moveTo(px, py)
              })
              ctx.closePath()
              ctx.stroke()
            }
            pts.forEach(([x, z]) => {
              const [a1, b1] = proj(x, z, 0)
              const [a2, b2] = proj(x, z, 1.4)
              ctx.beginPath()
              ctx.moveTo(a1, b1)
              ctx.lineTo(a2, b2)
              ctx.stroke()
            })
          }}
        />
      </group>
      {/* Givoni bioclimatic chart pinned on the wall */}
      <Poster
        p={[-6.1, Y1 + 1.95, -5.96]}
        size={[1.6, 1.1]}
        px={[640, 440]}
        paint={(ctx, w, h) => {
          ctx.fillStyle = '#f1ece0'
          ctx.fillRect(0, 0, w, h)
          ctx.strokeStyle = '#141414'
          ctx.lineWidth = 2
          ctx.strokeRect(40, 60, w - 80, h - 110)
          // saturation curve
          ctx.beginPath()
          for (let x = 0; x <= 1; x += 0.02) {
            const px = 40 + x * (w - 80)
            const py = 60 + (h - 110) * (1 - Math.pow(x, 2.1))
            if (x) ctx.lineTo(px, py)
            else ctx.moveTo(px, py)
          }
          ctx.stroke()
          // comfort zone and passive-strategy zones
          const zone = (pts: number[][], fill: string) => {
            ctx.beginPath()
            pts.forEach(([x, y], i) => {
              const px = 40 + x * (w - 80)
              const py = 60 + (h - 110) * (1 - y)
              if (i) ctx.lineTo(px, py)
              else ctx.moveTo(px, py)
            })
            ctx.closePath()
            ctx.fillStyle = fill
            ctx.fill()
            ctx.stroke()
          }
          zone([[0.62, 0.05], [0.8, 0.05], [0.74, 0.5], [0.56, 0.4]], 'rgba(31,107,67,0.35)')
          zone([[0.8, 0.05], [0.95, 0.05], [0.9, 0.3], [0.77, 0.27]], 'rgba(255,176,74,0.4)')
          ctx.fillStyle = '#141414'
          ctx.font = 'condensed 800 34px "Archivo Variable", sans-serif'
          ctx.fillText('GIVONI  ·  RENNES', 40, 44)
          ctx.font = '500 18px "B612 Mono", monospace'
          ctx.fillText('≤ 80 h > 28 °C', w - 210, h - 22)
        }}
      />
      {/* section drawing with the 55° overhang cut */}
      <Poster
        p={[-3.3, Y1 + 1.9, -5.96]}
        size={[1.1, 0.8]}
        px={[440, 320]}
        paint={(ctx, w, h) => {
          ctx.fillStyle = '#f1ece0'
          ctx.fillRect(0, 0, w, h)
          ctx.strokeStyle = '#141414'
          ctx.lineWidth = 3
          ctx.strokeRect(120, 120, 180, 150)
          ctx.beginPath()
          ctx.moveTo(110, 120)
          ctx.lineTo(330, 120)
          ctx.stroke()
          ctx.setLineDash([8, 6])
          ctx.lineWidth = 2
          for (const [deg, c] of [
            [24, '#b5651d'],
            [69, '#1f6b43'],
          ] as const) {
            const a = (deg * Math.PI) / 180
            ctx.strokeStyle = c
            ctx.beginPath()
            ctx.moveTo(300, 270)
            ctx.lineTo(300 + Math.cos(a) * 160, 270 - Math.sin(a) * 160)
            ctx.stroke()
          }
          ctx.setLineDash([])
          ctx.fillStyle = '#141414'
          ctx.font = 'condensed 800 30px "Archivo Variable", sans-serif'
          ctx.fillText('OVERHANG 55°', 20, 44)
          ctx.font = '500 18px "B612 Mono", monospace'
          ctx.fillText('DEC 24°  JUN 69°', 20, h - 20)
        }}
      />
    </group>
  )
}

/* ---------- ARCADE: the BOLOSS cabinet ---------- */

const CARD_COLORS = ['#c0392b', '#2e6da4', '#e2a72e', '#2f8a59', '#7c4fb0']

function Cabinet({ p, main = false, onSelect }: { p: V3; main?: boolean; onSelect?: () => void }) {
  const trim = useGlow('arcade', main ? '#ff5fa2' : '#5fd0ff', 2.4, 'equip', 0.05)
  return (
    <group
      position={p}
      onClick={(e) => {
        if (!onSelect) return
        e.stopPropagation()
        onSelect()
      }}
      onPointerOver={() => onSelect && (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <Box p={[0, 0.9, 0]} s={[0.9, 1.8, 0.8]} c={main ? '#2a1f3d' : '#1f2a3d'} />
      <Box p={[0, 1.95, 0.05]} s={[0.9, 0.32, 0.7]} c={main ? '#2a1f3d' : '#1f2a3d'} />
      <mesh position={[0, 1.95, 0.41]} material={trim}>
        <boxGeometry args={[0.8, 0.22, 0.01]} />
      </mesh>
      <Box p={[0, 1.02, 0.35]} s={[0.86, 0.12, 0.3]} c="#141019" r={[0.3, 0, 0]} />
      <Screen
        id="arcade"
        p={[0, 1.42, 0.38]}
        r={[-0.12, 0, 0]}
        size={[0.66, 0.5]}
        px={[400, 300]}
        fps={main ? 20 : 6}
        paint={main ? paintCardsInto : (ctx, t, w, h) => {
          ctx.fillStyle = '#06121c'
          ctx.fillRect(0, 0, w, h)
          ctx.fillStyle = '#5fd0ff'
          for (let i = 0; i < 12; i++) ctx.fillRect(((t * 60 + i * 37) % w), (i * 23) % h, 8, 8)
        }}
      />
      {[-0.46, 0.46].map((x) => (
        <mesh key={x} position={[x, 1.0, 0]} material={trim}>
          <boxGeometry args={[0.02, 1.9, 0.78]} />
        </mesh>
      ))}
    </group>
  )
}

function CardTable({ p }: { p: V3 }) {
  const cards = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        x: -0.6 + i * 0.2 + Math.sin(i) * 0.03,
        z: (i % 2) * 0.18 - 0.1,
        r: Math.sin(i * 3) * 0.2,
        c: CARD_COLORS[i % CARD_COLORS.length],
      })),
    [],
  )
  return (
    <group position={p}>
      <Box p={[0, 0.74, 0]} s={[1.7, 0.05, 1.1]} c="#2f5d45" />
      <Box p={[0, 0.37, 0]} s={[0.1, 0.74, 0.1]} c="#2a2e34" />
      {cards.map((c, i) => (
        <group key={i} position={[c.x, 0.775, c.z]} rotation={[0, c.r, 0]}>
          <Box p={[0, 0, 0]} s={[0.14, 0.006, 0.2]} c="#f3eee2" />
          <Box p={[0, 0.004, -0.03]} s={[0.1, 0.004, 0.08]} c={c.c} />
        </group>
      ))}
    </group>
  )
}

export function Arcade() {
  const open = useStore((s) => s.openPanel)
  return (
    <group>
      <Shell id="arcade" x0={0.08} x1={8.92} y={Y1} floor="#2a2433" wall="#3b3448" battens={3} light={22} />
      <Cabinet p={[6.4, Y1, -5.3]} main onSelect={() => open('arcade')} />
      <Cabinet p={[7.6, Y1, -5.3]} />
      <CardTable p={[2.9, Y1, -2.6]} />
      <ArcadeNeon />
    </group>
  )
}

function ArcadeNeon() {
  const glow = useGlow('arcade', '#ff5fa2', 2.2, 'equip', 0)
  return (
    <mesh position={[4.5, Y1 + 3.15, -5.9]} material={glow}>
      <boxGeometry args={[8.6, 0.03, 0.03]} />
    </mesh>
  )
}

