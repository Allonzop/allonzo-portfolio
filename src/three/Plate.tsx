import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { V3 } from './common'

export const PLATE_FONT = '"Archivo Variable", "Archivo", "Arial Narrow", sans-serif'

let fontsReady: Promise<unknown> | null = null
const whenFonts = () => {
  if (!fontsReady) {
    fontsReady = Promise.all([
      document.fonts.load(`condensed 800 64px ${PLATE_FONT}`),
      document.fonts.load(`condensed 600 64px ${PLATE_FONT}`),
    ]).catch(() => undefined)
  }
  return fontsReady
}

type PlateProps = {
  p: V3
  r?: V3
  /** Width in metres; height follows the canvas ratio */
  width: number
  lines: string[]
  /** hollow square = offline, filled = commissioned */
  mark?: 'hollow' | 'filled' | null
  tone?: 'black' | 'green' | 'ivory'
}

const TONES = {
  black: { face: '#141414', edge: '#2c2c2c', ink: '#f1ede2', screw: '#5d5d5d' },
  green: { face: '#1f6b43', edge: '#2f8a59', ink: '#f4f1e6', screw: '#9fb9a8' },
  ivory: { face: '#ece6d6', edge: '#d6cfbd', ink: '#141414', screw: '#9a9384' },
}

/**
 * An engraved phenolic nameplate: caps cut through the face to the core,
 * four screw heads, and a state mark on the right.
 */
export function Plate({ p, r, width, lines, mark = null, tone = 'black' }: PlateProps) {
  const W = 1024
  const H = lines.length > 1 ? 300 : 200
  const { tex, canvas } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return { tex, canvas }
  }, [H])

  useEffect(() => {
    let alive = true
    const draw = () => {
      if (!alive) return
      const ctx = canvas.getContext('2d')!
      const t = TONES[tone]
      ctx.clearRect(0, 0, W, H)
      const rad = 18
      ctx.fillStyle = t.edge
      roundRect(ctx, 0, 0, W, H, rad)
      ctx.fill()
      ctx.fillStyle = t.face
      roundRect(ctx, 6, 6, W - 12, H - 12, rad - 4)
      ctx.fill()
      // screws
      const sr = 13
      for (const [x, y] of [
        [34, 34],
        [W - 34, 34],
        [34, H - 34],
        [W - 34, H - 34],
      ]) {
        ctx.fillStyle = t.screw
        ctx.beginPath()
        ctx.arc(x, y, sr, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = t.face
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(x - sr + 3, y)
        ctx.lineTo(x + sr - 3, y)
        ctx.stroke()
      }
      // engraved text, one size, rank by weight
      ctx.fillStyle = t.ink
      ctx.textBaseline = 'middle'
      const markSpace = mark ? 130 : 0
      const size = lines.length > 1 ? 96 : 104
      lines.forEach((line, i) => {
        ctx.font = `condensed ${i === 0 ? 800 : 600} ${size}px ${PLATE_FONT}`
        const y = lines.length > 1 ? H / 2 + (i - 0.5) * 112 : H / 2 + 4
        const m = ctx.measureText(line).width
        const max = W - 120 - markSpace
        const scale = m > max ? max / m : 1
        ctx.save()
        ctx.translate(70, y)
        ctx.scale(scale, 1)
        ctx.fillText(line, 0, 0)
        ctx.restore()
      })
      if (mark) {
        const s = 64
        const x = W - 70 - s
        const y = H / 2 - s / 2
        ctx.strokeStyle = t.ink
        ctx.lineWidth = 9
        ctx.strokeRect(x, y, s, s)
        if (mark === 'filled') {
          ctx.fillStyle = t.ink
          ctx.fillRect(x + 12, y + 12, s - 24, s - 24)
        }
      }
      tex.needsUpdate = true
    }
    draw()
    whenFonts().then(draw)
    return () => {
      alive = false
    }
  }, [canvas, tex, lines.join('|'), mark, tone, H])

  useEffect(() => () => tex.dispose(), [tex])

  const h = (width * H) / W
  return (
    <group position={p} rotation={r}>
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[width, h, 0.02]} />
        <meshLambertMaterial color={TONES[tone].edge} />
      </mesh>
      <mesh>
        <planeGeometry args={[width, h]} />
        <meshBasicMaterial map={tex} color="#c9c9c9" transparent toneMapped={false} />
      </mesh>
    </group>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
