import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useStore } from '../../store'
import { Box, Screen, type V3 } from '../common'
import { StreetLamp } from '../Environment'
import { power } from '../power'

type BayState = 'free' | 'occupied' | 'reserved'
type Car = { phase: 'none' | 'arriving' | 'parked' | 'reversing' | 'leaving'; t: number; dur: number; color: THREE.Color }
type Bay = { x: number; z: number; dir: 1 | -1; state: BayState; timer: number; car: Car }

const XS = [-25, -22.7, -20.4, -18.1, -15.8, -13.5]
const LANE_IN = -0.5
const LANE_OUT = 0.6
const ENTRY_X = -46
const R = 2
const CAR_COLORS = ['#b8bcc2', '#1d2b4a', '#7b1e1e', '#e8e4da', '#2d3a2f', '#3c3f46', '#a86b2d', '#5d6f80']
const FRAME_BYTES = 135

/** Live counters shared with the panel */
export const parkingSim = { sent: 0, bytes: 0, streamMsgs: 0, seconds: 0 }

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const lanes = (b: { dir: number }) => (b.dir === -1 ? LANE_IN : LANE_OUT)
const pathLength = (b: { x: number; z: number; dir: number }) =>
  b.x - R - ENTRY_X + (Math.PI * R) / 2 + Math.abs(b.z - (lanes(b) + b.dir * R))

export function CarPark() {
  const bodies = useRef<THREE.InstancedMesh>(null)
  const cabins = useRef<THREE.InstancedMesh>(null)
  const leds = useRef<THREE.InstancedMesh>(null)
  const bays = useMemo<Bay[]>(() => {
    const out: Bay[] = []
    for (const x of XS) out.push({ x, z: -4.4, dir: -1, state: 'free', timer: rand(1, 14), car: { phase: 'none', t: 0, dur: 1, color: new THREE.Color() } })
    for (const x of XS) out.push({ x, z: 3.6, dir: 1, state: 'free', timer: rand(1, 14), car: { phase: 'none', t: 0, dur: 1, color: new THREE.Color() } })
    // a few already parked when the room comes online
    ;[1, 4, 7, 10].forEach((i) => {
      out[i].state = 'occupied'
      out[i].car.phase = 'parked'
      out[i].car.color.set(CAR_COLORS[i % CAR_COLORS.length])
      out[i].timer = rand(8, 40)
    })
    return out
  }, [])
  const o = useMemo(() => new THREE.Object3D(), [])
  const ledColor = useMemo(
    () => ({ free: new THREE.Color('#2bff7a'), occupied: new THREE.Color('#ff3b30'), reserved: new THREE.Color('#ffb04a'), off: new THREE.Color('#151515') }),
    [],
  )
  const lastPush = useRef(0)
  const runStart = useRef<number | null>(null)

  useLayoutEffect(() => {
    const m = leds.current!
    const p = new THREE.Object3D()
    bays.forEach((b, i) => {
      p.position.set(b.x, 1.05, b.z + b.dir * 2.15)
      p.updateMatrix()
      m.setMatrixAt(i, p.matrix)
      m.setColorAt(i, ledColor.off)
    })
    m.instanceMatrix.needsUpdate = true
  }, [bays, ledColor])

  const publish = () => {
    parkingSim.sent += 1
    parkingSim.bytes += FRAME_BYTES
  }

  useFrame(({ clock }, rawDt) => {
    const on = power.parking.equip
    const st = useStore.getState()
    const running = st.parking.running
    // the visitor's "run the sim" plays at 6x for 12 seconds
    if (running && runStart.current === null) runStart.current = clock.elapsedTime
    if (!running) runStart.current = null
    if (running && runStart.current !== null && clock.elapsedTime - runStart.current > 12) {
      st.setParking({ running: false })
      st.unlock('parking-sim')
    }
    const speed = running ? 6 : 1
    const dt = Math.min(rawDt, 0.05) * speed * (on > 0.5 ? 1 : 0)
    if (dt > 0) {
      parkingSim.seconds += dt
      parkingSim.streamMsgs = Math.floor(parkingSim.seconds) * bays.length
    }
    bays.forEach((b) => {
      const c = b.car
      if (dt <= 0) return
      b.timer -= dt
      if (c.phase === 'none' && b.timer <= 0) {
        if (b.state === 'free' && Math.random() < 0.3) {
          b.state = 'reserved'
          publish()
          b.timer = rand(2, 5)
        } else {
          c.phase = 'arriving'
          c.t = 0
          c.dur = pathLength(b) / 8
          c.color.set(CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)])
        }
      }
      if (c.phase === 'arriving') {
        c.t += dt / c.dur
        if (c.t >= 1) {
          c.phase = 'parked'
          b.state = 'occupied'
          publish()
          b.timer = rand(18, 45)
        }
      } else if (c.phase === 'parked' && b.timer <= 0) {
        c.phase = 'reversing'
        c.t = 0
        c.dur = 1.4
      } else if (c.phase === 'reversing') {
        c.t += dt / c.dur
        if (c.t >= 1) {
          c.phase = 'leaving'
          c.t = 0
          c.dur = Math.abs(b.x - ENTRY_X) / 9
          b.state = 'free'
          publish()
        }
      } else if (c.phase === 'leaving') {
        c.t += dt / c.dur
        if (c.t >= 1) {
          c.phase = 'none'
          b.timer = rand(10, 30)
        }
      }
    })

    // place the cars
    const bm = bodies.current
    const cm = cabins.current
    const lm = leds.current
    if (!bm || !cm || !lm) return
    bays.forEach((b, i) => {
      const c = b.car
      let x = 0
      let z = 0
      let h = 0
      let visible = true
      const lane = b.dir === -1 ? LANE_IN : LANE_OUT
      if (c.phase === 'none') visible = false
      else if (c.phase === 'parked') {
        x = b.x
        z = b.z
        h = b.dir === -1 ? Math.PI : 0
      } else if (c.phase === 'arriving') {
        // in along the road and the lane, a quarter turn, then nose into the bay
        const s = THREE.MathUtils.smoothstep(c.t, 0, 1) * pathLength(b)
        const run = b.x - R - ENTRY_X
        const arc = (Math.PI * R) / 2
        if (s < run) {
          x = ENTRY_X + s
          z = lane
          h = Math.PI / 2
        } else if (s < run + arc) {
          const a = (s - run) / R
          x = b.x - R + Math.sin(a) * R
          z = lane + b.dir * R - b.dir * Math.cos(a) * R
          h = Math.PI / 2 + (b.dir === -1 ? a : -a)
        } else {
          x = b.x
          z = lane + b.dir * (R + (s - run - arc))
          h = b.dir === -1 ? Math.PI : 0
        }
      } else if (c.phase === 'reversing') {
        const t = THREE.MathUtils.smoothstep(c.t, 0, 1)
        x = b.x
        z = THREE.MathUtils.lerp(b.z, lane, t)
        h = b.dir === -1 ? Math.PI : 0
      } else if (c.phase === 'leaving') {
        // swing round to face the road, then drive off west
        const t = THREE.MathUtils.smoothstep(c.t, 0, 1)
        x = THREE.MathUtils.lerp(b.x, ENTRY_X, t)
        z = lane
        const from = b.dir === -1 ? Math.PI : 0
        const to = b.dir === -1 ? (3 * Math.PI) / 2 : -Math.PI / 2
        h = THREE.MathUtils.lerp(from, to, Math.min(1, t * 12))
      }
      o.position.set(x, visible ? 0.45 : -50, z)
      o.rotation.set(0, h, 0)
      o.updateMatrix()
      bm.setMatrixAt(i, o.matrix)
      bm.setColorAt(i, c.color)
      o.position.y = visible ? 0.98 : -50
      o.updateMatrix()
      cm.setMatrixAt(i, o.matrix)
      lm.setColorAt(i, on < 0.2 ? ledColor.off : ledColor[b.state])
    })
    bm.instanceMatrix.needsUpdate = true
    cm.instanceMatrix.needsUpdate = true
    if (bm.instanceColor) bm.instanceColor.needsUpdate = true
    if (lm.instanceColor) lm.instanceColor.needsUpdate = true

    if (clock.elapsedTime - lastPush.current > 0.25 && on > 0.5) {
      lastPush.current = clock.elapsedTime
      st.setParking({ sent: parkingSim.sent, stream: parkingSim.streamMsgs, seconds: parkingSim.seconds })
    }
  })

  const lines = useMemo(() => {
    const out: { p: V3; s: V3 }[] = []
    for (const zc of [-4.4, 3.6]) {
      for (let i = 0; i <= XS.length; i++) {
        const x = XS[0] - 1.15 + i * 2.3
        out.push({ p: [x, 0.012, zc], s: [0.08, 0.01, 4.4] })
      }
    }
    return out
  }, [])

  return (
    <group>
      <Box p={[-19, 0.004, -0.4]} s={[16, 0.008, 13]} c="#252b35" />
      {/* access road running west out of the frame */}
      <Box p={[-38, 0.003, 0.05]} s={[22, 0.008, 3.2]} c="#20252d" />
      {lines.map((l, i) => (
        <Box key={i} p={l.p} s={l.s} c="#c9c6bd" />
      ))}
      {/* lane arrows */}
      <Box p={[-12.6, 0.012, LANE_IN]} s={[1.4, 0.01, 0.12]} c="#c9c6bd" />
      <Box p={[-12.6, 0.012, LANE_OUT]} s={[1.4, 0.01, 0.12]} c="#c9c6bd" />
      {/* sensor posts: ESP32 node with an ultrasonic sensor at the head of each bay */}
      {[...XS.map((x) => [x, -6.55]), ...XS.map((x) => [x, 5.75])].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Box p={[0, 0.45, 0]} s={[0.08, 0.9, 0.08]} c="#3a414d" />
          <Box p={[0, 0.98, 0]} s={[0.2, 0.14, 0.12]} c="#e5e2d9" />
          <Box p={[-0.05, 0.98, i < XS.length ? 0.065 : -0.065]} s={[0.05, 0.05, 0.02]} c="#9aa3ad" />
          <Box p={[0.05, 0.98, i < XS.length ? 0.065 : -0.065]} s={[0.05, 0.05, 0.02]} c="#9aa3ad" />
        </group>
      ))}
      <instancedMesh ref={leds} args={[undefined, undefined, 12]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshBasicMaterial toneMapped={false} color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={bodies} args={[undefined, undefined, 12]}>
        <boxGeometry args={[1.78, 0.62, 4.1]} />
        <meshLambertMaterial color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={cabins} args={[undefined, undefined, 12]}>
        <boxGeometry args={[1.58, 0.5, 2.1]} />
        <meshLambertMaterial color="#1b2027" />
      </instancedMesh>
      {/* solar carport canopy over the north row */}
      <group>
        {XS.filter((_, i) => i % 2 === 0).map((x) => (
          <Box key={x} p={[x + 1.15, 1.4, -6.1]} s={[0.14, 2.8, 0.14]} c="#8d949c" />
        ))}
        <Box p={[-19.25, 2.85, -4.2]} s={[14.2, 0.08, 4.6]} c="#14284a" r={[0.12, 0, 0]} />
      </group>
      {/* the counter at the entrance */}
      <group position={[-11.6, 0, 1.9]}>
        <Box p={[-0.75, 1.1, 0]} s={[0.08, 2.2, 0.08]} c="#3a414d" />
        <Box p={[0.75, 1.1, 0]} s={[0.08, 2.2, 0.08]} c="#3a414d" />
        <Screen
          id="parking"
          p={[0, 2.25, 0.05]}
          size={[1.8, 0.8]}
          px={[540, 240]}
          fps={4}
          paint={(ctx, _t, w, h) => {
            ctx.fillStyle = '#060a0e'
            ctx.fillRect(0, 0, w, h)
            ctx.font = '600 30px "B612 Mono", monospace'
            ctx.fillStyle = '#2bff7a'
            ctx.fillText(`MQTT   ${parkingSim.sent.toLocaleString('en-GB')}`, 26, 70)
            ctx.fillStyle = '#ff6a5a'
            ctx.fillText(`1 Hz   ${parkingSim.streamMsgs.toLocaleString('en-GB')}`, 26, 130)
            const saved = parkingSim.sent >= 5 ? `${((1 - parkingSim.sent / parkingSim.streamMsgs) * 100).toFixed(1)} %` : '…'
            ctx.fillStyle = '#ffb04a'
            ctx.fillText(`SAVED  ${saved}`, 26, 190)
          }}
        />
      </group>
      <StreetLamp p={[-26.5, 0, 0]} />
      <StreetLamp p={[-19, 0, 0.1]} />
    </group>
  )
}
