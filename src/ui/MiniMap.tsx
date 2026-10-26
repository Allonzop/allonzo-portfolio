import { useEffect, useRef } from 'react'
import { ROOM_BY_ID, type RoomId } from '../content/rooms'
import { useStore } from '../store'
import { avatarState } from '../world/avatarState'

/**
 * A synoptic of the plant, drawn as its cutaway section: roof, level 1,
 * ground, with the car park and the boatyard either side. Click a room to walk there.
 */
const CELLS: { id: RoomId; x: number; y: number; w: number; h: number }[] = [
  { id: 'solar', x: 44, y: 6, w: 92, h: 16 },
  { id: 'studio', x: 44, y: 24, w: 45, h: 24 },
  { id: 'arcade', x: 91, y: 24, w: 45, h: 24 },
  { id: 'plant', x: 44, y: 50, w: 29.3, h: 24 },
  { id: 'lab', x: 75.3, y: 50, w: 29.3, h: 24 },
  { id: 'control', x: 106.6, y: 50, w: 29.4, h: 24 },
  { id: 'parking', x: 4, y: 50, w: 36, h: 24 },
  { id: 'boatyard', x: 140, y: 50, w: 36, h: 24 },
]

const LEVEL_FLOOR = [74, 48, 22]

/** Short engraved labels that fit the synoptic cells */
const SHORT: Record<RoomId, string> = {
  solar: 'ROOF',
  studio: 'STUDIO',
  arcade: 'ARCADE',
  plant: 'PLANT',
  lab: 'LAB',
  control: 'CTRL',
  parking: 'PARK',
  boatyard: 'YARD',
}

/** World x (−27…27) to map x, piecewise so the building gets most of the width */
const mapX = (x: number) => {
  if (x < -11) return 4 + ((x + 27) / 16) * 36
  if (x > 12.5) return 140 + ((x - 12.5) / 14.5) * 36
  return 40 + ((x + 11) / 23.5) * 100
}

export function MiniMap() {
  const done = useStore((s) => s.commissioned)
  const active = useStore((s) => s.activeRoom)
  const travelTo = useStore((s) => s.travelTo)
  const dot = useRef<SVGGElement>(null)

  // follow the engineer without re-rendering React every frame
  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (dot.current) {
        const a = avatarState
        const x = mapX(a.x)
        const floor = a.riding ? LEVEL_FLOOR[0] - ((a.y - 0) / 7.2) * (LEVEL_FLOOR[0] - LEVEL_FLOOR[2]) : LEVEL_FLOOR[a.level]
        dot.current.setAttribute('transform', `translate(${x.toFixed(1)} ${(floor - 4).toFixed(1)})`)
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <nav className="plate screws pointer-events-auto px-6 pt-2 pb-2" aria-label="Mini-map: walk to a room">
      <p className="engraved mb-1 text-center text-[0.8rem] font-bold whitespace-nowrap text-[#a59f92] max-sm:hidden">Synoptic · tap a room</p>
      <svg viewBox="0 0 180 80" className="block w-[18rem] max-sm:w-[12.5rem]" role="list">
        {/* ground line and the quay */}
        <line x1="2" y1="76" x2="178" y2="76" stroke="#2f6f95" strokeWidth="1" />
        {CELLS.map((c) => {
          const on = done.includes(c.id)
          const isActive = active === c.id
          const room = ROOM_BY_ID[c.id]
          return (
            <g
              key={c.id}
              role="listitem"
              tabIndex={0}
              aria-label={`${room.code}: ${room.title}, ${on ? 'commissioned' : 'offline'}. Walk there.`}
              className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-sodium"
              onClick={() => travelTo(c.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  travelTo(c.id)
                }
              }}
            >
              <rect
                x={c.x}
                y={c.y}
                width={c.w}
                height={c.h}
                fill={on ? 'rgba(255,176,74,0.3)' : 'rgba(94,200,255,0.06)'}
                stroke={isActive ? '#ffb04a' : on ? '#ffcf8a' : '#5ec8ff'}
                strokeWidth={isActive ? 2 : 1.2}
              />
              {/* state mark: hollow offline, filled commissioned */}
              <rect x={c.x + 3} y={c.y + 3} width={5} height={5} fill={on ? '#ffcf8a' : 'none'} stroke={on ? '#ffcf8a' : '#5ec8ff'} strokeWidth={1} />
              <text
                x={c.x + 10}
                y={c.y + 8.2}
                fill={on ? '#f1ede2' : '#8fd8ff'}
                style={{ font: '700 6.4px "Archivo Variable", sans-serif', fontStretch: '75%', letterSpacing: '0.02em' }}
              >
                {SHORT[c.id]}
              </text>
            </g>
          )
        })}
        <g ref={dot} pointerEvents="none">
          <circle r="3.4" fill="#ff7a1a" stroke="#141414" strokeWidth="1.2" />
        </g>
      </svg>
    </nav>
  )
}
