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

/** Close, low framings: entering a room is a shot, not a zoom */
const FRAME: Record<RoomId, number> = {
  plant: 7.8,
  lab: 14.5,
  control: 14.5,
  studio: 15.5,
  arcade: 15.5,
  solar: 24,
  parking: 27,
  boatyard: 26,
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
const overviewY = (aspect: number) => (aspect < 0.8 ? 0.6 : OVERVIEW_Y)

/** Rooms that read best from a set angle: the boatyard looks past the boat to the harbour and the lighthouse */
const VIEW: Record<RoomId, { az: number; el: number }> = {
  plant: { az: -0.22, el: 0.13 },
  lab: { az: 0.18, el: 0.24 },
  control: { az: 0.42, el: 0.24 },
  studio: { az: -0.3, el: 0.26 },
  arcade: { az: 0.36, el: 0.26 },
  solar: { az: 0.12, el: 0.36 },
  parking: { az: -0.55, el: 0.36 },
  boatyard: { az: -0.75, el: 0.22 },
}

/** Where some rooms look: the plant room frames its supervision screen */
const FOCUS: Partial<Record<RoomId, [number, number, number]>> = {
  plant: [-4.7, 1.45, -3.4],
}

const roomFocus = (id: RoomId) => {
  const f = FOCUS[id]
  if (f) return new THREE.Vector3(...f)
  const z = ZONES.find((q) => q.id === id)!
  const r = z.rect
  // the boatyard aims a little high so the lighthouse sits clear of the HUD and the toast
  return new THREE.Vector3((r.x0 + r.x1) / 2, LEVEL_Y[z.level] + (id === 'boatyard' ? 2.4 : 1.3), Math.min(r.z1, 1.5) - 2.2 + (id === 'parking' || id === 'boatyard' ? 1.5 : 0))
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
    const zoomTo = (d: number, dur = 1.4, view?: { az: number; el: number }, drift = false) => {
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
          // hold the shot: a slow push-in while the visitor reads
          if (drift && !reduced) {
            rig.forceDist = true
            tween.current = gsap.to(rig, {
              dist: d * 0.92,
              duration: 9,
              ease: 'sine.inOut',
              onComplete: () => {
                rig.forceDist = false
              },
            })
          }
        },
      })
    }
    const c0 = controls.current
    const release = () => {
      tween.current?.kill()
      rig.forceDist = false
      rig.forceDir = false
    }
    c0?.addEventListener('start', release)
    const unsub = useStore.subscribe((s, prev) => {
      // energised: a slow dolly from the establishing shot down to the engineer
      if (s.started && !prev.started) zoomTo(narrow ? 44 : 29, 3.2, { az: 0.08, el: 0.3 })
      if (s.activeRoom && s.activeRoom !== prev.activeRoom) zoomTo(FRAME[s.activeRoom] * (narrow ? 1.7 : 1), 2.1, VIEW[s.activeRoom], true)
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
    return () => {
      unsub()
      c0?.removeEventListener('start', release)
    }
  }, [camera, get, narrow, reduced, rig])

  useFrame(({ size: sz, clock }, rawDt) => {
    const c = controls.current
    if (!c) return
    const dt = Math.min(rawDt, 0.05)
    const s = useStore.getState()
    if (s.handoverOpen) goal.set(0, overviewY(sz.width / sz.height), -1)
    else if (s.activeRoom && s.panelOpen) goal.copy(roomFocus(s.activeRoom))
    // aim above the engineer so the room he stands in, and the floor above, stay in frame
    else if (s.started) goal.set(avatarState.x, avatarState.y + (sz.width < 760 ? 2.6 : 2.1), avatarState.z)
    else goal.set(0, overviewY(sz.width / sz.height), -1)
    const k = reduced ? 1 : 1 - Math.exp(-dt * 3.2)
    offset.copy(camera.position).sub(c.target)
    rig.target.lerp(goal, k)
    c.target.copy(rig.target)
    if (rig.forceDir) offset.setFromSphericalCoords(rig.dist, Math.PI / 2 - rig.el, rig.az)
    else if (rig.forceDist) offset.setLength(rig.dist)
    else if (!s.started && !reduced) {
      // the establishing shot drifts slowly round the drawing while the warning is up
      const t = clock.elapsedTime
      offset.setFromSphericalCoords(offset.length(), Math.PI / 2 - (0.24 + Math.sin(t * 0.05) * 0.05), 0.16 + Math.sin(t * 0.07) * 0.32)
    }
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
