import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Box } from '../common'
import { power } from '../power'

/**
 * The supply duct leaves the air handling unit, runs along the back wall
 * of the ground floor, rises and serves level 1 and the roof. Data pulses
 * travel along it once the plant room is commissioned.
 */
const RUN: [number, number, number][] = [
  [-5.8, 2.95, -5.55],
  [8.6, 2.95, -5.55],
  [8.6, 6.55, -5.55],
  [-8.5, 6.55, -5.55],
  [-8.5, 7.9, -5.55],
  [6.0, 7.9, -5.55],
]

export function Ducts() {
  const segs = useMemo(() => {
    const out: { p: [number, number, number]; s: [number, number, number] }[] = []
    for (let i = 0; i < RUN.length - 1; i++) {
      const a = RUN[i]
      const b = RUN[i + 1]
      const c: [number, number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[2]]
      const dx = Math.abs(b[0] - a[0])
      const dy = Math.abs(b[1] - a[1])
      out.push({ p: c, s: [dx + 0.5, dy + 0.5, 0.5] })
    }
    return out
  }, [])
  const curve = useMemo(() => new THREE.CurvePath<THREE.Vector3>(), [])
  useMemo(() => {
    for (let i = 0; i < RUN.length - 1; i++)
      curve.add(new THREE.LineCurve3(new THREE.Vector3(...RUN[i]).setZ(RUN[i][2] + 0.27), new THREE.Vector3(...RUN[i + 1]).setZ(RUN[i + 1][2] + 0.27)))
  }, [curve])
  const N = 26
  const ref = useRef<THREE.InstancedMesh>(null)
  const o = useMemo(() => new THREE.Object3D(), [])
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffb04a', toneMapped: false }), [])
  useLayoutEffect(() => {
    if (ref.current) ref.current.count = N
  }, [])
  useFrame(({ clock }) => {
    const m = ref.current
    if (!m) return
    const e = power.plant.equip
    mat.color.set('#ffb04a').multiplyScalar(e * 3.2)
    m.visible = e > 0.02
    if (!m.visible) return
    const t = clock.elapsedTime * 0.045
    for (let i = 0; i < N; i++) {
      const u = (t + i / N) % 1
      curve.getPointAt(u, o.position)
      o.scale.setScalar(0.6 + 0.4 * Math.sin(i * 1.7 + clock.elapsedTime * 3) ** 2)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <group>
      {segs.map((s, i) => (
        <Box key={i} p={s.p} s={s.s} c="#9ea7ad" />
      ))}
      <instancedMesh ref={ref} args={[undefined, undefined, N]} material={mat}>
        <boxGeometry args={[0.22, 0.08, 0.04]} />
      </instancedMesh>
    </group>
  )
}
