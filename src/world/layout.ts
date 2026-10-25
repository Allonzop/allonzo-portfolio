import type { RoomId } from '../content/rooms'

/** Floor heights of the plant: ground, level 1, roof */
export const LEVEL_Y = [0, 3.6, 7.2] as const
export const STOREY = 3.6

/** Building shell, front wall removed at z = 0 */
export const BUILDING = { x0: -9, x1: 9, z0: -6, z1: 0 }

export type Rect = { x0: number; x1: number; z0: number; z1: number }
export type LevelRect = Rect & { level: number }

const r = (level: number, x0: number, x1: number, z0: number, z1: number): LevelRect => ({ level, x0, x1, z0, z1 })

/** Everything the engineer can stand on */
export const WALKABLE: LevelRect[] = [
  // ground: plaza, car park, quay, the three ground-floor rooms, lift approach
  r(0, -11.5, 13, 0, 6),
  r(0, -27, -11, -7, 6),
  r(0, 12.5, 27, -7, 6),
  r(0, -8.8, -3.1, -5.8, 0.2),
  r(0, -2.9, 2.9, -5.8, 0.2),
  r(0, 3.1, 8.8, -5.8, 0.2),
  r(0, 9.2, 11.4, -2.8, 0.2),
  // level 1: studio, arcade, the door between them, the door to the lift
  r(1, -8.8, -0.1, -5.8, -0.35),
  r(1, 0.1, 8.8, -5.8, -0.35),
  r(1, -0.4, 0.4, -3.8, -2.0),
  r(1, 8.6, 9.5, -2.6, -0.8),
  r(1, 9.4, 11.2, -2.6, -0.8),
  // roof deck and its lift landing
  r(2, -8.6, 8.8, -5.6, -0.45),
  r(2, 8.6, 9.5, -2.6, -0.8),
  r(2, 9.4, 11.2, -2.6, -0.8),
]

/** Furniture and equipment the engineer walks around */
export const OBSTACLES: LevelRect[] = [
  // plant room: air handling unit, BMS cabinet, pumps
  r(0, -8.8, -5.2, -5.8, -4.2),
  r(0, -4.4, -3.2, -5.8, -5.0),
  r(0, -8.6, -7.6, -2.6, -1.6),
  // lab: workbench and heating rig
  r(0, -2.4, 1.6, -5.8, -4.6),
  r(0, 1.9, 2.8, -3.4, -1.8),
  // control room: desk with screens
  r(0, 4.0, 8.0, -5.8, -4.4),
  // studio: drafting table and massing models
  r(1, -7.6, -4.6, -3.6, -2.2),
  r(1, -3.6, -1.4, -5.8, -4.8),
  // arcade: cabinets and card table
  r(1, 5.6, 8.6, -5.8, -4.8),
  r(1, 2.0, 3.8, -3.2, -2.0),
  // roof: PV rows
  r(2, -8.0, 7.6, -5.2, -4.4),
  r(2, -8.0, 7.6, -3.6, -2.8),
  r(2, -8.0, 7.6, -2.0, -1.4),
  // car park: sensor posts sit between bays; parked rows are crossable lanes
  r(0, -26, -12, -6.8, -6.2),
  // boatyard: the boat on its stands, workbench, plank rack
  r(0, 15.2, 23.8, -1.6, 1.6),
  r(0, 14.0, 17.0, -5.6, -4.6),
  r(0, 20.0, 25.0, -6.4, -5.4),
  r(0, 22.0, 27.0, 2.5, 4.3),
  // lighthouse breakwater is out of reach; bollards along the quay
]

export const LIFT = {
  x0: 9.4,
  x1: 11.2,
  z0: -2.6,
  z1: -0.8,
  center: { x: 10.3, z: -1.7 },
}

export type Zone = { id: RoomId; level: number; rect: Rect }

/** Stepping inside a zone commissions the room */
export const ZONES: Zone[] = [
  { id: 'plant', level: 0, rect: { x0: -8.8, x1: -3.1, z0: -5.8, z1: -0.7 } },
  { id: 'lab', level: 0, rect: { x0: -2.9, x1: 2.9, z0: -5.8, z1: -0.7 } },
  { id: 'control', level: 0, rect: { x0: 3.1, x1: 8.8, z0: -5.8, z1: -0.7 } },
  { id: 'studio', level: 1, rect: { x0: -8.8, x1: -0.2, z0: -5.8, z1: -0.3 } },
  { id: 'arcade', level: 1, rect: { x0: 0.2, x1: 8.8, z0: -5.8, z1: -0.3 } },
  { id: 'solar', level: 2, rect: { x0: -8.8, x1: 8.8, z0: -5.8, z1: -0.3 } },
  { id: 'parking', level: 0, rect: { x0: -27, x1: -12.2, z0: -7, z1: 6 } },
  { id: 'boatyard', level: 0, rect: { x0: 13.6, x1: 27, z0: -7, z1: 6 } },
]

/** Where a "go to this room" request walks the engineer */
export const ROOM_SPOT: Record<RoomId, { level: number; x: number; z: number }> = {
  plant: { level: 0, x: -6.0, z: -2.6 },
  lab: { level: 0, x: 0, z: -2.8 },
  control: { level: 0, x: 6.0, z: -3.0 },
  studio: { level: 1, x: -4.6, z: -1.4 },
  arcade: { level: 1, x: 4.6, z: -1.4 },
  solar: { level: 2, x: 0, z: -0.9 },
  parking: { level: 0, x: -18.5, z: 2.6 },
  boatyard: { level: 0, x: 19.5, z: 3.4 },
}

export const START = { level: 0, x: 0.5, z: 3.6 }

export const inRect = (p: { x: number; z: number }, q: Rect, pad = 0) =>
  p.x >= q.x0 - pad && p.x <= q.x1 + pad && p.z >= q.z0 - pad && p.z <= q.z1 + pad

export const zoneAt = (level: number, p: { x: number; z: number }): RoomId | null => {
  for (const z of ZONES) if (z.level === level && inRect(p, z.rect)) return z.id
  return null
}

/** Mini-map footprint of every room, in plan coordinates */
export const MAP_FOOTPRINT: Record<RoomId, { level: number; rect: Rect }> = Object.fromEntries(
  ZONES.map((z) => [z.id, { level: z.level, rect: z.rect }]),
) as Record<RoomId, { level: number; rect: Rect }>
