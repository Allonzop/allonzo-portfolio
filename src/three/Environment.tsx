import { Stars } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useStore } from '../store'
import { Box, useGlow, type V3 } from './common'
import { power } from './power'
import { StaticBatch } from './StaticBatch'

const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
const skyFrag = /* glsl */ `
varying vec3 vDir;
void main() {
  float h = clamp(vDir.y, -0.2, 1.0);
  vec3 horizon = vec3(0.035, 0.06, 0.11);
  vec3 zenith = vec3(0.004, 0.008, 0.02);
  vec3 col = mix(horizon, zenith, smoothstep(0.0, 0.55, h));
  // faint sodium glow of the town on the horizon
  col += vec3(0.16, 0.07, 0.02) * exp(-abs(h) * 22.0) * 0.5;
  gl_FragColor = vec4(col, 1.0);
}`

function Sky() {
  return (
    <mesh scale={400} renderOrder={-1}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial vertexShader={skyVert} fragmentShader={skyFrag} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  )
}

function Moon() {
  return (
    <group position={[-90, 95, -220]}>
      <mesh>
        <circleGeometry args={[7, 40]} />
        <meshBasicMaterial color="#e9eef7" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -1]}>
        <circleGeometry args={[16, 40]} />
        <meshBasicMaterial color="#5d7aa6" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  )
}

const seaVert = /* glsl */ `
uniform float uTime;
varying vec3 vPos;
varying float vH;
void main() {
  vec3 p = position;
  float h = sin(p.x * 0.35 + uTime * 0.9) * 0.12 + sin(p.y * 0.5 - uTime * 0.7) * 0.1 + sin((p.x + p.y) * 1.3 + uTime * 1.7) * 0.03;
  p.z += h;
  vH = h;
  vec4 w = modelMatrix * vec4(p, 1.0);
  vPos = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`
const seaFrag = /* glsl */ `
uniform float uTime;
uniform vec3 uCam;
varying vec3 vPos;
varying float vH;
void main() {
  vec3 deep = vec3(0.002, 0.006, 0.014);
  vec3 lit = vec3(0.01, 0.024, 0.045);
  vec3 col = mix(deep, lit, smoothstep(-0.15, 0.22, vH));
  // moon path glitter towards the camera
  vec3 v = normalize(uCam - vPos);
  float glint = pow(max(0.0, sin(vPos.x * 3.1 + uTime * 1.3) * sin(vPos.z * 2.7 - uTime)), 60.0);
  // a moon path: glints concentrate along the line towards the moon (behind, to the left)
  float path = exp(-pow((vPos.x + vPos.z * 0.38 + 20.0) * 0.06, 2.0));
  col += vec3(0.6, 0.7, 0.85) * glint * (0.04 + 0.22 * path);
  // warm reflections of the quay lamps near the shore
  float shore = step(6.4, vPos.z) * exp(-max(0.0, vPos.z - 6.6) * 0.45);
  col += vec3(0.30, 0.14, 0.03) * shore * 0.22 * (0.6 + 0.4 * sin(vPos.x * 3.0 + uTime * 2.0));
  float fog = smoothstep(50.0, 170.0, length(vPos.xz));
  col = mix(col, vec3(0.012, 0.024, 0.045), fog);
  gl_FragColor = vec4(col, 1.0);
}`

function Sea() {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uCam: { value: new THREE.Vector3() } }), [])
  useFrame(({ clock, camera }) => {
    uniforms.uTime.value = clock.elapsedTime
    uniforms.uCam.value.copy(camera.position)
  })
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[40, -0.9, 40]}>
      <planeGeometry args={[320, 280, 120, 100]} />
      <shaderMaterial ref={mat} vertexShader={seaVert} fragmentShader={seaFrag} uniforms={uniforms} />
    </mesh>
  )
}

/** Land, plaza, quay walls; the sea wraps the front and the right */
function Ground() {
  return (
    <group>
      {/* land the plant sits on */}
      <Box p={[-26, -0.55, -55]} s={[108, 1, 110]} c="#121821" />
      <Box p={[-0.5, -0.5, -0.4]} s={[56, 1, 14]} c="#1f2631" />
      {/* plaza paving */}
      <Box p={[0.75, -0.005, 3]} s={[24.5, 0.01, 6]} c="#2b313b" />
      {/* quay wall and coping along the water */}
      <Box p={[-0.5, -0.5, 6.55]} s={[56, 1.2, 0.3]} c="#4b4f55" />
      <Box p={[-0.5, 0.02, 6.5]} s={[56, 0.06, 0.4]} c="#6f6a60" />
      <Box p={[27.6, -0.5, -0.4]} s={[0.3, 1.2, 14]} c="#4b4f55" />
      {/* bollards */}
      {[-24, -16, -8, 0, 8, 16, 24].map((x) => (
        <group key={x} position={[x, 0, 6.15]}>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.14, 0.18, 0.5, 10]} />
            <meshLambertMaterial color="#26292e" />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <sphereGeometry args={[0.16, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshLambertMaterial color="#26292e" />
          </mesh>
        </group>
      ))}
      {/* breakwater out to the lighthouse */}
      <Box p={[34, -0.45, -15]} s={[3, 1, 22]} c="#2a2f37" r={[0, -0.59, 0]} />
    </group>
  )
}

function Hills() {
  const geo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-160, 0)
    const pts = [
      [-120, 9], [-95, 15], [-70, 11], [-48, 19], [-30, 14], [-10, 18], [12, 12], [30, 16], [55, 9], [80, 13], [110, 6], [160, 4],
    ]
    pts.forEach(([x, y]) => shape.lineTo(x, y))
    shape.lineTo(160, 0)
    shape.lineTo(-160, 0)
    return new THREE.ShapeGeometry(shape)
  }, [])
  const town = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos: number[] = []
    for (let i = 0; i < 260; i++) {
      const x = -150 + Math.random() * 270
      const y = Math.random() * 6 * Math.random()
      pos.push(x, y + 0.5, 0.5)
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    return g
  }, [])
  return (
    <group position={[0, -0.5, -95]}>
      <mesh geometry={geo}>
        <meshBasicMaterial color="#0a1220" />
      </mesh>
      <points geometry={town}>
        <pointsMaterial color="#ffb25e" size={0.55} sizeAttenuation transparent opacity={0.8} toneMapped={false} />
      </points>
      <group position={[0, 0, -40]} scale={[1.4, 1.6, 1]}>
        <mesh geometry={geo}>
          <meshBasicMaterial color="#0d1828" />
        </mesh>
      </group>
    </group>
  )
}

const beamMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  // bright at the lamp, fading out along the beam
  fragmentShader: `varying vec2 vUv; void main(){ float a = pow(vUv.y, 2.2) * 0.16; gl_FragColor = vec4(vec3(1.0, 0.93, 0.75) * a, a); }`,
})

/** The lighthouse at the end of the breakwater; clicking it is the easter egg */
function Lighthouse() {
  const beam = useRef<THREE.Group>(null)
  const lamp = useRef<THREE.MeshBasicMaterial>(null)
  const morse = useRef<{ t0: number; on: boolean } | null>(null)
  const unlock = useStore((s) => s.unlock)
  // "AP" in Morse: .-  .--.
  const seq = useMemo(() => {
    const out: [number, boolean][] = []
    let t = 0
    const add = (d: number, on: boolean) => {
      out.push([t, on])
      t += d
    }
    const dot = 0.22
    for (const sym of ['.', '-', ' ', '.', '-', '-', '.']) {
      if (sym === ' ') {
        add(dot * 3, false)
        continue
      }
      add(sym === '.' ? dot : dot * 3, true)
      add(dot, false)
    }
    out.push([t, false])
    return out
  }, [])
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    if (beam.current) beam.current.rotation.y += dt * 0.6
    let on = true
    if (morse.current && morse.current.t0 === -1) morse.current.t0 = t
    if (morse.current) {
      const e = t - morse.current.t0
      const last = seq[seq.length - 1][0]
      if (e > last + 0.5) morse.current = null
      else {
        on = false
        for (const [at, v] of seq) if (e >= at) on = v
      }
    }
    if (lamp.current) lamp.current.color.setScalar(on ? 1.6 : 0.15)
    if (beam.current) beam.current.visible = on
  })
  return (
    <group
      position={[40, 0, -24]}
      onClick={(e) => {
        e.stopPropagation()
        // anchored to the scene clock on the next frame
        morse.current = { t0: -1, on: true }
        unlock('easter-egg')
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <mesh position={[0, 4.5, 0]}>
        <cylinderGeometry args={[0.9, 1.4, 9, 12]} />
        <meshLambertMaterial color="#d8d2c4" />
      </mesh>
      {[1.6, 4.2, 6.8].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[1.42 - y * 0.055, 1.44 - y * 0.055, 1.0, 12]} />
          <meshLambertMaterial color="#9d2f2a" />
        </mesh>
      ))}
      <mesh position={[0, 9.2, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.25, 12]} />
        <meshLambertMaterial color="#2b2f36" />
      </mesh>
      <mesh position={[0, 9.9, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 1.1, 10]} />
        <meshBasicMaterial ref={lamp} color="#fff1c9" toneMapped={false} />
      </mesh>
      <mesh position={[0, 10.75, 0]}>
        <coneGeometry args={[0.85, 0.7, 10]} />
        <meshLambertMaterial color="#2b2f36" />
      </mesh>
      <group ref={beam} position={[0, 9.9, 0]}>
        {[0, Math.PI].map((a) => (
          <mesh key={a} rotation={[0, a, Math.PI / 2]} position={[Math.cos(a) * 7, 0, -Math.sin(a) * 7]} material={beamMat}>
            <coneGeometry args={[1.8, 14, 20, 1, true]} />
          </mesh>
        ))}
      </group>
      {/* large invisible hit area so the lighthouse is easy to click from afar */}
      <mesh position={[0, 6, 0]} visible={false}>
        <cylinderGeometry args={[2.6, 2.6, 12, 8]} />
      </mesh>
    </group>
  )
}

/** The town behind the plant: one instanced draw, lit windows painted into a texture */
function Town() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const blocks = useMemo(() => {
    const out: { x: number; z: number; w: number; d: number; h: number }[] = []
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let row = 0; row < 4; row++) {
      const z = -18 - row * 12 - rnd() * 3
      for (let x = -70; x < 40; ) {
        const w = 5 + rnd() * 9
        if (!(row === 0 && x > -14 && x < 14)) out.push({ x: x + w / 2, z, w, d: 5 + rnd() * 5, h: 2.5 + rnd() * (row === 0 ? 3.5 : 4 + row * 2) })
        x += w + 1 + rnd() * 4
      }
    }
    return out
  }, [])
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#0d131c'
    ctx.fillRect(0, 0, 256, 256)
    let seed = 3
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let y = 8; y < 256; y += 22)
      for (let x = 6; x < 256; x += 16) {
        const r = rnd()
        ctx.fillStyle = r > 0.9 ? '#ffb45c' : r > 0.86 ? '#cfe0ff' : '#121924'
        ctx.globalAlpha = r > 0.86 ? 0.45 + rnd() * 0.4 : 1
        ctx.fillRect(x, y, 8, 11)
      }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  useLayoutEffect(() => {
    const m = ref.current!
    const o = new THREE.Object3D()
    blocks.forEach((b, i) => {
      o.position.set(b.x, b.h / 2 - 0.05, b.z)
      o.scale.set(b.w, b.h, b.d)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  }, [blocks])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, blocks.length]}>
      <boxGeometry />
      <meshBasicMaterial map={tex} color="#6f7889" />
    </instancedMesh>
  )
}

/** Sodium street lamp with a baked pool of light on the ground */
export function StreetLamp({ p, pool = true }: { p: V3; pool?: boolean }) {
  // dark until the visitor energises the site
  const head = useGlow('site', '#ffb15c', 2.6, 'light', 0.03)
  const tex = useMemo(() => poolTexture(), [])
  const poolMat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(() => {
    if (poolMat.current) poolMat.current.opacity = power.site.light
  })
  return (
    <group position={p}>
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 4.4, 8]} />
        <meshLambertMaterial color="#30353c" />
      </mesh>
      <mesh position={[0.35, 4.4, 0]}>
        <boxGeometry args={[0.8, 0.06, 0.08]} />
        <meshLambertMaterial color="#30353c" />
      </mesh>
      <mesh position={[0.65, 4.32, 0]} material={head}>
        <boxGeometry args={[0.36, 0.08, 0.2]} />
      </mesh>
      {pool && (
        <mesh position={[0.65, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[7, 7]} />
          <meshBasicMaterial ref={poolMat} map={tex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

let poolCache: THREE.Texture | null = null
function poolTexture() {
  if (poolCache) return poolCache
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,170,80,0.34)')
  g.addColorStop(0.5, 'rgba(255,150,60,0.12)')
  g.addColorStop(1, 'rgba(255,140,50,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  poolCache = new THREE.CanvasTexture(c)
  poolCache.colorSpace = THREE.SRGBColorSpace
  return poolCache
}

export function Environment() {
  return (
    <group>
      <Sky />
      <Stars radius={180} depth={40} count={1800} factor={5} saturation={0} fade speed={0.3} />
      <Moon />
      <Hills />
      <Town />
      <Sea />
      <StaticBatch>
        <Ground />
        {[-10.5, 12.6].map((x) => (
          <StreetLamp key={x} p={[x, 0, 5.4]} />
        ))}
      </StaticBatch>
      <Lighthouse />
    </group>
  )
}
