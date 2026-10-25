import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef, type ReactNode } from 'react'
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
export function StaticBatch({
  children,
  room,
  warmth = 0.5,
  tint = '#ffb36b',
}: {
  children: ReactNode
  room?: RoomId | 'building'
  warmth?: number
  tint?: string
}) {
  const root = useRef<THREE.Group>(null)
  const lit = useRef<{ mat: Lit; base: THREE.Color }[]>([])
  const tintColor = useRef(new THREE.Color(tint))
  const tmp = useRef(new THREE.Color()).current

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

    const added: THREE.Mesh[] = []
    const hidden: THREE.Mesh[] = []
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
        mm.geometry.dispose()
      })
      hidden.forEach((q) => (q.visible = true))
      swapped.forEach(([mesh, orig]) => (mesh.material = orig))
      clones.forEach((c) => c.dispose())
      lit.current = []
    }
  }, [room])

  useFrame(() => {
    if (!room || !lit.current.length) return
    const k = power[room].light * warmth
    for (const { mat, base } of lit.current) {
      // warm light on the surface's own colour, plus a little of the lamp's colour
      mat.emissive.copy(base).multiply(tintColor.current).multiplyScalar(k)
        .add(tmp.copy(tintColor.current).multiplyScalar(k * 0.06))
    }
  })

  return <group ref={root}>{children}</group>
}
