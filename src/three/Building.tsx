import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ROOM_BY_ID, type RoomId } from '../content/rooms'
import { useStore } from '../store'
import { LEVEL_Y, LIFT } from '../world/layout'
import { Box, useGlow, type V3 } from './common'
import { Plate } from './Plate'
import { power } from './power'

/** Shared with the avatar: where the lift cab is */
export const liftState = { y: 0 }

const SLAB = '#5b6068'
const CUT = '#23262c'
const SHELL = '#2a313c'
const T = 0.3

function Slab({ y, x0 = -9.2, x1 = 9.2 }: { y: number; x0?: number; x1?: number }) {
  return (
    <group>
      <Box p={[(x0 + x1) / 2, y - T / 2, -3.1]} s={[x1 - x0, T, 6.2]} c={SLAB} />
      {/* section cut, the poché of a drawing */}
      <Box p={[(x0 + x1) / 2, y - T / 2, 0.005]} s={[x1 - x0 + 0.01, T + 0.01, 0.02]} c={CUT} />
    </group>
  )
}

function SideWall({ x, openings = [] }: { x: number; openings?: { y0: number; y1: number; z0: number; z1: number }[] }) {
  // build the wall as vertical strips so openings stay clean
  const parts = useMemo(() => {
    const out: { p: V3; s: V3 }[] = []
    const H = 7.2
    if (!openings.length) {
      out.push({ p: [x, H / 2, -3.1], s: [0.2, H, 6.2] })
      return out
    }
    const o = openings[0]
    out.push({ p: [x, H / 2, (-6.2 + o.z0) / 2], s: [0.2, H, o.z0 + 6.2] })
    out.push({ p: [x, H / 2, o.z1 / 2], s: [0.2, H, -o.z1] })
    out.push({ p: [x, o.y0 / 2, (o.z0 + o.z1) / 2], s: [0.2, o.y0, o.z1 - o.z0] })
    out.push({ p: [x, (o.y1 + H) / 2, (o.z0 + o.z1) / 2], s: [0.2, H - o.y1, o.z1 - o.z0] })
    return out
  }, [x, openings])
  return (
    <group>
      {parts.map((q, i) => (
        <Box key={i} p={q.p} s={q.s} c={SHELL} />
      ))}
    </group>
  )
}

function Windows({ x, side }: { x: number; side: 1 | -1 }) {
  // narrow lit slots on the gable, glowing once the whole building is handed over
  const glow = useGlow('building', '#ffbf73', 1.8, 'light', 0.02)
  const slots: V3[] = []
  for (const y of [1.8, 5.4]) for (const z of [-4.8, -3.6, -2.4]) slots.push([x + side * 0.105, y, z])
  return (
    <group>
      {slots.map((p, i) => (
        <mesh key={i} position={p} rotation={[0, side * Math.PI / 2, 0]} material={glow}>
          <planeGeometry args={[0.7, 1.5]} />
        </mesh>
      ))}
    </group>
  )
}

function Partition({ x, y, h, door }: { x: number; y: number; h: number; door?: { z0: number; z1: number; h: number } }) {
  if (!door) return <Box p={[x, y + h / 2, -3]} s={[0.16, h, 6]} c="#b9b2a5" />
  return (
    <group>
      <Box p={[x, y + h / 2, (-6 + door.z0) / 2]} s={[0.16, h, door.z0 + 6]} c="#b9b2a5" />
      <Box p={[x, y + h / 2, door.z1 / 2]} s={[0.16, h, -door.z1]} c="#b9b2a5" />
      <Box p={[x, y + door.h + (h - door.h) / 2, (door.z0 + door.z1) / 2]} s={[0.16, h - door.h, door.z1 - door.z0]} c="#b9b2a5" />
    </group>
  )
}

function Lift() {
  const cab = useRef<THREE.Group>(null)
  const glass = useMemo(
    () => new THREE.MeshLambertMaterial({ color: '#8fb4d6', transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }),
    [],
  )
  const lamp = useGlow('building', '#9fe0ff', 1.2, 'light', 0.5)
  useFrame(() => {
    if (cab.current) cab.current.position.y = liftState.y
  })
  const { x0, x1, z0, z1 } = LIFT
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const H = 8.4
  const posts: [number, number][] = [
    [x0 - 0.1, z0 - 0.1],
    [x1 + 0.1, z0 - 0.1],
    [x0 - 0.1, z1 + 0.1],
    [x1 + 0.1, z1 + 0.1],
  ]
  return (
    <group>
      {posts.map(([x, z], i) => (
        <Box key={i} p={[x, H / 2, z]} s={[0.12, H, 0.12]} c="#3a414d" />
      ))}
      {/* glass on the back and the outer side; front left open for the view */}
      <mesh position={[cx, H / 2, z0 - 0.1]} material={glass}>
        <planeGeometry args={[x1 - x0 + 0.2, H]} />
      </mesh>
      <mesh position={[x1 + 0.1, H / 2, cz]} rotation={[0, Math.PI / 2, 0]} material={glass}>
        <planeGeometry args={[z1 - z0 + 0.2, H]} />
      </mesh>
      <Box p={[cx, H + 0.1, cz]} s={[x1 - x0 + 0.4, 0.2, z1 - z0 + 0.4]} c="#3a414d" />
      <mesh position={[cx, H - 0.02, cz]} material={lamp}>
        <boxGeometry args={[0.6, 0.04, 0.6]} />
      </mesh>
      {/* landings */}
      {LEVEL_Y.map((y, i) => (
        <Box key={i} p={[cx, y - 0.08, cz]} s={[x1 - x0, 0.16, z1 - z0]} c="#41474f" />
      ))}
      <group ref={cab} userData={{ dynamic: true }}>
        <Box p={[cx, 0.02, cz]} s={[x1 - x0 - 0.1, 0.08, z1 - z0 - 0.1]} c="#7d6a45" />
        {[
          [x0 + 0.08, z0 + 0.08],
          [x1 - 0.08, z0 + 0.08],
          [x0 + 0.08, z1 - 0.08],
          [x1 - 0.08, z1 - 0.08],
        ].map(([x, z], i) => (
          <Box key={i} p={[x, 1.2, z]} s={[0.05, 2.4, 0.05]} c="#7d6a45" />
        ))}
        <Box p={[cx, 2.42, cz]} s={[x1 - x0 - 0.1, 0.06, z1 - z0 - 0.1]} c="#7d6a45" />
      </group>
    </group>
  )
}

/** Room nameplate fixed to the slab fascia, with its state mark */
function RoomPlate({ id, p, width = 2.6 }: { id: RoomId; p: V3; width?: number }) {
  const done = useStore((s) => s.commissioned.includes(id))
  const room = ROOM_BY_ID[id]
  return <Plate p={p} width={width} lines={[`${room.code} · ${done ? 'ON' : 'OFFLINE'}`]} mark={done ? 'filled' : 'hollow'} />
}

function SlabEdgeLight() {
  // a thin amber line along each cut edge: lit at handover
  const glow = useGlow('building', '#ffae4a', 2.6, 'light', 0)
  return (
    <group>
      {[LEVEL_Y[1] - T, LEVEL_Y[2] - T, LEVEL_Y[2] + 1.0].map((y, i) => (
        <mesh key={i} position={[0, y, 0.02]} material={glow}>
          <boxGeometry args={[18.4, 0.03, 0.02]} />
        </mesh>
      ))}
    </group>
  )
}

export function Building() {
  useFrame(() => {
    // keep the gable windows in step with the number of rooms lit
    void power
  })
  return (
    <group>
      {/* foundations and the three slabs */}
      <Box p={[0, -0.25, -3.1]} s={[18.6, 0.5, 6.4]} c="#3c4149" />
      <Slab y={LEVEL_Y[1]} />
      <Slab y={LEVEL_Y[2]} />
      {/* back wall */}
      <Box p={[0, 3.6, -6.1]} s={[18.4, 7.2, 0.2]} c={SHELL} />
      {/* gables: right one opens on level 1 and the roof towards the lift */}
      <SideWall x={-9.1} />
      <SideWall x={9.1} openings={[{ y0: 3.6, y1: 5.9, z0: -2.6, z1: -0.8 }]} />
      <Windows x={-9.1} side={-1} />
      {/* ground floor partitions; level 1 partition with a door */}
      <Partition x={-3} y={0} h={LEVEL_Y[1] - T} />
      <Partition x={3} y={0} h={LEVEL_Y[1] - T} />
      <Partition x={0} y={LEVEL_Y[1]} h={STOREY_CLEAR} door={{ z0: -3.8, z1: -2.0, h: 2.3 }} />
      {/* roof parapet, open towards the lift */}
      <Box p={[0, 7.2 + 0.45, -6.1]} s={[18.4, 0.9, 0.2]} c={SHELL} />
      <Box p={[-9.1, 7.2 + 0.45, -3.1]} s={[0.2, 0.9, 6.2]} c={SHELL} />
      <Box p={[9.1, 7.2 + 0.45, -4.4]} s={[0.2, 0.9, 3.6]} c={SHELL} />
      <Box p={[9.1, 7.2 + 0.45, -0.35]} s={[0.2, 0.9, 0.7]} c={SHELL} />
      <Box p={[0, 7.2 + 0.3, -0.05]} s={[18.4, 0.6, 0.12]} c={SHELL} />
      {/* rooftop plant: a small stack and a beacon */}
      <Lift />
      <SlabEdgeLight />
      <RoomPlate id="plant" p={[-6, LEVEL_Y[1] - 0.17, 0.04]} />
      <RoomPlate id="lab" p={[0, LEVEL_Y[1] - 0.17, 0.04]} width={2.2} />
      <RoomPlate id="control" p={[6, LEVEL_Y[1] - 0.17, 0.04]} />
      <RoomPlate id="studio" p={[-4.5, LEVEL_Y[2] - 0.17, 0.04]} />
      <RoomPlate id="arcade" p={[4.5, LEVEL_Y[2] - 0.17, 0.04]} />
      <RoomPlate id="solar" p={[-6.4, LEVEL_Y[2] + 0.32, 0.04]} width={2.2} />
    </group>
  )
}

const STOREY_CLEAR = LEVEL_Y[2] - LEVEL_Y[1] - T
