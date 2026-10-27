import * as THREE from 'three'
import type { RoomId } from '../content/rooms'
import { LEVEL_Y, ZONES } from '../world/layout'

/* Camera framings shared by the walking rig and the phone lift */

/** Close, low framings: entering a room is a shot, not a zoom */
export const FRAME: Record<RoomId, number> = {
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
export const OVERVIEW_Y = 1.2

/** Far enough to hold the car park, the plant and the boatyard across the width */
export const overviewDistance = (aspect: number) => {
  const halfH = Math.tan(THREE.MathUtils.degToRad(17))
  const halfW = halfH * aspect
  // portrait phones frame the building itself; wider screens take in the car park and the boatyard
  if (aspect < 0.8) return Math.min(110, 11 / halfW)
  return Math.min(140, Math.max(58, 31 / halfW))
}

/** On a phone the intro tag covers the lower half: aim low so the plant sits in the top half */
export const overviewY = (aspect: number) => (aspect < 0.8 ? 0.6 : OVERVIEW_Y)

/** Rooms that read best from a set angle: the boatyard looks past the boat to the harbour and the lighthouse */
export const VIEW: Record<RoomId, { az: number; el: number }> = {
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
export const FOCUS: Partial<Record<RoomId, [number, number, number]>> = {
  plant: [-4.7, 1.45, -3.4],
}

export const roomFocus = (id: RoomId) => {
  const f = FOCUS[id]
  if (f) return new THREE.Vector3(...f)
  const z = ZONES.find((q) => q.id === id)!
  const r = z.rect
  // the boatyard aims a little high so the lighthouse sits clear of the HUD and the toast
  return new THREE.Vector3((r.x0 + r.x1) / 2, LEVEL_Y[z.level] + (id === 'boatyard' ? 2.4 : 1.3), Math.min(r.z1, 1.5) - 2.2 + (id === 'parking' || id === 'boatyard' ? 1.5 : 0))
}
