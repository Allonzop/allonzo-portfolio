import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { RoomId } from '../content/rooms'
import { power } from './power'

type Lit = THREE.MeshLambertMaterial | THREE.MeshStandardMaterial

/**
 * Merges every static mesh under it into one draw call per material.
 * The originals stay in the graph, hidden, so pointer events still hit them.
 * Anything under a node with userData.dynamic keeps its own draw call.
 *
 * With a room, the batch also gets that room's baked light: its surfaces glow
 * warm in step with the commissioning, instead of paying for point lights.
 */
/** Offline, a room is still a drawing: cyan linework on blueprint blue */
const INK = new THREE.Color('#5ec8ff')
const PAPER = new THREE.Color('#0b2a52')

export function StaticBatch({
  children,
  room,
  warmth = 0.5,
  tint = '#ffb36b',
  dark = 0.2,
  lines = 1,
}: {
  children: ReactNode
  room?: RoomId | 'building'
  warmth?: number
  tint?: string
  /** how much of its own colour an offline surface keeps: offline rooms read dark, commissioning is the reveal */
  dark?: number
  /** strength of the blueprint linework while the room is offline */
  lines?: number
}) {
  const root = useRef<THREE.Group>(null)
  const lit = useRef<{ mat: Lit; base: THREE.Color }[]>([])
  const tintColor = useRef(new THREE.Color(tint))
  const tmp = useRef(new THREE.Color()).current
  const lineMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: INK,
        transparent: true,
        opacity: lines,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        fog: true,
      }),
    [lines],
  )

  useLayoutEffect(() => {
    const g = root.current
    if (!g) return
    g.updateMatrixWorld(true)
    const inv = new THREE.Matrix4().copy(g.matrixWorld).invert()
    const groups = new Map<string, { material: THREE.Material; geos: THREE.BufferGeometry[]; meshes: THREE.Mesh[] }>()
    const clones = new Map<string, Lit>()
    const swapped: [THREE.Mesh, THREE.Material][] = []

    const isDynamic = (o: THREE.Object3D) => {
      for (let p: THREE.Object3D | null = o; p && p !== g; p = p.parent) if (p.userData.dynamic) return true
      return false
    }
    const litSignature = (m: THREE.Material) => {
      if (m instanceof THREE.MeshLambertMaterial && !m.map && !m.transparent) return `L${m.color.getHexString()}${m.side}${m.vertexColors}`
      if (m instanceof THREE.MeshStandardMaterial && !m.map && !m.transparent)
        return `S${m.color.getHexString()}${m.side}${m.roughness}${m.metalness}${m.vertexColors}`
      return null
    }

    // one material per colour inside this batch, so the room's light can drive it
    g.traverse((o) => {
      const mesh = o as THREE.Mesh
      // instanced and vertex-coloured meshes carry their colour per instance or per vertex: emissive would flatten it
      if (!mesh.isMesh || Array.isArray(mesh.material) || (mesh as THREE.InstancedMesh).isInstancedMesh) return
      if ((mesh.material as THREE.Material & { vertexColors?: boolean }).vertexColors) return
      const sig = litSignature(mesh.material as THREE.Material)
      if (!sig) return
      let c = clones.get(sig)
      if (!c) {
        c = (mesh.material as Lit).clone()
        clones.set(sig, c)
      }
      swapped.push([mesh, mesh.material as THREE.Material])
      mesh.material = c
    })
    lit.current = room ? [...clones.values()].map((mat) => ({ mat, base: mat.color.clone() })) : []

    g.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh || (mesh as THREE.InstancedMesh).isInstancedMesh || !mesh.visible) return
      const mat = mesh.material as THREE.Material
      if (Array.isArray(mat) || (mat as THREE.MeshBasicMaterial).map || mat.transparent) return
      if (isDynamic(mesh)) return
      const geo = mesh.geometry
      const attrs = Object.keys(geo.attributes).sort().join(',')
      const key = `${mat.uuid}|${attrs}|${geo.index ? 'i' : 'n'}`
      const m = new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld)
      let entry = groups.get(key)
      if (!entry) groups.set(key, (entry = { material: mat, geos: [], meshes: [] }))
      entry.geos.push(geo.clone().applyMatrix4(m))
      entry.meshes.push(mesh)
    })

    const added: THREE.Object3D[] = []
    const hidden: THREE.Mesh[] = []

    // the drawing: hard edges of everything static in the room, one draw call
    if (room && lines > 0) {
      const edges: THREE.BufferGeometry[] = []
      for (const { geos } of groups.values()) for (const q of geos) edges.push(new THREE.EdgesGeometry(q, 28))
      const merged = edges.length ? mergeGeometries(edges, false) : null
      edges.forEach((q) => q.dispose())
      if (merged) {
        const ls = new THREE.LineSegments(merged, lineMat)
        ls.raycast = () => {}
        ls.matrixAutoUpdate = false
        ls.renderOrder = 2
        g.add(ls)
        added.push(ls)
      }
    }

    for (const { material, geos, meshes } of groups.values()) {
      if (meshes.length < 2) {
        geos.forEach((q) => q.dispose())
        continue
      }
      const merged = mergeGeometries(geos, false)
      geos.forEach((q) => q.dispose())
      if (!merged) continue
      const mm = new THREE.Mesh(merged, material)
      mm.raycast = () => {}
      mm.matrixAutoUpdate = false
      g.add(mm)
      added.push(mm)
      meshes.forEach((q) => {
        q.visible = false
        hidden.push(q)
      })
    }
    return () => {
      added.forEach((mm) => {
        g.remove(mm)
        ;(mm as THREE.Mesh).geometry.dispose()
      })
      hidden.forEach((q) => (q.visible = true))
      swapped.forEach(([mesh, orig]) => (mesh.material = orig))
      clones.forEach((c) => c.dispose())
      lit.current = []
    }
  }, [room, lines, lineMat])

  useEffect(() => () => lineMat.dispose(), [lineMat])

  useFrame(() => {
    if (!room) return
    const l = power[room].light
    // the linework hands over to the light: it flickers out as the tubes flicker on
    lineMat.opacity = lines * (1 - l) * (1 - l)
    lineMat.visible = lineMat.opacity > 0.01
    if (!lit.current.length) return
    const k = l * warmth
    const keep = dark + (1 - dark) * l
    const paper = (1 - l) * 0.55 * Math.min(1, lines)
    for (const { mat, base } of lit.current) {
      mat.color.copy(base).multiplyScalar(keep)
      // warm light on the surface's own colour, plus a little of the lamp's colour; offline, the blue of the drawing
      mat.emissive.copy(base).multiply(tintColor.current).multiplyScalar(k)
        .add(tmp.copy(tintColor.current).multiplyScalar(k * 0.06))
        .add(tmp.copy(PAPER).multiplyScalar(paper))
    }
  })

  return <group ref={root}>{children}</group>
}
