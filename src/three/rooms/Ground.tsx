import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { ROOMS } from '../../content/rooms'
import { useStore } from '../../store'
import { Box, Fan, Led, Poster, Screen, type V3 } from '../common'
import { power } from '../power'
import { Shell } from './Shell'

/* ---------- PLANT ROOM: air handling, pumps, the BMS cabinet ---------- */

function Pump({ p }: { p: V3 }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.x += dt * 14 * power.plant.equip
  })
  return (
    <group position={p}>
      <Box p={[0, 0.12, 0]} s={[0.9, 0.24, 0.5]} c="#3c4a4f" />
      <mesh position={[-0.1, 0.48, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.5, 14]} />
        <meshLambertMaterial color="#2f6f8f" />
      </mesh>
      <mesh ref={ref} position={[0.28, 0.48, 0]} rotation={[0, 0, Math.PI / 2]} userData={{ dynamic: true }}>
        <cylinderGeometry args={[0.16, 0.16, 0.12, 6]} />
        <meshLambertMaterial color="#9aa3ad" />
      </mesh>
      <mesh position={[-0.1, 1.9, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 2.6, 8]} />
        <meshLambertMaterial color="#b13c32" />
      </mesh>
    </group>
  )
}

function BmsCabinet({ p }: { p: V3 }) {
  const leds: V3[] = []
  for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) leds.push([-0.36 + c * 0.11, 1.55 - r * 0.1, 0.205])
  return (
    <group position={p}>
      <Box p={[0, 1.0, 0]} s={[1.1, 2.0, 0.4]} c="#c8cbc6" />
      <Box p={[0, 1.0, 0.2]} s={[1.02, 1.92, 0.01]} c="#b9bcb7" />
      {leds.map((q, i) => (
        <Led key={i} id="plant" p={q} color={i % 5 === 0 ? '#ffb04a' : '#3dff8a'} blink={i % 3 === 0 ? 3 + (i % 4) : 0} />
      ))}
      <Screen
        id="plant"
        p={[0.25, 1.35, 0.21]}
        size={[0.34, 0.24]}
        px={[256, 180]}
        fps={4}
        paint={(ctx, t, w, h) => {
          ctx.fillStyle = '#071017'
          ctx.fillRect(0, 0, w, h)
          ctx.fillStyle = '#ffb04a'
          ctx.font = '600 22px "B612 Mono", monospace'
          ctx.fillText('AHU-01  RUN', 14, 34)
          ctx.fillStyle = '#9fe3b8'
          ctx.fillText(`SUP ${(18.6 + Math.sin(t * 0.4) * 0.3).toFixed(1)}°C`, 14, 76)
          ctx.fillText(`RET ${(22.1 + Math.sin(t * 0.3) * 0.2).toFixed(1)}°C`, 14, 112)
          ctx.fillText(`FAN ${Math.round(62 + Math.sin(t) * 3)} %`, 14, 148)
        }}
      />
    </group>
  )
}

/** The supervisor: whole-building readings and every room's state, live once the plant room is commissioned */
function Supervisor({ p }: { p: V3 }) {
  return (
    <group position={p}>
      {/* the supervision desk */}
      <Box p={[0, 0.74, 0]} s={[1.7, 0.06, 0.72]} c="#3b4148" />
      {[-0.78, 0.78].map((x) => (
        <Box key={x} p={[x, 0.37, 0]} s={[0.06, 0.74, 0.62]} c="#2a2f35" />
      ))}
      <Box p={[0, 0.86, -0.18]} s={[0.08, 0.18, 0.08]} c="#1b1e22" />
      <Box p={[0.35, 0.785, 0.18]} s={[0.5, 0.02, 0.16]} c="#1b1e22" />
      <SupervisorScreen />
    </group>
  )
}

function SupervisorScreen() {
  return (
    <Screen
      id="plant"
      p={[0, 1.36, -0.2]}
      size={[1.4, 0.8]}
      px={[768, 440]}
      fps={3}
      paint={(ctx, t, w, h) => {
        const done = useStore.getState().commissioned
        const n = done.length
        ctx.fillStyle = '#06111c'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#0d2a44'
        ctx.fillRect(0, 0, w, 52)
        ctx.fillStyle = '#ffb04a'
        ctx.font = '700 26px "B612 Mono", monospace'
        ctx.fillText('SUPERVISION  BMS', 22, 35)
        ctx.fillStyle = '#5ec8ff'
        ctx.font = '400 20px "B612 Mono", monospace'
        ctx.fillText('SIM', w - 70, 35)
        // building readings, rising as rooms come online
        const temp = (n ? 20.6 + n * 0.12 : 16.8) + Math.sin(t * 0.7) * 0.1
        const co2 = Math.round((n ? 520 + n * 18 : 430) + Math.sin(t * 0.37) * 9)
        const kw = n ? 4.2 + n * 6.4 + Math.sin(t * 1.3) * 0.6 : 0.4
        const rows: [string, string, string][] = [
          ['T', temp.toFixed(1), '°C'],
          ['CO2', String(co2), 'ppm'],
          ['P', kw.toFixed(1), 'kW'],
        ]
        rows.forEach(([k, v, u], i) => {
          const y = 118 + i * 92
          ctx.fillStyle = '#7f9bb3'
          ctx.font = '400 24px "B612 Mono", monospace'
          ctx.fillText(k, 26, y)
          ctx.fillStyle = '#ffcf8a'
          ctx.font = '700 52px "B612 Mono", monospace'
          ctx.fillText(v, 96, y + 8)
          const vw = ctx.measureText(v).width
          ctx.fillStyle = '#7f9bb3'
          ctx.font = '400 24px "B612 Mono", monospace'
          ctx.fillText(u, 96 + vw + 12, y + 8)
        })
        // room states: drawn until live
        ctx.strokeStyle = '#1d3b57'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(392, 72)
        ctx.lineTo(392, h - 22)
        ctx.stroke()
        ROOMS.forEach((r, i) => {
          const y = 92 + i * 42
          const on = done.includes(r.id)
          ctx.fillStyle = on ? '#3dff8a' : 'transparent'
          ctx.strokeStyle = on ? '#3dff8a' : '#5ec8ff'
          ctx.lineWidth = 3
          ctx.strokeRect(416, y - 18, 18, 18)
          if (on) ctx.fillRect(420, y - 14, 10, 10)
          ctx.fillStyle = on ? '#e8f5ee' : '#5ec8ff'
          ctx.font = '700 22px "B612 Mono", monospace'
          ctx.fillText(r.code.slice(0, 12), 450, y)
          ctx.fillStyle = on ? '#3dff8a' : '#2f6f95'
          ctx.fillText(on ? 'ON' : 'OFF', w - 76, y)
        })
      }}
    />
  )
}

export function PlantRoom() {
  return (
    <group>
      <Shell id="plant" x0={-8.92} x1={-3.08} y={0} floor="#4c5a54" wall="#8f968e" />
      {/* air handling unit against the back wall */}
      <group position={[-7.0, 0, -5.0]}>
        <Box p={[0, 1.1, 0]} s={[3.6, 2.2, 1.55]} c="#6f7f7a" />
        {[-1.2, 0, 1.2].map((x) => (
          <Box key={x} p={[x, 1.1, 0.78]} s={[1.12, 2.06, 0.02]} c="#7d8d88" />
        ))}
        <Fan id="plant" p={[-1.2, 1.25, 0.82]} radius={0.42} />
        <Fan id="plant" p={[0, 1.25, 0.82]} radius={0.42} speed={11} />
        <Box p={[1.2, 1.5, 0.8]} s={[0.6, 0.4, 0.04]} c="#2a2f35" />
        <Led id="plant" p={[1.2, 1.5, 0.83]} />
        {/* supply duct up to the ceiling run */}
        <Box p={[1.2, 2.75, -0.2]} s={[0.8, 1.1, 0.7]} c="#a9b1b6" />
      </group>
      <BmsCabinet p={[-3.8, 0, -5.55]} />
      <Supervisor p={[-4.4, 0, -3.55]} />
      <Pump p={[-8.1, 0, -2.1]} />
      <Pump p={[-8.1, 0, -1.1]} />
      {/* pipe run along the left wall */}
      <mesh position={[-8.75, 2.9, -3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 6, 8]} />
        <meshLambertMaterial color="#b13c32" />
      </mesh>
      <mesh position={[-8.55, 2.9, -3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 6, 8]} />
        <meshLambertMaterial color="#2f6f8f" />
      </mesh>
      {/* the control chain, sensor to supervision, pinned on the wall */}
      <Poster
        p={[-5.1, 1.75, -5.96]}
        size={[1.2, 0.85]}
        paint={(ctx, w, h) => {
          ctx.fillStyle = '#ece6d6'
          ctx.fillRect(0, 0, w, h)
          ctx.fillStyle = '#141414'
          ctx.font = 'condensed 800 34px "Archivo Variable", sans-serif'
          ctx.fillText('CONTROL CHAIN', 26, 52)
          const steps = ['SENSOR', 'CONTROLLER', 'NETWORK', 'SUPERVISION']
          steps.forEach((s, i) => {
            const y = 100 + i * 62
            ctx.strokeStyle = '#141414'
            ctx.lineWidth = 4
            ctx.strokeRect(26, y, 300, 44)
            ctx.font = 'condensed 700 26px "Archivo Variable", sans-serif'
            ctx.fillText(s, 40, y + 31)
            if (i < steps.length - 1) {
              ctx.beginPath()
              ctx.moveTo(176, y + 44)
              ctx.lineTo(176, y + 62)
              ctx.stroke()
            }
          })
          ctx.font = '500 20px "B612 Mono", monospace'
          ctx.fillText('BACS DECREE', 350, 130)
          ctx.fillText('CHECK  ■', 350, 162)
        }}
      />
    </group>
  )
}

/* ---------- LAB: logging nodes, power analyser, FEM, heating rig ---------- */

function ArduinoNode({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <Box p={[0, 0.02, 0]} s={[0.22, 0.03, 0.16]} c="#1d6f8c" />
      <Box p={[0.04, 0.05, 0.02]} s={[0.06, 0.03, 0.06]} c="#e9e9e9" />
      <Box p={[-0.06, 0.05, -0.03]} s={[0.05, 0.02, 0.04]} c="#222" />
      <Led id="lab" p={[0.08, 0.05, -0.05]} color="#ff4b3a" blink={4} />
    </group>
  )
}

export function Lab() {
  return (
    <group>
      <Shell id="lab" x0={-2.92} x1={2.92} y={0} floor="#8a8f92" wall="#cfcac0" />
      {/* workbench */}
      <group position={[-0.4, 0, -5.2]}>
        <Box p={[0, 0.9, 0]} s={[4.0, 0.06, 1.1]} c="#8a6b4a" />
        {[-1.9, 1.9].map((x) => (
          <Box key={x} p={[x, 0.45, 0]} s={[0.06, 0.9, 1.0]} c="#3a3f46" />
        ))}
        <ArduinoNode p={[-1.5, 0.93, 0.15]} />
        <ArduinoNode p={[-1.15, 0.93, -0.1]} />
        <ArduinoNode p={[-0.8, 0.93, 0.2]} />
        {/* power analyser */}
        <Box p={[-0.1, 1.08, -0.15]} s={[0.55, 0.32, 0.35]} c="#d8d4c8" />
        <Screen
          id="lab"
          p={[-0.1, 1.1, 0.03]}
          size={[0.34, 0.2]}
          px={[256, 150]}
          fps={6}
          paint={(ctx, t, w, h) => {
            ctx.fillStyle = '#04120b'
            ctx.fillRect(0, 0, w, h)
            ctx.strokeStyle = '#6dffb0'
            ctx.lineWidth = 3
            ctx.beginPath()
            for (let x = 0; x < w; x++) {
              const y = h / 2 + Math.sin(x * 0.08 + t * 6) * h * 0.3
              if (x) ctx.lineTo(x, y)
              else ctx.moveTo(x, y)
            }
            ctx.stroke()
          }}
        />
        {/* laptop with the FEM temperature field of the chip */}
        <group position={[1.1, 0.93, 0.05]}>
          <Box p={[0, 0.01, 0.1]} s={[0.6, 0.02, 0.4]} c="#2c2f35" />
          <Screen
            id="lab"
            p={[0, 0.21, -0.1]}
            r={[-0.25, 0, 0]}
            size={[0.56, 0.36]}
            px={[320, 200]}
            fps={2}
            paint={(ctx, t, w, h) => paintFem(ctx, t, w, h)}
          />
        </group>
      </group>
      {/* heating rig with a PID loop */}
      <group position={[2.35, 0, -2.6]}>
        {[-0.5, -0.25, 0, 0.25, 0.5].map((z) => (
          <Box key={z} p={[0, 0.75, z]} s={[0.12, 1.0, 0.18]} c="#e8e6df" />
        ))}
        <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
          <meshLambertMaterial color="#b13c32" />
        </mesh>
        <Screen
          id="lab"
          p={[-0.2, 1.55, 0]}
          r={[0, -Math.PI / 2, 0]}
          size={[0.6, 0.36]}
          px={[320, 190]}
          fps={4}
          paint={(ctx, t, w, h) => {
            ctx.fillStyle = '#0a0f14'
            ctx.fillRect(0, 0, w, h)
            ctx.strokeStyle = '#4a5560'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(0, h * 0.35)
            ctx.lineTo(w, h * 0.35)
            ctx.stroke()
            ctx.strokeStyle = '#ffb04a'
            ctx.lineWidth = 3
            ctx.beginPath()
            for (let x = 0; x < w; x++) {
              const k = x / w
              const y = h * 0.35 + h * 0.5 * Math.exp(-k * 4) * Math.cos(k * 18 + t * 0.2)
              if (x) ctx.lineTo(x, y)
              else ctx.moveTo(x, y)
            }
            ctx.stroke()
            ctx.fillStyle = '#ffb04a'
            ctx.font = '600 18px "B612 Mono", monospace'
            ctx.fillText('PID  Kp Ki Kd', 10, h - 14)
          }}
        />
      </group>
      <Poster
        p={[1.8, 1.9, -5.96]}
        size={[1.0, 0.7]}
        paint={(ctx, w, h) => {
          paintFem(ctx, 1, w, h)
          ctx.fillStyle = '#ece6d6'
          ctx.fillRect(0, h - 56, w, 56)
          ctx.fillStyle = '#141414'
          ctx.font = 'condensed 800 30px "Archivo Variable", sans-serif'
          ctx.fillText('17 FEM RUNS  ·  ≈ 6 % ERROR', 18, h - 18)
        }}
      />
    </group>
  )
}

function paintFem(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
  const img = ctx.createImageData(w, h)
  const cx = w * 0.5 + Math.sin(t * 0.5) * 4
  const cy = h * 0.45
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.hypot((x - cx) / (w * 0.32), (y - cy) / (h * 0.32))
      const v = Math.max(0, 1 - d)
      const i = (y * w + x) * 4
      // blue to red ramp, the usual thermal colourmap
      img.data[i] = 255 * Math.min(1, v * 2)
      img.data[i + 1] = 255 * Math.max(0, Math.min(1, v * 2 - 0.5)) * 0.85 + 30 * (1 - v)
      img.data[i + 2] = 255 * Math.max(0, 1 - v * 2.2) * 0.8 + 20
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 1
  for (let i = 1; i < 8; i++) {
    ctx.beginPath()
    ctx.moveTo((w / 8) * i, 0)
    ctx.lineTo((w / 8) * i, h)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, (h / 8) * i)
    ctx.lineTo(w, (h / 8) * i)
    ctx.stroke()
  }
}

/* ---------- CONTROL ROOM: supervision wall, the iPad rig ---------- */

function SupervisionWall() {
  return (
    <Screen
      id="control"
      p={[6, 2.05, -5.9]}
      size={[3.6, 1.7]}
      px={[900, 425]}
      fps={3}
      paint={(ctx, t, w, h) => {
        const done = useStore.getState().commissioned
        ctx.fillStyle = '#071019'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#ffb04a'
        ctx.font = '600 26px "B612 Mono", monospace'
        ctx.fillText(`THE PLANT  ·  ${done.length}/${ROOMS.length} COMMISSIONED`, 30, 50)
        // a synoptic of the building
        const cells: [string, number, number, number, number][] = [
          ['solar', 60, 90, 540, 60],
          ['studio', 60, 160, 270, 90],
          ['arcade', 330, 160, 270, 90],
          ['plant', 60, 260, 180, 110],
          ['lab', 240, 260, 180, 110],
          ['control', 420, 260, 180, 110],
          ['parking', 640, 260, 110, 110],
          ['boatyard', 760, 260, 110, 110],
        ]
        for (const [id, x, y, cw, ch] of cells) {
          const on = done.includes(id as never)
          ctx.strokeStyle = on ? '#9fe3b8' : '#3a4a58'
          ctx.lineWidth = 3
          ctx.strokeRect(x, y, cw - 8, ch - 8)
          ctx.fillStyle = on ? 'rgba(159,227,184,0.12)' : 'rgba(0,0,0,0)'
          ctx.fillRect(x, y, cw - 8, ch - 8)
          ctx.fillStyle = on ? '#9fe3b8' : '#5b6b78'
          ctx.font = '600 18px "B612 Mono", monospace'
          ctx.fillText(id.toUpperCase(), x + 10, y + 26)
          ctx.fillText(on ? 'ON' : 'OFFLINE', x + 10, y + 50)
        }
        ctx.fillStyle = '#5b6b78'
        ctx.fillText(new Date(Date.now()).toISOString().slice(11, 19) + '  UTC', w - 220, 50)
        void t
      }}
    />
  )
}

function TabletRig({ p }: { p: V3 }) {
  return (
    <group position={p}>
      {/* stand */}
      <Box p={[0, 0.1, 0]} s={[0.24, 0.02, 0.2]} c="#2c2f35" />
      <Box p={[0, 0.2, -0.04]} s={[0.03, 0.2, 0.03]} c="#2c2f35" r={[-0.3, 0, 0]} />
      <group position={[0, 0.38, 0]} rotation={[-0.3, 0, 0]}>
        <Box p={[0, 0, -0.01]} s={[0.46, 0.33, 0.02]} c="#18191c" />
        <Screen
          id="control"
          p={[0, 0, 0.002]}
          size={[0.42, 0.29]}
          px={[320, 220]}
          fps={5}
          paint={(ctx, t, w, h) => {
            ctx.fillStyle = '#1b2a3f'
            ctx.fillRect(0, 0, w, h)
            for (let r = 0; r < 3; r++)
              for (let c = 0; c < 5; c++) {
                ctx.fillStyle = ['#e8c35a', '#5aa0e8', '#e86a5a', '#6ad18f', '#c9c9c9'][(r + c) % 5]
                ctx.fillRect(28 + c * 56, 30 + r * 60, 36, 36)
              }
            // the pointer the AI drives
            const px = w * (0.5 + Math.sin(t * 0.9) * 0.35)
            const py = h * (0.5 + Math.cos(t * 0.7) * 0.3)
            ctx.fillStyle = 'rgba(255,255,255,0.85)'
            ctx.beginPath()
            ctx.arc(px, py, 9, 0, Math.PI * 2)
            ctx.fill()
          }}
        />
      </group>
      {/* the ESP32 that poses as a Bluetooth keyboard and pointer */}
      <group position={[0.42, 0.11, 0.05]}>
        <Box p={[0, 0, 0]} s={[0.18, 0.02, 0.08]} c="#1a1a1a" />
        <Box p={[0.02, 0.02, 0]} s={[0.08, 0.02, 0.06]} c="#9aa3ad" />
        <Led id="control" p={[-0.06, 0.02, 0.03]} color="#4aa8ff" blink={6} />
      </group>
    </group>
  )
}

export function ControlRoom() {
  return (
    <group>
      <Shell id="control" x0={3.08} x1={8.92} y={0} floor="#30353f" wall="#39414d" light={20} />
      <SupervisionWall />
      {/* desk with two monitors and the tablet rig */}
      <group position={[6, 0, -5.05]}>
        <Box p={[0, 0.78, 0]} s={[4.0, 0.06, 1.2]} c="#c9c4b8" />
        {[-1.9, 1.9].map((x) => (
          <Box key={x} p={[x, 0.39, 0]} s={[0.06, 0.78, 1.1]} c="#2a2e34" />
        ))}
        <Screen
          id="control"
          p={[-1.1, 1.18, -0.25]}
          size={[0.9, 0.52]}
          px={[400, 230]}
          fps={4}
          paint={(ctx, t, w, h) => {
            ctx.fillStyle = '#0b0f14'
            ctx.fillRect(0, 0, w, h)
            ctx.font = '500 15px "B612 Mono", monospace'
            const lines = ['> screen()', '  1194 x 834', '> tap(412, 230)', '  ok', '> type("hello")', '  ok', '> swipe(up)', '  ok']
            const n = Math.floor(t * 1.5) % lines.length
            for (let i = 0; i <= n; i++) {
              ctx.fillStyle = lines[i].startsWith('>') ? '#ffb04a' : '#7fa0b8'
              ctx.fillText(lines[i], 14, 24 + i * 24)
            }
          }}
        />
        <Box p={[-1.1, 0.88, -0.25]} s={[0.06, 0.2, 0.06]} c="#2a2e34" />
        <TabletRig p={[0.3, 0.78, 0.05]} />
        {/* keyboard */}
        <Box p={[-1.1, 0.82, 0.25]} s={[0.6, 0.02, 0.2]} c="#2a2e34" />
      </group>
      {/* chair */}
      <group position={[5.2, 0, -3.8]}>
        <Box p={[0, 0.5, 0]} s={[0.5, 0.08, 0.5]} c="#1e2228" />
        <Box p={[0, 0.85, 0.24]} s={[0.5, 0.6, 0.06]} c="#1e2228" />
        <Box p={[0, 0.25, 0]} s={[0.06, 0.5, 0.06]} c="#5a5f66" />
      </group>
    </group>
  )
}
