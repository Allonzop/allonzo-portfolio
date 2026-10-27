import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { RoomId } from '../content/rooms'
import { useStore } from '../store'
import { FRAME, overviewDistance, overviewY, roomFocus, VIEW } from './shots'

/** The order the lift travels: roof, level 1, ground, then out to the car park and the harbour */
export const DESCENT: RoomId[] = ['solar', 'studio', 'arcade', 'control', 'lab', 'plant', 'parking', 'boatyard']

/**
 * Where the lift is between two shots, written by the page's scroll and read here each frame.
 * Shot 0 is the establishing shot; shot i is DESCENT[i - 1].
 */
export const liftScroll = { a: 0, b: 0, t: 0 }

type Shot = { target: THREE.Vector3; dist: number; az: number; el: number; lift: number }

const ease = (t: number) => t * t * (3 - 2 * t)

/** The phone camera: no orbit, the thumb drives it by scrolling down through the building */
export function LiftCamera() {
  const { camera, size } = useThree()
  const aspect = size.width / size.height
  const shots = useMemo<Shot[]>(() => {
    // portrait screens see little across: stand back so the whole room fits the width
    const k = aspect < 0.8 ? Math.min(2.1, 0.78 / aspect) : 1
    const overview: Shot = { target: new THREE.Vector3(0, overviewY(aspect), -1), dist: overviewDistance(aspect), az: 0.16, el: 0.25, lift: 0 }
    return [overview, ...DESCENT.map((id) => ({ target: roomFocus(id), dist: FRAME[id] * k, az: VIEW[id].az, el: VIEW[id].el, lift: 1 }))]
  }, [aspect])

  const cur = useRef<Shot | null>(null)
  const goal = useMemo(() => ({ target: new THREE.Vector3(), dist: 0, az: 0, el: 0, lift: 0 }), [])
  const off = useMemo(() => new THREE.Vector3(), [])
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const applied = useRef(-1)

  useFrame(({ clock, size: sz }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const A = shots[liftScroll.a] ?? shots[0]
    const B = shots[liftScroll.b] ?? A
    const e = ease(Math.min(1, Math.max(0, liftScroll.t)))
    goal.target.lerpVectors(A.target, B.target, e)
    goal.dist = A.dist + (B.dist - A.dist) * e
    goal.az = A.az + (B.az - A.az) * e
    goal.el = A.el + (B.el - A.el) * e
    goal.lift = A.lift + (B.lift - A.lift) * e
    // while the lockout tag is up, the establishing shot drifts round the drawing
    if (!useStore.getState().started && !reduced) {
      const t = clock.elapsedTime
      goal.az += Math.sin(t * 0.07) * 0.32
      goal.el += Math.sin(t * 0.05) * 0.05
    }

    // the car follows the shaft with a little inertia
    if (!cur.current) cur.current = { target: goal.target.clone(), dist: goal.dist, az: goal.az, el: goal.el, lift: goal.lift }
    const c = cur.current
    const k = reduced ? 1 : 1 - Math.exp(-dt * 5)
    c.target.lerp(goal.target, k)
    c.dist += (goal.dist - c.dist) * k
    c.az += (goal.az - c.az) * k
    c.el += (goal.el - c.el) * k
    c.lift += (goal.lift - c.lift) * k

    off.setFromSphericalCoords(c.dist, Math.PI / 2 - c.el, c.az)
    camera.position.copy(c.target).add(off)
    camera.lookAt(c.target)

    // rooms sit in the upper part of the screen, clear of the tag rising from below
    const cam = camera as THREE.PerspectiveCamera
    const y = Math.round(c.lift * sz.height * 0.2)
    if (y !== applied.current) {
      if (y < 1) cam.clearViewOffset()
      else cam.setViewOffset(sz.width, sz.height, 0, y, sz.width, sz.height)
      applied.current = y
    }
  })
  return null
}
