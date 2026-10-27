import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useStore } from '../store'
import { LEVEL_Y, ZONES } from '../world/layout'
import { Avatar, moveRequest } from './Avatar'
import { Bloom } from './Bloom'
import { Building } from './Building'
import { CameraRig } from './CameraRig'
import { LiftCamera } from './LiftCamera'
import { Environment } from './Environment'
import { commissionRoom, power } from './power'
import { Rooms } from './rooms'
import { StaticBatch } from './StaticBatch'

/** Runs the light-up sequence for every newly commissioned room */
function Commissioner() {
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  useEffect(() => {
    const done = new Set<string>()
    const run = (ids: string[]) => {
      for (const id of ids) {
        if (done.has(id)) continue
        done.add(id)
        commissionRoom(id as never, reduced)
      }
    }
    run(useStore.getState().commissioned)
    if (useStore.getState().started) {
      done.add('site')
      commissionRoom('site', reduced)
    }
    return useStore.subscribe((s, prev) => {
      if (s.commissioned !== prev.commissioned) run(s.commissioned)
      // energising: the yard's lamps strike just after the flash
      if (s.started && !prev.started && !done.has('site')) {
        done.add('site')
        commissionRoom('site', reduced, 0.5)
      }
      if (s.handoverOpen && !prev.handoverOpen && !done.has('building')) {
        done.add('building')
        commissionRoom('building', reduced)
      }
    })
  }, [reduced])
  return null
}

/** One real light that follows the room you are in: proper falloff where it matters, one light's cost */
function ActiveLight() {
  const ref = useRef<THREE.PointLight>(null)
  const target = useMemo(() => new THREE.Vector3(0, 2.8, -2.5), [])
  useFrame((_, dt) => {
    const l = ref.current
    if (!l) return
    const id = useStore.getState().activeRoom
    const z = id ? ZONES.find((q) => q.id === id) : null
    let k = 0
    if (z && id) {
      const r = z.rect
      const outdoor = id === 'parking' || id === 'boatyard' || id === 'solar'
      target.set((r.x0 + r.x1) / 2, LEVEL_Y[z.level] + (outdoor ? 4.5 : 2.9), outdoor ? 0 : -2.6)
      k = power[id].light
    }
    l.position.lerp(target, 1 - Math.exp(-dt * 4))
    const outdoor = id === 'parking' || id === 'boatyard' || id === 'solar'
    l.intensity += (k * (outdoor ? 16 : 34) - l.intensity) * (1 - Math.exp(-dt * 5))
  })
  return <pointLight ref={ref} color="#ffc68a" intensity={0} distance={12} decay={1.4} position={[0, 2.8, -2.5]} />
}

/** Tap or click the floor to walk there; drags stay with the orbit controls */
function useFloorTap() {
  const down = useRef<{ x: number; y: number; t: number } | null>(null)
  return {
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      down.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, t: performance.now() }
    },
    onPointerUp: (e: ThreeEvent<PointerEvent>) => {
      const d = down.current
      down.current = null
      if (!d) return
      if (Math.hypot(e.nativeEvent.clientX - d.x, e.nativeEvent.clientY - d.y) > 8 || performance.now() - d.t > 600) return
      e.stopPropagation()
      const y = e.point.y
      let level = -1
      LEVEL_Y.forEach((ly, i) => {
        if (Math.abs(y - ly) < 0.45) level = i
      })
      if (level < 0) return
      moveRequest.current?.({ level, x: e.point.x, z: e.point.z })
    },
  }
}

function World({ lift }: { lift: boolean }) {
  const tap = useFloorTap()
  return (
    <group {...(lift ? {} : tap)}>
      <StaticBatch room="building" warmth={0.2} dark={1} lines={0.32}>
        <Building />
      </StaticBatch>
      <Rooms />
      <ActiveLight />
      {!lift && <Avatar />}
    </group>
  )
}

/** Compile every shader off the main thread before the first frame, so the page never freezes */
function Precompile({ onDone }: { onDone: () => void }) {
  const get = useThree((s) => s.get)
  useEffect(() => {
    const { gl, scene, camera } = get()
    let done = false
    const finish = () => {
      if (done) return
      done = true
      onDone()
    }
    // give StaticBatch and the rooms one tick to settle their materials
    const id = window.setTimeout(() => {
      gl.compileAsync(scene, camera).then(finish, finish)
    }, 0)
    const guard = window.setTimeout(finish, 8000)
    return () => {
      window.clearTimeout(id)
      window.clearTimeout(guard)
    }
  }, [get, onDone])
  return null
}

/** lift: the phone version, a camera that rides the scroll instead of an engineer to walk */
export default function Experience({ lift = false }: { lift?: boolean }) {
  const [ready, setReady] = useState(false)
  const setSceneReady = useStore((s) => s.setSceneReady)
  const onReady = useMemo(
    () => () => {
      setReady(true)
      setSceneReady()
    },
    [setSceneReady],
  )
  const [bloom, setBloom] = useState(() => !window.matchMedia('(pointer: coarse)').matches && !location.search.includes('nofx'))
  const setFallback = useStore((s) => s.forceFallback)
  return (
    <Canvas
      className={`!fixed inset-0 transition-opacity duration-1000 ${lift ? 'pointer-events-none' : ''}`}
      style={{ opacity: ready ? 1 : 0 }}
      frameloop={ready ? 'always' : 'never'}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3 }}
      camera={{ fov: 34, near: 0.3, far: 900, position: [14, 18, 42] }}
      onCreated={({ gl, scene }) => {
        if (import.meta.env.DEV || location.search.includes('debug')) Object.assign(window, { __gl: gl, __scene: scene })
        gl.domElement.addEventListener('webglcontextlost', () => setFallback(), { once: true })
      }}
    >
      <color attach="background" args={['#14264a']} />
      <fog attach="fog" args={['#1d3258', 80, 280]} />
      <hemisphereLight args={['#9db8e6', '#2a2f3a', 1.6]} />
      <directionalLight position={[-40, 60, 30]} intensity={1.3} color="#c3d4ef" />
      <ambientLight intensity={0.25} color="#ffc08a" />
      <PerformanceMonitor onDecline={() => setBloom(false)} flipflops={2}>
        <AdaptiveDpr />
        <Suspense fallback={null}>
          <Environment />
          <World lift={lift} />
        </Suspense>
        {lift ? <LiftCamera /> : <CameraRig />}
        <Commissioner />
        <Precompile onDone={onReady} />
        {bloom && <Bloom />}
      </PerformanceMonitor>
    </Canvas>
  )
}
