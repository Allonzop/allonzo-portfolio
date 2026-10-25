import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useStore } from '../../store'
import { Box, LightPool, useGlow, type V3 } from '../common'
import { Plate } from '../Plate'
import { power } from '../power'

/* A carvel hull built strake by strake, with a run of planks left off where the repair is under way */

type HullOpts = { L: number; B: number; D: number; strakes: number; gap?: { u0: number; u1: number; s0: number; s1: number } }

const breadth = (u: number) => Math.pow(Math.max(0, Math.sin(Math.PI * (0.18 + 0.82 * u))), 0.62)
const sheer = (u: number, D: number) => D * (1 + 0.22 * u * u + 0.08 * (1 - u) * (1 - u))

function section(u: number, v: number, o: HullOpts, side: 1 | -1) {
  const b = (o.B / 2) * breadth(u)
  const th = (v * Math.PI) / 2
  return new THREE.Vector3((u - 0.5) * o.L, sheer(u, o.D) * Math.pow(1 - Math.cos(th), 0.85), side * b * Math.sin(th))
}

function strakeColor(u: number, s: number, n: number, out: THREE.Color) {
  const v = s / n
  if (s === n - 1) return out.set('#efe9dc') // white sheer strake
  if (v < 0.38 && u > 0.55) return out.set('#7c2b20') // fresh antifouling forward
  if (u > 0.36 && u < 0.62) return out.set(s % 2 ? '#c99a62' : '#b98a55') // new bare timber
  return out.set(s % 2 ? '#24453a' : '#20403a') // old green topsides
}

function buildHull(o: HullOpts) {
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const NU = 48
  const per = 3
  const c = new THREE.Color()
  let base = 0
  for (const side of [1, -1] as const) {
    for (let s = 0; s < o.strakes; s++) {
      for (let iu = 0; iu < NU; iu++) {
        const u0 = iu / NU
        const u1 = (iu + 1) / NU
        const um = (u0 + u1) / 2
        if (o.gap && s >= o.gap.s0 && s <= o.gap.s1 && um > o.gap.u0 && um < o.gap.u1) continue
        strakeColor(um, s, o.strakes, c)
        // tiny shade step per plank so the seams read
        const shade = 0.92 + ((s * 7 + iu) % 3) * 0.035
        for (let k = 0; k < per; k++) {
          const v0 = (s + k / per) / o.strakes
          const v1 = (s + (k + 1) / per) / o.strakes - (k === per - 1 ? 0.012 : 0)
          const a = section(u0, v0, o, side)
          const b = section(u1, v0, o, side)
          const cc = section(u1, v1, o, side)
          const d = section(u0, v1, o, side)
          for (const p of [a, b, cc, d]) {
            pos.push(p.x, p.y, p.z)
            col.push(c.r * shade, c.g * shade, c.b * shade)
          }
          if (side === 1) idx.push(base, base + 2, base + 1, base, base + 3, base + 2)
          else idx.push(base, base + 1, base + 2, base, base + 2, base + 3)
          base += 4
        }
      }
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  // the bow closes to a point: zero-area faces give NaN normals, which bloom would smear across the screen
  const n = g.getAttribute('normal') as THREE.BufferAttribute
  for (let i = 0; i < n.count; i++) {
    if (!Number.isFinite(n.getX(i)) || !Number.isFinite(n.getY(i)) || !Number.isFinite(n.getZ(i))) n.setXYZ(i, 0, 1, 0)
  }
  return g
}

function frameTube(u: number, o: HullOpts) {
  const pts: THREE.Vector3[] = []
  for (let i = 20; i >= 0; i--) pts.push(section(u, i / 20, o, -1))
  for (let i = 1; i <= 20; i++) pts.push(section(u, i / 20, o, 1))
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.035, 4, false)
}

function transom(o: HullOpts) {
  const shape = new THREE.Shape()
  for (let i = 20; i >= 0; i--) {
    const p = section(0, i / 20, o, -1)
    if (i === 20) shape.moveTo(p.z, p.y)
    else shape.lineTo(p.z, p.y)
  }
  for (let i = 1; i <= 20; i++) {
    const p = section(0, i / 20, o, 1)
    shape.lineTo(p.z, p.y)
  }
  return new THREE.ShapeGeometry(shape)
}

function Hull({ o, ribs = [] as number[], keel = true }: { o: HullOpts; ribs?: number[]; keel?: boolean }) {
  const geo = useMemo(() => buildHull(o), [o])
  const ribGeos = useMemo(() => ribs.map((u) => frameTube(u, o)), [o, ribs])
  const tr = useMemo(() => transom(o), [o])
  return (
    <group>
      <mesh geometry={geo}>
        <meshLambertMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>
      {ribGeos.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshLambertMaterial color="#c2955e" />
        </mesh>
      ))}
      <mesh geometry={tr} position={[-o.L / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <meshLambertMaterial color="#20403a" side={THREE.DoubleSide} />
      </mesh>
      {keel && (
        <>
          <Box p={[0, -0.09, 0]} s={[o.L * 0.96, 0.2, 0.16]} c="#4a3524" />
          {/* stem post */}
          <Box p={[o.L / 2 - 0.05, sheer(1, o.D) / 2, 0]} s={[0.14, sheer(1, o.D) + 0.2, 0.14]} c="#4a3524" r={[0, 0, -0.18]} />
          {/* gunwale capping */}
        </>
      )}
    </group>
  )
}

const BIG: HullOpts = { L: 10.67, B: 3.2, D: 1.55, strakes: 10, gap: { u0: 0.42, u1: 0.56, s0: 2, s1: 5 } }
const SMALL: HullOpts = { L: 4.57, B: 1.55, D: 0.62, strakes: 7 }

function KeelBlocks({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} p={[0, 0.11 + i * 0.22, 0]} s={[0.5, 0.2, i % 2 ? 0.9 : 0.7]} c={i % 2 ? '#5a4330' : '#6b5038'} r={[0, i % 2 ? Math.PI / 2 : 0, 0]} />
      ))}
    </group>
  )
}

function BoatStand({ p, side }: { p: V3; side: 1 | -1 }) {
  return (
    <group position={p}>
      <Box p={[0, 0.06, 0]} s={[0.5, 0.06, 0.5]} c="#7a2b22" />
      <Box p={[0, 1.0, -side * 0.16]} s={[0.08, 2.0, 0.08]} c="#8a2f25" r={[side * 0.18, 0, 0]} />
      <Box p={[0, 1.95, -side * 0.36]} s={[0.24, 0.06, 0.24]} c="#3a2a1d" />
      {[-0.2, 0.2].map((dx) => (
        <Box key={dx} p={[dx, 0.5, side * 0.05]} s={[0.05, 1.1, 0.05]} c="#8a2f25" r={[0, 0, dx * 1.2]} />
      ))}
    </group>
  )
}

function Workbench({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <Box p={[0, 0.88, 0]} s={[3.0, 0.1, 0.9]} c="#9c7a52" />
      {[-1.4, 1.4].map((x) => [-0.35, 0.35].map((z) => <Box key={`${x}${z}`} p={[x, 0.42, z]} s={[0.1, 0.84, 0.1]} c="#6b5038" />))}
      <Box p={[0, 0.25, 0]} s={[2.8, 0.05, 0.8]} c="#6b5038" />
      {/* hand plane, mallet, chisels, a vice */}
      <Box p={[-0.8, 0.98, 0.05]} s={[0.36, 0.09, 0.1]} c="#7a5634" />
      <Box p={[-0.8, 1.04, 0.05]} s={[0.12, 0.06, 0.06]} c="#2d2d2d" />
      <Box p={[-0.15, 0.97, -0.15]} s={[0.12, 0.12, 0.2]} c="#a07a4e" />
      <Box p={[-0.15, 0.97, 0.08]} s={[0.04, 0.04, 0.3]} c="#7a5634" />
      {[0.25, 0.33, 0.41].map((x) => (
        <Box key={x} p={[x, 0.945, 0.15]} s={[0.03, 0.02, 0.26]} c="#9aa3ad" />
      ))}
      <Box p={[1.25, 1.02, 0.42]} s={[0.3, 0.18, 0.16]} c="#2f5b7a" />
      {/* a plank in the vice, half shaped */}
      <Box p={[0.7, 1.05, -0.1]} s={[1.6, 0.04, 0.22]} c="#d1a873" r={[0, 0.05, 0]} />
      {/* shavings */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0.3 + i * 0.15, 0.94, -0.3 + (i % 2) * 0.1]} rotation={[0, i, 0]}>
          <torusGeometry args={[0.04, 0.008, 4, 10]} />
          <meshLambertMaterial color="#e5c08f" />
        </mesh>
      ))}
    </group>
  )
}

function PlankRack({ p }: { p: V3 }) {
  return (
    <group position={p}>
      {[-2.2, 0, 2.2].map((x) => (
        <group key={x}>
          <Box p={[x, 1.0, 0]} s={[0.12, 2.0, 0.12]} c="#4a3524" />
          {[0.5, 1.0, 1.5].map((y) => (
            <Box key={y} p={[x, y, 0.25]} s={[0.08, 0.06, 0.5]} c="#4a3524" />
          ))}
        </group>
      ))}
      {[0.56, 1.06, 1.56].map((y, i) =>
        [0, 1, 2].map((k) => (
          <Box key={`${y}${k}`} p={[0, y + k * 0.045, 0.12 + k * 0.12]} s={[5.4 - i * 0.5, 0.04, 0.11]} c={['#c79a62', '#b88b55', '#d4a974'][(i + k) % 3]} />
        )),
      )}
    </group>
  )
}

/** Festoon of work lamps strung over the hull; they flicker on with the yard */
function Festoon() {
  const glow = useGlow('boatyard', '#ffc777', 3.2, 'light', 0.03)
  const pts = useMemo(() => {
    const out: V3[] = []
    for (let i = 0; i <= 14; i++) {
      const t = i / 14
      out.push([14.6 + t * 10, 4.4 - Math.sin(t * Math.PI) * 0.7, -2.2 + t * 0.4])
    }
    return out
  }, [])
  const wire = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(...p))), [pts])
  return (
    <group>
      <line>
        <primitive object={wire} attach="geometry" />
        <lineBasicMaterial color="#1a1a1a" />
      </line>
      {pts.map((p, i) => (
        <mesh key={i} position={[p[0], p[1] - 0.08, p[2]]} material={glow}>
          <sphereGeometry args={[0.07, 8, 6]} />
        </mesh>
      ))}
      {[14.4, 24.8].map((x) => (
        <Box key={x} p={[x, 2.2, -2.2 + (x > 20 ? 0.4 : 0)]} s={[0.12, 4.4, 0.12]} c="#4a3524" />
      ))}
    </group>
  )
}

function Shed() {
  return (
    <group position={[19.5, 0, -5.4]}>
      {[-5.6, 0, 5.6].map((x) => [-1.4, 1.4].map((z) => <Box key={`${x}${z}`} p={[x, 1.6, z]} s={[0.16, 3.2, 0.16]} c="#3a2a1d" />))}
      <Box p={[0, 3.3, 0]} s={[11.8, 0.12, 3.4]} c="#2e3238" r={[-0.12, 0, 0]} />
      <Box p={[0, 1.6, -1.6]} s={[11.6, 3.2, 0.1]} c="#3b3026" />
    </group>
  )
}

function Ripples() {
  // little lap of water at the foot of the slipway
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.06 + Math.sin(clock.elapsedTime * 1.6) * 0.03
  })
  return (
    <mesh ref={ref} position={[19.5, -0.82, 8]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.2, 1.5, 24]} />
      <meshBasicMaterial color="#9fc2e8" transparent opacity={0.2} depthWrite={false} />
    </mesh>
  )
}

export function Boatyard() {
  const done = useStore((s) => s.commissioned.includes('boatyard'))
  void power
  return (
    <group>
      {/* quay setts */}
      <Box p={[20, 0.004, -0.5]} s={[15, 0.008, 13]} c="#3a3732" />
      {/* slipway rails down to the water */}
      {[-0.7, 0.7].map((dz) => (
        <Box key={dz} p={[19.5 + dz, -0.3, 6.2]} s={[0.12, 0.08, 6]} c="#6d6a64" r={[-0.18, 0, 0]} />
      ))}
      <group position={[19.5, 0, 0]}>
        <KeelBlocks x={-3.2} />
        <KeelBlocks x={0} />
        <KeelBlocks x={3.2} />
        <group position={[0, 0.98, 0]}>
          <Hull o={BIG} ribs={[0.44, 0.47, 0.5, 0.53]} />
        </group>
        {[-3, 0.2, 3.2].map((x) =>
          ([1, -1] as const).map((side) => <BoatStand key={`${x}${side}`} p={[x, 0, side * 1.9]} side={side} />),
        )}
        {/* ladder against the hull */}
        <group position={[-1.6, 0, 1.95]} rotation={[0.28, 0, 0]}>
          {[-0.22, 0.22].map((x) => (
            <Box key={x} p={[x, 1.35, 0]} s={[0.06, 2.7, 0.06]} c="#a07a4e" />
          ))}
          {[0.4, 0.8, 1.2, 1.6, 2.0, 2.4].map((y) => (
            <Box key={y} p={[0, y, 0]} s={[0.44, 0.04, 0.04]} c="#a07a4e" />
          ))}
        </group>
      </group>
      {/* the 15-ft boat, upside down on trestles */}
      <group position={[24.5, 0, 3.4]}>
        {[-1.4, 1.4].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <Box p={[0, 0.75, 0]} s={[0.12, 0.08, 1.4]} c="#6b5038" />
            {[-0.55, 0.55].map((z) => (
              <Box key={z} p={[0, 0.37, z]} s={[0.08, 0.74, 0.08]} c="#6b5038" r={[z * 0.3, 0, 0]} />
            ))}
          </group>
        ))}
        <group position={[0, 0.79 + SMALL.D * 1.1, 0]} rotation={[Math.PI, 0, 0]}>
          <Hull o={SMALL} keel={false} />
        </group>
      </group>
      <Shed />
      <Workbench p={[15.5, 0, -5.1]} />
      <PlankRack p={[22.5, 0, -5.9]} />
      <Festoon />
      <Ripples />
      <LightPool id="boatyard" p={[19.5, 0.02, -0.4]} size={[14, 11]} strength={0.55} />
      <group position={[13.9, 0, 4.9]}>
        <Box p={[0, 0.9, 0]} s={[0.1, 1.8, 0.1]} c="#4a3524" />
        <Plate p={[0, 2.0, 0.07]} width={2.1} lines={['BOATYARD', done ? 'PLYMOUTH · ON' : 'PLYMOUTH, UK']} mark={done ? 'filled' : 'hollow'} />
      </group>
    </group>
  )
}
