import { useFrame, type ThreeElements } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import type { RoomId } from '../content/rooms'
import { power, type PowerId } from './power'

export type V3 = [number, number, number]

export const SODIUM = new THREE.Color('#ffb15c')
export const WARM = new THREE.Color('#ffd49a')

/** Lambert box, the workhorse of the low-poly plant */
export function Box({
  p,
  s,
  c,
  r,
  children,
  ...rest
}: { p: V3; s: V3; c?: string; r?: V3; children?: ReactNode } & Omit<ThreeElements['mesh'], 'position' | 'scale' | 'rotation'>) {
  return (
    <mesh position={p} rotation={r} {...rest}>
      <boxGeometry args={s} />
      {children ?? <meshLambertMaterial color={c} />}
    </mesh>
  )
}

/** Baked-looking pool of warm light on the ground, following a room's power */
export function LightPool({ id, p, size, strength = 0.4 }: { id: RoomId | 'building'; p: V3; size: [number, number]; strength?: number }) {
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: poolTexture(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        opacity: 0,
      }),
    [],
  )
  useFrame(() => {
    mat.opacity = power[id].light * strength
  })
  return (
    <mesh position={p} rotation={[-Math.PI / 2, 0, 0]} material={mat} renderOrder={2}>
      <planeGeometry args={size} />
    </mesh>
  )
}

let pool: THREE.Texture | null = null
export function poolTexture() {
  if (pool) return pool
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,175,90,1)')
  g.addColorStop(0.45, 'rgba(255,150,60,0.45)')
  g.addColorStop(1, 'rgba(255,140,50,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  pool = new THREE.CanvasTexture(c)
  pool.colorSpace = THREE.SRGBColorSpace
  return pool
}

/** Room light: off at start, flickers on when the room is commissioned */
export function RoomLight({
  id,
  p,
  intensity = 28,
  distance = 11,
  color = '#ffc68a',
}: {
  id: RoomId | 'building'
  p: V3
  intensity?: number
  distance?: number
  color?: string
}) {
  const ref = useRef<THREE.PointLight>(null)
  useFrame(() => {
    if (ref.current) ref.current.intensity = power[id].light * intensity
  })
  return <pointLight ref={ref} position={p} color={color} intensity={0} distance={distance} decay={1.6} />
}

const glowCache = new Map<string, THREE.MeshBasicMaterial>()

/** An emissive material whose glow follows a room's light or equipment level; shared per setting so it batches */
export function useGlow(id: PowerId, color: THREE.ColorRepresentation, gain = 2.2, channel: 'light' | 'equip' = 'light', floor = 0.04) {
  const key = `${id}|${String(color)}|${gain}|${channel}|${floor}`
  const mat = useMemo(() => {
    let m = glowCache.get(key)
    if (!m) glowCache.set(key, (m = new THREE.MeshBasicMaterial({ color, toneMapped: false })))
    return m
  }, [key, color])
  const base = useMemo(() => new THREE.Color(color), [color])
  useFrame(() => {
    const v = floor + power[id][channel] * gain
    mat.color.copy(base).multiplyScalar(v)
  })
  return mat
}

/** Ceiling fixture: a long luminaire that glows with the room */
export function Fixture({ id, p, s = [1.6, 0.06, 0.24] as V3 }: { id: RoomId | 'building'; p: V3; s?: V3 }) {
  const glow = useGlow(id, WARM, 2.4)
  return (
    <group position={p}>
      <Box p={[0, 0.05, 0]} s={[s[0] + 0.08, 0.05, s[2] + 0.08]} c="#3b3f46" />
      <mesh material={glow}>
        <boxGeometry args={s} />
      </mesh>
    </group>
  )
}

/** Canvas texture redrawn by a painter, optionally on a frame budget */
export function useCanvasTexture(
  w: number,
  h: number,
  paint: (ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => void,
  fps = 0,
) {
  const { canvas, tex } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return { canvas, tex }
  }, [w, h])
  const paintRef = useRef(paint)
  paintRef.current = paint
  const last = useRef(-1)
  useEffect(() => {
    const ctx = canvas.getContext('2d')!
    paintRef.current(ctx, 0, w, h)
    tex.needsUpdate = true
    return () => tex.dispose()
  }, [canvas, tex, w, h])
  useFrame(({ clock }) => {
    if (!fps) return
    const t = clock.elapsedTime
    if (t - last.current < 1 / fps) return
    last.current = t
    paintRef.current(canvas.getContext('2d')!, t, w, h)
    tex.needsUpdate = true
  })
  return { tex, canvas, repaint: () => { paintRef.current(canvas.getContext('2d')!, last.current, w, h); tex.needsUpdate = true } }
}

/** A screen that is black when the room is offline and runs its painter once commissioned */
export function Screen({
  id,
  p,
  r,
  size,
  px = [512, 320],
  fps = 8,
  paint,
}: {
  id: RoomId
  p: V3
  r?: V3
  size: [number, number]
  px?: [number, number]
  fps?: number
  paint: (ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => void
}) {
  const { tex } = useCanvasTexture(px[0], px[1], (ctx, t, w, h) => {
    if (power[id].equip < 0.05) {
      ctx.fillStyle = '#05070a'
      ctx.fillRect(0, 0, w, h)
      return
    }
    paint(ctx, t, w, h)
  }, fps)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(() => {
    if (mat.current) mat.current.color.setScalar(0.25 + power[id].equip * 1.15)
  })
  return (
    <group position={p} rotation={r}>
      <Box p={[0, 0, -0.03]} s={[size[0] + 0.08, size[1] + 0.08, 0.05]} c="#16181c" />
      <mesh>
        <planeGeometry args={size} />
        <meshBasicMaterial ref={mat} map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** A printed sheet pinned to a wall: drawn once, lit by the room */
export function Poster({
  p,
  r,
  size,
  px = [512, 360],
  paint,
}: {
  p: V3
  r?: V3
  size: [number, number]
  px?: [number, number]
  paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
}) {
  const { tex } = useCanvasTexture(px[0], px[1], (ctx, _t, w, h) => paint(ctx, w, h))
  return (
    <mesh position={p} rotation={r}>
      <planeGeometry args={size} />
      <meshLambertMaterial map={tex} />
    </mesh>
  )
}

/** Fan blades that spin up with the room's equipment level */
export function Fan({ id, p, r, radius = 0.4, speed = 9 }: { id: RoomId; p: V3; r?: V3; radius?: number; speed?: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * speed * power[id].equip
  })
  return (
    <group position={p} rotation={r} userData={{ dynamic: true }}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius + 0.06, radius + 0.06, 0.08, 20, 1, true]} />
        <meshLambertMaterial color="#2a2e34" side={THREE.DoubleSide} />
      </mesh>
      <group ref={ref}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} rotation={[0, 0, (i / 5) * Math.PI * 2]} position={[0, 0, 0]}>
            <boxGeometry args={[radius * 0.36, radius * 1.85, 0.02]} />
            <meshLambertMaterial color="#9aa3ad" />
          </mesh>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[radius * 0.18, radius * 0.18, 0.1, 10]} />
          <meshLambertMaterial color="#cfd5db" />
        </mesh>
      </group>
    </group>
  )
}

/** Small status LED: dark, then green or amber once powered */
export function Led({ id, p, color = '#3dff8a', blink = 0 }: { id: RoomId; p: V3; color?: string; blink?: number }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color, toneMapped: false }), [color])
  const base = useMemo(() => new THREE.Color(color), [color])
  const phase = useMemo(() => Math.random() * 6, [])
  useFrame(({ clock }) => {
    const on = power[id].equip
    const b = blink ? (Math.sin(clock.elapsedTime * blink + phase) > 0 ? 1 : 0.25) : 1
    mat.color.copy(base).multiplyScalar(0.05 + on * 3 * b)
  })
  return (
    <mesh position={p} material={mat}>
      <boxGeometry args={[0.05, 0.05, 0.02]} />
    </mesh>
  )
}
