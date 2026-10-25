import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Box, Led } from '../common'
import { power } from '../power'

const ROOF = 7.2
const PANEL = { w: 1.0, d: 1.65, tilt: 0.26 }

/** Instanced PV rows on the deck; a sheen sweeps across once commissioned */
function PvRows() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const rows = [-4.8, -3.2, -1.7]
  const xs = useMemo(() => {
    const out: number[] = []
    for (let x = -7.6; x <= 7.2; x += 1.06) out.push(x)
    return out
  }, [])
  const count = rows.length * xs.length
  const base = useMemo(() => new THREE.Color('#13233f'), [])
  const sheen = useMemo(() => new THREE.Color('#6d8fc4'), [])
  const tmp = useMemo(() => new THREE.Color(), [])
  useLayoutEffect(() => {
    const m = ref.current!
    const o = new THREE.Object3D()
    let i = 0
    for (const z of rows)
      for (const x of xs) {
        o.position.set(x, ROOF + 0.55, z)
        o.rotation.set(-PANEL.tilt, 0, 0)
        o.updateMatrix()
        m.setMatrixAt(i, o.matrix)
        m.setColorAt(i, base)
        i++
      }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useFrame(({ clock }) => {
    const m = ref.current
    if (!m) return
    const e = power.solar.equip
    if (e <= 0.001) return
    const t = clock.elapsedTime
    const sweep = ((t * 5) % 26) - 9
    let i = 0
    for (let r = 0; r < rows.length; r++)
      for (const x of xs) {
        const d = Math.abs(x - sweep + r * 0.8)
        const k = Math.exp(-d * d * 0.6) * e
        tmp.copy(base).lerp(sheen, k * 0.9 + e * 0.08)
        m.setColorAt(i++, tmp)
      }
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })
  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, count]}>
        <boxGeometry args={[PANEL.w, 0.04, PANEL.d]} />
        <meshStandardMaterial roughness={0.25} metalness={0.4} color="#ffffff" />
      </instancedMesh>
      {/* rails under each row */}
      {rows.map((z) => (
        <group key={z}>
          <Box p={[-0.2, ROOF + 0.3, z - 0.4]} s={[15.4, 0.05, 0.05]} c="#8d949c" />
          <Box p={[-0.2, ROOF + 0.15, z + 0.4]} s={[15.4, 0.05, 0.05]} c="#8d949c" />
          {[-7.6, -3.8, 0, 3.8, 7.2].map((x) => (
            <Box key={x} p={[x, ROOF + 0.2, z]} s={[0.05, 0.4, 0.9]} c="#6d747c" />
          ))}
        </group>
      ))}
    </group>
  )
}

/**
 * The featured frame: modules held vertically along the front parapet,
 * about 20 cm above the roof, 6 support points per frame.
 */
function VerticalFrames() {
  const frames = [-8.0, -6.0, -4.0, -2.0]
  return (
    <group>
      {frames.map((x) => (
        <group key={x} position={[x + 0.95, ROOF, -0.32]}>
          {/* two modules standing at 90° */}
          {[-0.5, 0.5].map((dx) => (
            <group key={dx}>
              <Box p={[dx, 0.2 + 0.85, 0]} s={[0.98, 1.7, 0.04]} c="#9aa2ab" />
              <mesh position={[dx, 0.2 + 0.85, 0.022]}>
                <planeGeometry args={[0.92, 1.64]} />
                <meshStandardMaterial color="#14284a" roughness={0.2} metalness={0.5} />
              </mesh>
            </group>
          ))}
          {/* 6 support points onto the parapet and the deck */}
          {[-0.9, 0, 0.9].map((sx) => (
            <group key={sx}>
              <Box p={[sx, 0.1, -0.12]} s={[0.08, 0.2, 0.2]} c="#c7a35a" />
              <Box p={[sx, 1.4, 0.1]} s={[0.06, 0.06, 0.22]} c="#c7a35a" />
            </group>
          ))}
          <Box p={[0, 0.22, -0.02]} s={[2.0, 0.05, 0.06]} c="#c7a35a" />
        </group>
      ))}
    </group>
  )
}

function Inverters() {
  return (
    <group position={[6.6, ROOF, -5.75]}>
      {[0, 0.8, 1.6].map((x) => (
        <group key={x} position={[x - 0.8, 0, 0]}>
          <Box p={[0, 0.65, 0]} s={[0.6, 0.8, 0.22]} c="#d9d6cf" />
          <Led id="solar" p={[0.18, 0.92, 0.115]} />
          <Led id="solar" p={[0.18, 0.84, 0.115]} color="#ffb04a" blink={2} />
        </group>
      ))}
    </group>
  )
}

function Beacon() {
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ff3a2a', toneMapped: false }), [])
  useFrame(({ clock }) => {
    const on = Math.sin(clock.elapsedTime * 3) > 0.6 ? 3 : 0.15
    glow.color.set('#ff3a2a').multiplyScalar(on)
  })
  return (
    <group position={[-8.6, ROOF + 0.9, -5.7]}>
      <Box p={[0, 0.6, 0]} s={[0.08, 1.2, 0.08]} c="#3a414d" />
      <mesh position={[0, 1.25, 0]} material={glow}>
        <sphereGeometry args={[0.09, 10, 8]} />
      </mesh>
    </group>
  )
}

export function Solar() {
  return (
    <group>
      {/* roof membrane */}
      <Box p={[0, ROOF + 0.012, -3]} s={[18, 0.02, 6]} c="#434951" />
      <PvRows />
      <VerticalFrames />
      <Inverters />
      <Beacon />
    </group>
  )
}

