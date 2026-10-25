import { LEVEL_Y, LIFT, OBSTACLES, WALKABLE, inRect } from './layout'

/** Grid the engineer walks on: 0.4 m cells, one layer per level */
export const CELL = 0.4
const X0 = -27.2
const Z0 = -7.2
export const NX = Math.ceil((27.4 - X0) / CELL)
export const NZ = Math.ceil((6.4 - Z0) / CELL)
const LEVELS = LEVEL_Y.length
const RADIUS = 0.28

const grid = new Uint8Array(LEVELS * NX * NZ)
const idx = (l: number, i: number, k: number) => (l * NZ + k) * NX + i

export const cellCenter = (i: number, k: number) => ({ x: X0 + (i + 0.5) * CELL, z: Z0 + (k + 0.5) * CELL })
export const toCell = (x: number, z: number) => ({
  i: Math.max(0, Math.min(NX - 1, Math.floor((x - X0) / CELL))),
  k: Math.max(0, Math.min(NZ - 1, Math.floor((z - Z0) / CELL))),
})

for (let l = 0; l < LEVELS; l++) {
  for (let k = 0; k < NZ; k++) {
    for (let i = 0; i < NX; i++) {
      const c = cellCenter(i, k)
      const ok =
        WALKABLE.some((w) => w.level === l && inRect(c, w)) &&
        !OBSTACLES.some((o) => o.level === l && inRect(c, o, RADIUS))
      grid[idx(l, i, k)] = ok ? 1 : 0
    }
  }
}

export const walkable = (level: number, x: number, z: number) => {
  if (x < X0 || z < Z0) return false
  const { i, k } = toCell(x, z)
  return grid[idx(level, i, k)] === 1
}

/** Continuous check for keyboard movement: the body circle must sit on walkable ground */
export const canStand = (level: number, x: number, z: number) => {
  const p = RADIUS * 0.7
  return (
    walkable(level, x, z) &&
    walkable(level, x + p, z) &&
    walkable(level, x - p, z) &&
    walkable(level, x, z + p) &&
    walkable(level, x, z - p)
  )
}

export const onLiftPad = (x: number, z: number) => inRect({ x, z }, LIFT)

export type Waypoint = { level: number; x: number; z: number; lift?: boolean }

/** Nearest walkable cell to a point, spiralling out */
const nearest = (level: number, x: number, z: number) => {
  const c = toCell(x, z)
  for (let rad = 0; rad < 12; rad++) {
    for (let dk = -rad; dk <= rad; dk++) {
      for (let di = -rad; di <= rad; di++) {
        if (Math.max(Math.abs(di), Math.abs(dk)) !== rad) continue
        const i = c.i + di
        const k = c.k + dk
        if (i < 0 || k < 0 || i >= NX || k >= NZ) continue
        if (grid[idx(level, i, k)]) return { i, k }
      }
    }
  }
  return null
}

const liftCell = toCell(LIFT.center.x, LIFT.center.z)

/** A* across all levels; the lift links the pads of every level */
export const findPath = (from: Waypoint, to: Waypoint): Waypoint[] | null => {
  const s = nearest(from.level, from.x, from.z)
  const g = nearest(to.level, to.x, to.z)
  if (!s || !g) return null
  const start = idx(from.level, s.i, s.k)
  const goal = idx(to.level, g.i, g.k)
  const size = grid.length
  const cost = new Float32Array(size).fill(Infinity)
  const came = new Int32Array(size).fill(-1)
  const closed = new Uint8Array(size)
  // binary heap of [f, node]
  const heap: number[][] = []
  const push = (f: number, n: number) => {
    heap.push([f, n])
    let j = heap.length - 1
    while (j > 0) {
      const p = (j - 1) >> 1
      if (heap[p][0] <= heap[j][0]) break
      ;[heap[p], heap[j]] = [heap[j], heap[p]]
      j = p
    }
  }
  const pop = () => {
    const top = heap[0]
    const last = heap.pop()!
    if (heap.length) {
      heap[0] = last
      let j = 0
      for (;;) {
        const a = 2 * j + 1
        const b = a + 1
        let m = j
        if (a < heap.length && heap[a][0] < heap[m][0]) m = a
        if (b < heap.length && heap[b][0] < heap[m][0]) m = b
        if (m === j) break
        ;[heap[m], heap[j]] = [heap[j], heap[m]]
        j = m
      }
    }
    return top
  }
  const h = (n: number) => {
    const l = Math.floor(n / (NX * NZ))
    const rem = n - l * NX * NZ
    const k = Math.floor(rem / NX)
    const i = rem - k * NX
    const gl = to.level
    if (l === gl) return Math.hypot(i - g.i, k - g.k)
    return Math.hypot(i - liftCell.i, k - liftCell.k) + Math.hypot(g.i - liftCell.i, g.k - liftCell.k) + 6
  }
  cost[start] = 0
  push(h(start), start)
  const SQ2 = Math.SQRT2
  while (heap.length) {
    const [, n] = pop()
    if (n === goal) break
    if (closed[n]) continue
    closed[n] = 1
    const l = Math.floor(n / (NX * NZ))
    const rem = n - l * NX * NZ
    const k = Math.floor(rem / NX)
    const i = rem - k * NX
    for (let dk = -1; dk <= 1; dk++) {
      for (let di = -1; di <= 1; di++) {
        if (!di && !dk) continue
        const ni = i + di
        const nk = k + dk
        if (ni < 0 || nk < 0 || ni >= NX || nk >= NZ) continue
        const m = idx(l, ni, nk)
        if (!grid[m]) continue
        // no corner cutting
        if (di && dk && (!grid[idx(l, i + di, k)] || !grid[idx(l, i, k + dk)])) continue
        const c = cost[n] + (di && dk ? SQ2 : 1)
        if (c < cost[m]) {
          cost[m] = c
          came[m] = n
          push(c + h(m), m)
        }
      }
    }
    if (i === liftCell.i && k === liftCell.k) {
      for (let ol = 0; ol < LEVELS; ol++) {
        if (ol === l) continue
        const m = idx(ol, i, k)
        const c = cost[n] + 6 + Math.abs(ol - l) * 2
        if (grid[m] && c < cost[m]) {
          cost[m] = c
          came[m] = n
          push(c + h(m), m)
        }
      }
    }
  }
  if (came[goal] === -1 && goal !== start) return null
  const nodes: number[] = []
  for (let n = goal; n !== -1; n = came[n]) nodes.push(n)
  nodes.reverse()
  const out: Waypoint[] = []
  let prevLevel = from.level
  for (const n of nodes) {
    const l = Math.floor(n / (NX * NZ))
    const rem = n - l * NX * NZ
    const k = Math.floor(rem / NX)
    const i = rem - k * NX
    const c = cellCenter(i, k)
    out.push({ level: l, x: c.x, z: c.z, lift: l !== prevLevel })
    prevLevel = l
  }
  return simplify(out)
}

/** Drop waypoints on straight runs, keep lift rides and turns */
const simplify = (pts: Waypoint[]) => {
  if (pts.length < 3) return pts
  const out: Waypoint[] = [pts[0]]
  for (let j = 1; j < pts.length - 1; j++) {
    const a = out[out.length - 1]
    const b = pts[j]
    const c = pts[j + 1]
    if (b.lift || c.lift || a.level !== c.level) {
      out.push(b)
      continue
    }
    if (lineClear(a, c)) continue
    out.push(b)
  }
  out.push(pts[pts.length - 1])
  return out
}

const lineClear = (a: Waypoint, b: Waypoint) => {
  const d = Math.hypot(b.x - a.x, b.z - a.z)
  const steps = Math.ceil(d / (CELL * 0.5))
  for (let s = 1; s < steps; s++) {
    const t = s / steps
    if (!canStand(a.level, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false
  }
  return true
}
