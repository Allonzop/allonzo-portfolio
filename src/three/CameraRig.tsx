import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitImpl } from 'three-stdlib'
import type { RoomId } from '../content/rooms'
import { useStore } from '../store'
import { LEVEL_Y, ZONES } from '../world/layout'
import { avatarState } from './Avatar'

const FRAME: Record<RoomId, number> = {
  plant: 21,
  lab: 21,
  control: 21,
  studio: 23,
  arcade: 23,
  solar: 28,
  parking: 32,
  boatyard: 29,
}

/** Low target so the plant sits in the upper part of the frame, above the intro tag */
const OVERVIEW_Y = 1.2

/** Far enough to hold the car park, the plant and the boatyard across the width */
const overviewDistance = (aspect: number) => {
  const halfH = Math.tan(THREE.MathUtils.degToRad(17))
  const halfW = halfH * aspect
  // portrait phones frame the building itself; wider screens take in the car park and the boatyard
  if (aspect < 0.8) return Math.min(110, 11 / halfW)
  return Math.min(140, Math.max(58, 31 / halfW))
}

/** On a phone the intro tag covers the lower half: aim low so the plant sits in the top half */
const overviewY = (aspect: number) => (aspect < 0.8 ? -4.2 : OVERVIEW_Y)

/** Rooms that read best from a set angle: the boatyard looks past the boat to the harbour and the lighthouse */
const VIEW: Partial<Record<RoomId, { az: number; el: number }>> = {
  boatyard: { az: -0.62, el: 0.2 },
}

const roomFocus = (id: RoomId) => {
  const z = ZONES.find((q) => q.id === id)!
  const r = z.rect
  return new THREE.Vector3((r.x0 + r.x1) / 2, LEVEL_Y[z.level] + 1.3, Math.min(r.z1, 1.5) - 2.2 + (id === 'parking' || id === 'boatyard' ? 1.5 : 0))
}

export function CameraRig() {
  const controls = useRef<OrbitImpl>(null)
  const { camera, size } = useThree()
  const get = useThree((st) => st.get)
  const tween = useRef<gsap.core.Tween | null>(null)
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const narrow = size.width < 760
  const rig = useMemo(
    () => ({
      target: new THREE.Vector3(0, overviewY(size.width / size.height), -1),
      dist: 0,
      forceDist: false,
      az: 0,
      el: 0,
      forceDir: false,
      shiftX: 0,
      shiftY: 0,
    }),
    [],
  )
  if (import.meta.env.DEV || location.search.includes('debug')) (window as unknown as Record<string, unknown>).__rig = { rig, camera, controls }
  const offset = useMemo(() => new THREE.Vector3(), [])
  const goal = useMemo(() => new THREE.Vector3(), [])
  const applied = useRef({ x: -1, y: -1, w: 0, h: 0 })

  // initial framing: the whole plant at night
  useEffect(() => {
    const d = overviewDistance(size.width / size.height)
    const az = 0.16
    const el = 0.25
    camera.position.set(rig.target.x + Math.sin(az) * Math.cos(el) * d, rig.target.y + Math.sin(el) * d, rig.target.z + Math.cos(az) * Math.cos(el) * d)
    camera.lookAt(rig.target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // zoom to rooms, follow the engineer, make room for the panel
  useEffect(() => {
    const aspect = () => get().size.width / get().size.height
    const zoomTo = (d: number, dur = 1.4, view?: { az: number; el: number }) => {
      tween.current?.kill()
      const c = controls.current
      if (!c) return
      const sph = new THREE.Spherical().setFromVector3(camera.position.clone().sub(c.target))
      rig.dist = sph.radius
      rig.az = sph.theta
      rig.el = Math.PI / 2 - sph.phi
      rig.forceDist = true
      rig.forceDir = !!view
      tween.current = gsap.to(rig, {
        dist: d,
        ...(view ? { az: view.az, el: view.el } : {}),
        duration: reduced ? 0.01 : dur,
        ease: 'power3.inOut',
        onComplete: () => {
          rig.forceDist = false
          rig.forceDir = false
        },
      })
    }
    const unsub = useStore.subscribe((s, prev) => {
      if (s.started && !prev.started) zoomTo(narrow ? 24 : 26, 1.8)
      if (s.activeRoom && s.activeRoom !== prev.activeRoom) zoomTo(FRAME[s.activeRoom] * (narrow ? 1.25 : 1), 1.4, VIEW[s.activeRoom])
      if (s.panelOpen !== prev.panelOpen) {
        gsap.to(rig, {
          shiftX: s.panelOpen && !narrow ? 1 : 0,
          shiftY: s.panelOpen && narrow ? 1 : 0,
          duration: reduced ? 0.01 : 0.9,
          ease: 'power3.out',
        })
      }
      if (s.handoverOpen && !prev.handoverOpen) zoomTo(overviewDistance(aspect()), 2.4)
    })
    return unsub
  }, [camera, get, narrow, reduced, rig])

  useFrame(({ size: sz }, rawDt) => {
    const c = controls.current
    if (!c) return
    const dt = Math.min(rawDt, 0.05)
    const s = useStore.getState()
    if (s.handoverOpen) goal.set(0, overviewY(sz.width / sz.height), -1)
    else if (s.activeRoom && s.panelOpen) goal.copy(roomFocus(s.activeRoom))
    else if (s.started) goal.set(avatarState.x, avatarState.y + 1.3, avatarState.z)
    else goal.set(0, overviewY(sz.width / sz.height), -1)
    const k = reduced ? 1 : 1 - Math.exp(-dt * 3.2)
    offset.copy(camera.position).sub(c.target)
    rig.target.lerp(goal, k)
    c.target.copy(rig.target)
    if (rig.forceDir) offset.setFromSphericalCoords(rig.dist, Math.PI / 2 - rig.el, rig.az)
    else if (rig.forceDist) offset.setLength(rig.dist)
    camera.position.copy(rig.target).add(offset)
    c.update()

    // shift the frustum so the room stays clear of the panel
    const cam = camera as THREE.PerspectiveCamera
    const panelW = Math.min(480, sz.width * 0.42)
    const x = rig.shiftX * panelW * 0.5
    const y = rig.shiftY * sz.height * 0.2
    const a = applied.current
    if (Math.abs(a.x - x) > 0.5 || Math.abs(a.y - y) > 0.5 || a.w !== sz.width || a.h !== sz.height) {
      if (x < 0.5 && y < 0.5) cam.clearViewOffset()
      else cam.setViewOffset(sz.width, sz.height, x, y, sz.width, sz.height)
      applied.current = { x, y, w: sz.width, h: sz.height }
    }
  })

  return (
    <OrbitControls
      ref={controls as never}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={7}
      maxDistance={140}
      minPolarAngle={0.62}
      maxPolarAngle={1.36}
      minAzimuthAngle={-0.75}
      maxAzimuthAngle={0.95}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
      target={[0, OVERVIEW_Y, -1]}
    />
  )
}
