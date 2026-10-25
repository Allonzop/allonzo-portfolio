import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ROOM_BY_ID, TOUR, type RoomId } from '../content/rooms'
import { useStore } from '../store'
import { BODY, keepRanges, RoomContent, TITLE } from './RoomContent'

const useNarrow = () => {
  const [narrow, set] = useState(() => window.matchMedia('(max-width: 759px)').matches)
  useEffect(() => {
    const m = window.matchMedia('(max-width: 759px)')
    const on = () => set(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return narrow
}

function nextRoom(current: RoomId, done: RoomId[]): RoomId | null {
  const start = TOUR.indexOf(current)
  for (let i = 1; i <= TOUR.length; i++) {
    const id = TOUR[(start + i) % TOUR.length]
    if (!done.includes(id)) return id
  }
  return null
}

export function RoomPanel() {
  const id = useStore((s) => s.activeRoom)
  const open = useStore((s) => s.panelOpen)
  const close = useStore((s) => s.closePanel)
  const done = useStore((s) => s.commissioned)
  const travelTo = useStore((s) => s.travelTo)
  const narrow = useNarrow()
  const reduce = useReducedMotion()
  const [expanded, setExpanded] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setExpanded(false)
    scroller.current?.scrollTo({ top: 0 })
  }, [id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  const room = id ? ROOM_BY_ID[id] : null
  const commissioned = id ? done.includes(id) : false
  const next = id ? nextRoom(id, done) : null

  const from = narrow ? { y: '100%' } : { x: '110%' }
  const to = narrow ? { y: 0 } : { x: 0 }

  return (
    <AnimatePresence>
      {open && room && (
        <motion.aside
          key="panel"
          initial={reduce ? { opacity: 0 } : { ...from, rotate: narrow ? 0 : 2.5 }}
          animate={reduce ? { opacity: 1 } : { ...to, rotate: 0 }}
          exit={reduce ? { opacity: 0 } : { ...from, transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] } }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          style={{ originX: 1, originY: 0 }}
          className={`tag pointer-events-auto absolute flex flex-col overflow-hidden shadow-[0_24px_60px_-18px_rgb(0_0_0/0.85)] ${
            narrow
              ? `inset-x-0 bottom-0 rounded-t-[10px] border-t border-tag-line ${expanded ? 'top-16' : 'h-[58svh]'}`
              : 'top-[5.4rem] right-4 bottom-4 w-[min(30rem,42vw)] rounded-[8px] border-2 border-tag-line'
          }`}
          aria-label={`${room.code}: ${room.title}`}
          role="dialog"
        >
          {/* tag head: reversed band, eyelet, state mark */}
          <header className="relative bg-ink px-5 pt-3 pb-3 text-tag sm:px-6">
            {narrow && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="absolute top-1.5 left-1/2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-[#5d5d5d]"
                aria-label={expanded ? 'Shrink the panel' : 'Expand the panel'}
              />
            )}
            <div className="flex items-center gap-3 pt-1">
              <span aria-hidden className="size-5 shrink-0 rounded-full border-[4px] border-[#5d5d5d] bg-tag" />
              <p className={`engraved flex-1 font-extrabold ${BODY}`}>
                {room.code}
                <span className="mx-2 text-[#8d877a]">·</span>
                <span className={commissioned ? 'text-[#8ee0b0]' : 'text-[#a59f92]'}>{commissioned ? 'Commissioned' : 'Offline'}</span>
              </p>
              <span
                aria-hidden
                className="size-3.5 border-2 border-tag"
                style={{ background: commissioned ? 'var(--color-tag)' : 'transparent', boxShadow: commissioned ? 'inset 0 0 0 2px var(--color-ink)' : undefined }}
              />
              <button
                type="button"
                onClick={close}
                className="-mr-2 grid size-9 place-items-center rounded-[3px] text-tag transition-colors hover:bg-[#2c2c2c]"
                aria-label="Close the panel"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                  <path d="M3 3l10 10M13 3L3 13" />
                </svg>
              </button>
            </div>
          </header>
          <div ref={scroller} className="flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-6 sm:px-6">
            <h2 className={`engraved leading-[0.95] font-extrabold ${TITLE}`} style={{ textTransform: 'none' }}>
              {room.title}
            </h2>
            <p className={`mt-2 text-ink-2 ${BODY}`}>{keepRanges(room.context)}</p>
            <div className="mt-4">
              <RoomContent room={room} live />
            </div>
            {next && (
              <button
                type="button"
                onClick={() => travelTo(next)}
                className={`engraved mt-8 flex w-full items-center justify-between rounded-[3px] bg-ink px-4 py-3 font-extrabold text-tag transition-colors hover:bg-[#2a2a2a] ${BODY}`}
              >
                <span>
                  Next room · {ROOM_BY_ID[next].code}
                </span>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                  <path d="M3 9h12M10 4l5 5-5 5" />
                </svg>
              </button>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
