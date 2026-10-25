import type { RoomId } from '../../content/rooms'
import { Box, Fixture, LightPool, type V3 } from '../common'

/** Floor and wall finishes, ceiling battens and the room's own light */
export function Shell({
  id,
  x0,
  x1,
  y,
  floor,
  wall,
  battens = 2,
  light = 26,
}: {
  id: RoomId
  x0: number
  x1: number
  y: number
  floor: string
  wall: string
  battens?: number
  light?: number
}) {
  const cx = (x0 + x1) / 2
  const w = x1 - x0
  const ceiling = y + 3.28
  const fixtures: V3[] = []
  for (let i = 0; i < battens; i++) {
    const fx = x0 + (w * (i + 0.5)) / battens
    fixtures.push([fx, ceiling - 0.12, -3.6], [fx, ceiling - 0.12, -1.4])
  }
  return (
    <group>
      <Box p={[cx, y + 0.012, -3]} s={[w, 0.02, 6]} c={floor} />
      <Box p={[cx, y + 1.65, -5.985]} s={[w, 3.3, 0.02]} c={wall} />
      {/* skirting */}
      <Box p={[cx, y + 0.06, -5.97]} s={[w, 0.12, 0.03]} c="#24272c" />
      {fixtures.map((p, i) => (
        <Fixture key={i} id={id} p={p} />
      ))}
      {/* light spilling out of the open front onto the plaza */}
      {y === 0 && <LightPool id={id} p={[cx, 0.02, 2.2]} size={[w * 1.25, 5.5]} strength={0.32 * (light / 26)} />}
    </group>
  )
}
