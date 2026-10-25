import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useStore } from '../store'
import { avatarState } from '../world/avatarState'
import { LEVEL_Y, LIFT, ROOM_SPOT, zoneAt } from '../world/layout'
import { canStand, findPath, onLiftPad, type Waypoint } from '../world/nav'
import { liftState } from './Building'

export { avatarState }

/** Shared click-to-move entry point, used by the scene's floor handler */
export const moveRequest: { current: ((target: Waypoint) => void) | null } = { current: null }

const SPEED = 4.4

function Engineer() {
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const phase = useRef(0)
  useFrame((_, dt) => {
    const s = Math.min(1, avatarState.speed / SPEED)
    phase.current += dt * 11 * s
    const a = Math.sin(phase.current) * 0.7 * s
    if (legL.current) legL.current.rotation.x = a
    if (legR.current) legR.current.rotation.x = -a
    if (armL.current) armL.current.rotation.x = -a * 0.8
    if (armR.current) armR.current.rotation.x = a * 0.8
    if (body.current) body.current.position.y = Math.abs(Math.cos(phase.current)) * 0.04 * s
  })
  const vest = '#ff7a1a'
  const navy = '#1d2a44'
  return (
    <group ref={body} scale={1.12}>
      {[
        [legL, -0.11],
        [legR, 0.11],
      ].map(([ref, x], i) => (
        <group key={i} ref={ref as React.RefObject<THREE.Group>} position={[x as number, 0.58, 0]}>
          <mesh position={[0, -0.27, 0]}>
            <boxGeometry args={[0.15, 0.54, 0.17]} />
            <meshLambertMaterial color={navy} />
          </mesh>
          <mesh position={[0, -0.55, 0.04]}>
            <boxGeometry args={[0.16, 0.07, 0.25]} />
            <meshLambertMaterial color="#111317" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.86, 0]}>
        <boxGeometry args={[0.44, 0.56, 0.26]} />
        <meshLambertMaterial color={vest} />
      </mesh>
      {/* reflective bands */}
      {[0.74, 0.96].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[0.452, 0.045, 0.27]} />
          <meshBasicMaterial color="#cfd6d8" />
        </mesh>
      ))}
      {[
        [armL, -0.29],
        [armR, 0.29],
      ].map(([ref, x], i) => (
        <group key={i} ref={ref as React.RefObject<THREE.Group>} position={[x as number, 1.1, 0]}>
          <mesh position={[0, -0.24, 0]}>
            <boxGeometry args={[0.12, 0.5, 0.14]} />
            <meshLambertMaterial color={navy} />
          </mesh>
          <mesh position={[0, -0.52, 0]}>
            <boxGeometry args={[0.1, 0.09, 0.1]} />
            <meshLambertMaterial color="#c99572" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.31, 0]}>
        <sphereGeometry args={[0.15, 14, 10]} />
        <meshLambertMaterial color="#c99572" />
      </mesh>
      {/* hard hat */}
      <mesh position={[0, 1.38, 0]}>
        <sphereGeometry args={[0.175, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color="#f4f1e8" />
      </mesh>
      <mesh position={[0, 1.385, 0.03]}>
        <cylinderGeometry args={[0.215, 0.215, 0.025, 18]} />
        <meshLambertMaterial color="#f4f1e8" />
      </mesh>
      <mesh position={[0, 1.47, 0]}>
        <boxGeometry args={[0.04, 0.12, 0.3]} />
        <meshLambertMaterial color="#e3dfd4" />
      </mesh>
    </group>
  )
}

function Marker({ target }: { target: React.RefObject<THREE.Group | null> }) {
  const ring = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ring.current) return
    const s = 1 + Math.sin(clock.elapsedTime * 5) * 0.12
    ring.current.scale.set(s, s, s)
  })
  return (
    <group ref={target} visible={false}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.32, 0.42, 4, 1]} />
        <meshBasicMaterial color="#ffb04a" toneMapped={false} transparent opacity={0.9} />
      </mesh>
    </group>
  )
}

export function Avatar() {
  const group = useRef<THREE.Group>(null)
  const marker = useRef<THREE.Group>(null)
  const keys = useRef(new Set<string>())
  const path = useRef<Waypoint[]>([])
  const camera = useThree((s) => s.camera)
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const fwd = useMemo(() => new THREE.Vector3(), [])
  const right = useMemo(() => new THREE.Vector3(), [])
  const lastZone = useRef<string | null>(null)

  const ride = (toLevel: number, then?: () => void) => {
    if (avatarState.riding || toLevel === avatarState.level) {
      then?.()
      return
    }
    avatarState.riding = true
    avatarState.speed = 0
    const fromY = LEVEL_Y[avatarState.level]
    const toY = LEVEL_Y[toLevel]
    const tl = gsap.timeline({
      onComplete: () => {
        avatarState.level = toLevel
        avatarState.riding = false
        then?.()
      },
    })
    // bring the cab to the engineer first if it is parked elsewhere
    if (Math.abs(liftState.y - fromY) > 0.05) tl.to(liftState, { y: fromY, duration: reduced ? 0.2 : 0.8, ease: 'power2.inOut' })
    // step to the middle of the cab
    tl.to(avatarState, { x: LIFT.center.x, z: LIFT.center.z, duration: 0.35, ease: 'power1.inOut' })
    const d = (reduced ? 0.4 : 1.1) + Math.abs(toLevel - avatarState.level) * (reduced ? 0.1 : 0.5)
    tl.to([liftState, avatarState], { y: toY, duration: d, ease: 'power2.inOut' })
  }

  const walkTo = (target: Waypoint) => {
    if (avatarState.riding) return
    const p = findPath({ level: avatarState.level, x: avatarState.x, z: avatarState.z }, target)
    if (!p || !p.length) return
    path.current = p
    useStore.getState().start()
    const end = p[p.length - 1]
    if (marker.current) {
      marker.current.visible = true
      marker.current.position.set(end.x, LEVEL_Y[end.level], end.z)
    }
  }

  useEffect(() => {
    moveRequest.current = walkTo
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'z', 'q', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        keys.current.add(k)
        if (k.startsWith('arrow')) e.preventDefault()
        path.current = []
        if (marker.current) marker.current.visible = false
        useStore.getState().start()
      }
    }
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase())
    const blur = () => keys.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    const unsub = useStore.subscribe((s, prev) => {
      if (s.travel && s.travel !== prev.travel) {
        const spot = ROOM_SPOT[s.travel.room]
        walkTo(spot)
      }
      if (s.liftRequest && s.liftRequest !== prev.liftRequest && onLiftPad(avatarState.x, avatarState.z)) {
        path.current = []
        ride(s.liftRequest.level)
      }
    })
    return () => {
      moveRequest.current = null
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
      unsub()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const st = avatarState
    let vx = 0
    let vz = 0
    if (!st.riding) {
      const k = keys.current
      const f = (k.has('w') || k.has('z') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0)
      const r = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('q') || k.has('arrowleft') ? 1 : 0)
      if (f || r) {
        camera.getWorldDirection(fwd)
        fwd.y = 0
        fwd.normalize()
        right.set(-fwd.z, 0, fwd.x)
        vx = (fwd.x * f + right.x * r) * SPEED
        vz = (fwd.z * f + right.z * r) * SPEED
        const n = Math.hypot(vx, vz)
        if (n > SPEED) {
          vx = (vx / n) * SPEED
          vz = (vz / n) * SPEED
        }
      } else if (path.current.length) {
        const wp = path.current[0]
        if (wp.lift || wp.level !== st.level) {
          path.current.shift()
          ride(wp.level)
        } else {
          const dx = wp.x - st.x
          const dz = wp.z - st.z
          const d = Math.hypot(dx, dz)
          if (d < 0.12) {
            path.current.shift()
            if (!path.current.length && marker.current) marker.current.visible = false
          } else {
            const sp = Math.min(SPEED, d / dt)
            vx = (dx / d) * sp
            vz = (dz / d) * sp
          }
        }
      }
      // integrate with sliding along walls
      if (vx || vz) {
        const nx = st.x + vx * dt
        const nz = st.z + vz * dt
        const following = !!path.current.length
        if (following || canStand(st.level, nx, nz)) {
          st.x = nx
          st.z = nz
        } else if (canStand(st.level, nx, st.z)) st.x = nx
        else if (canStand(st.level, st.x, nz)) st.z = nz
        else {
          vx = 0
          vz = 0
        }
      }
      st.speed = Math.hypot(vx, vz)
      if (st.speed > 0.1) {
        const h = Math.atan2(vx, vz)
        let dh = h - st.heading
        while (dh > Math.PI) dh -= Math.PI * 2
        while (dh < -Math.PI) dh += Math.PI * 2
        st.heading += dh * Math.min(1, dt * 12)
      }
      st.y = LEVEL_Y[st.level]
    } else {
      st.speed = 0
    }
    if (group.current) {
      group.current.position.set(st.x, st.y, st.z)
      group.current.rotation.y = st.heading
    }
    // rooms and the lift
    const zone = st.riding ? null : zoneAt(st.level, st)
    if (zone !== lastZone.current) {
      lastZone.current = zone
      useStore.getState().enterRoom(zone)
    }
    useStore.getState().setLevel(st.level, !st.riding && onLiftPad(st.x, st.z) && !path.current.length)
  })

  return (
    <>
      <group ref={group}>
        <Engineer />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[0.36, 20]} />
          <meshBasicMaterial color="#000" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      </group>
      <Marker target={marker} />
    </>
  )
}
