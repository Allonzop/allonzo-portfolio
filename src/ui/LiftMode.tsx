import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PROFILE } from '../content/profile'
import { ROOM_BY_ID, ROOMS, type RoomId } from '../content/rooms'
import { DESCENT, liftScroll } from '../three/LiftCamera'
import { useStore } from '../store'
import { ContactActions, PathList } from './Contact'
import { SoundIcon } from './Hud'
import { Intro } from './Intro'
import { BODY, Dash, keepRanges, RoomContent, TITLE } from './RoomContent'
import { useAmbientSound } from './sound'
import { Toasts } from './Toasts'

/** What the car's indicator shows at each stop */
const FLOOR: Record<RoomId, string> = {
  solar: 'R',
  studio: '1',
  arcade: '1',
  control: 'G',
  lab: 'G',
  plant: 'G',
  parking: 'P',
  boatyard: 'Q',
}

/** One stop: the room framed above, its tag rising from below */
function Stop({ id, setRef }: { id: RoomId; setRef: (el: HTMLElement | null) => void }) {
  const room = ROOM_BY_ID[id]
  const on = useStore((s) => s.commissioned.includes(id))
  return (
    <section ref={setRef} aria-label={`${room.code}: ${room.title}`}>
      {/* the shot: the room fills the upper screen while this passes */}
      <div aria-hidden className="h-[74svh]" />
      <article data-tag className="tag mx-3 overflow-hidden rounded-[8px] border-2 border-tag-line shadow-[0_-18px_50px_-20px_rgb(0_0_0/0.9)]">
        <header className="flex items-center gap-3 bg-ink px-5 py-3 text-tag">
          <span aria-hidden className="size-5 shrink-0 rounded-full border-[4px] border-[#5d5d5d] bg-tag" />
          <p className={`engraved flex-1 font-extrabold ${BODY}`}>
            {room.code}
            <span className="mx-2 text-[#8d877a]">·</span>
            <span className={on ? 'text-[#8ee0b0]' : 'text-[#a59f92]'}>{on ? 'Commissioned' : 'Offline'}</span>
          </p>
          <span
            aria-hidden
            className="size-3.5 border-2 border-tag"
            style={{ background: on ? 'var(--color-tag)' : 'transparent', boxShadow: on ? 'inset 0 0 0 2px var(--color-ink)' : undefined }}
          />
        </header>
        <div className="px-5 pt-5 pb-6">
          <h2 className={`engraved leading-[0.95] font-extrabold ${TITLE}`} style={{ textTransform: 'none' }}>
            {room.title}
          </h2>
          <p className={`mt-2 text-ink-2 ${BODY}`}>{keepRanges(room.context)}</p>
          <div className="mt-4">
            <RoomContent room={room} live />
          </div>
        </div>
      </article>
    </section>
  )
}

/** The car's indicator: floor, room and how much of the plant is live */
function LiftBar({ stop }: { stop: number }) {
  const done = useStore((s) => s.commissioned.length)
  const xp = useStore((s) => s.xp)
  const sound = useStore((s) => s.sound)
  const toggleSound = useStore((s) => s.toggleSound)
  const setMode = useStore((s) => s.setMode)
  const reduce = useReducedMotion()
  const id = stop >= 0 && stop < DESCENT.length ? DESCENT[stop] : null
  const floor = id ? FLOOR[id] : stop >= DESCENT.length ? '✓' : '▼'
  const label = id ? ROOM_BY_ID[id].code : stop >= DESCENT.length ? 'Handover' : 'Plant'
  return (
    <motion.div
      className="fixed inset-x-3 top-3 z-20 flex items-stretch gap-2"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0, transition: { delay: reduce ? 0 : 1.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}
    >
      <div className="plate flex min-w-0 flex-1 items-center gap-3 py-1.5 pr-3 pl-1.5" role="status" aria-live="polite">
        {/* the floor indicator, lit like a lift's */}
        <span className="reading grid h-10 min-w-10 place-items-center rounded-[3px] bg-[#05080d] px-1.5 text-[1.35rem] font-bold text-sodium shadow-[inset_0_0_0_1px_#2c2c2c]">
          {floor}
        </span>
        <span className="min-w-0 flex-1">
          <span className="engraved block truncate text-[0.82rem] leading-tight font-extrabold">{label}</span>
          <span className="reading block text-[0.78rem] leading-tight text-[#c9c3b4]">
            {done}/{ROOMS.length} live · <span className="text-sodium">{xp} XP</span>
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={toggleSound}
        aria-pressed={sound}
        aria-label={sound ? 'Turn ambient sound off' : 'Turn ambient sound on'}
        className="plate grid w-12 place-items-center text-engrave"
      >
        <SoundIcon on={sound} />
      </button>
      <button
        type="button"
        onClick={() => setMode('list')}
        className="engraved rounded-[6px] border-2 border-[#d6cfbd] bg-tag px-3 text-[0.8rem] font-extrabold text-ink shadow-[0_6px_18px_-6px_rgb(0_0_0/0.7)]"
      >
        List
      </button>
    </motion.div>
  )
}

/** The last stop: the plant handed over, and how to reach its engineer */
function HandoverFloor({ setRef }: { setRef: (el: HTMLElement | null) => void }) {
  const done = useStore((s) => s.commissioned.length)
  const complete = done === ROOMS.length
  return (
    <section ref={setRef} aria-labelledby="lift-handover">
      <div aria-hidden className="h-[60svh]" />
      <article className="tag mx-3 overflow-hidden rounded-[8px] border-2 border-tag-line">
        <header className="flex items-center gap-3 bg-ink px-5 py-3 text-tag">
          <span aria-hidden className="size-5 shrink-0 rounded-full border-[4px] border-[#5d5d5d] bg-tag" />
          <p className={`engraved flex-1 font-extrabold ${BODY}`}>
            Handover · {done}/{ROOMS.length} rooms
          </p>
        </header>
        <div className={`px-5 pt-5 pb-6 leading-relaxed ${BODY}`}>
          <h2 id="lift-handover" className={`engraved leading-[0.95] font-extrabold ${TITLE}`} style={{ textTransform: 'none' }}>
            {complete ? 'The plant is handed over' : 'Handover, in progress'}
          </h2>
          <p className="mt-3">
            <span className="font-bold">{PROFILE.name}</span>
            <br />
            <span className="text-ink-2">
              {PROFILE.title} · {PROFILE.subtitle}
            </span>
          </p>
          <ul className="mt-4 space-y-1">
            {PROFILE.availability.map((a) => (
              <li key={a} className="relative pl-5">
                <Dash />
                {a}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <ContactActions />
          </div>
          <h3 className="engraved mt-7 mb-2 border-b-2 border-ink pb-1 font-extrabold">Path</h3>
          <PathList />
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`engraved mt-7 flex w-full items-center justify-center gap-2 rounded-[3px] bg-ink px-4 py-3 font-extrabold text-tag ${BODY}`}
          >
            Back up to the roof
          </button>
        </div>
      </article>
      <div aria-hidden className="h-[18svh]" />
    </section>
  )
}

/**
 * The phone version: no walking. The visitor scrolls and the lift rides down through
 * the plant, floor by floor; each room switches on as it comes into frame.
 */
export default function LiftMode() {
  useAmbientSound()
  const started = useStore((s) => s.started)
  const reduce = useReducedMotion()
  const stops = useRef<(HTMLElement | null)[]>([])
  const main = useRef<HTMLElement>(null)
  const [stop, setStop] = useState(-1)
  const [scrolled, setScrolled] = useState(false)

  // nothing scrolls until the plant is energised
  useLayoutEffect(() => {
    document.documentElement.style.overflow = started ? '' : 'hidden'
    if (!started) window.scrollTo(0, 0)
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [started])

  useEffect(() => {
    if (!started) return
    let marks: { s: number; shot: number }[] = []
    let enter: number[] = []
    let current: RoomId | null | undefined
    let lastStop = -2

    // keyframes: arrive at a room as its stop reaches the top, hold while its tag passes, then ride on
    const measure = () => {
      const vh = window.innerHeight
      const top = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY
      marks = [{ s: 0, shot: 0 }]
      enter = []
      DESCENT.forEach((_, i) => {
        const el = stops.current[i]
        if (!el) return
        const t = top(el)
        marks.push({ s: t, shot: i + 1 })
        marks.push({ s: Math.max(t, t + el.offsetHeight - vh), shot: i + 1 })
        enter.push(t - vh * 0.45)
      })
      const end = stops.current[DESCENT.length]
      if (end) marks.push({ s: top(end), shot: 0 })
    }

    const onScroll = () => {
      const y = window.scrollY
      let a = marks[marks.length - 1]
      let b = a
      for (let i = 0; i < marks.length - 1; i++) {
        if (y < marks[i + 1].s) {
          a = marks[i]
          b = marks[i + 1]
          break
        }
      }
      liftScroll.a = a.shot
      liftScroll.b = b.shot
      liftScroll.t = b.s > a.s ? (y - a.s) / (b.s - a.s) : 0

      // which stop the car is at: the last one whose room has come into frame
      let k = -1
      enter.forEach((e, i) => {
        if (y >= e) k = i
      })
      const end = stops.current[DESCENT.length]
      if (end && y >= end.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.4) k = DESCENT.length
      // a fast fling may skip a stop: every room the car has passed is live
      const st = useStore.getState()
      for (let i = 0; i <= Math.min(k, DESCENT.length - 1); i++) if (!st.commissioned.includes(DESCENT[i])) st.enterRoom(DESCENT[i])
      if (k !== lastStop) {
        lastStop = k
        setStop(k)
        const id = k >= 0 && k < DESCENT.length ? DESCENT[k] : null
        if (id !== current || useStore.getState().activeRoom !== id) {
          current = id
          useStore.getState().enterRoom(id)
        }
      }
      setScrolled(y > 40)
    }

    measure()
    onScroll()
    const ro = new ResizeObserver(() => {
      measure()
      onScroll()
    })
    // images and fonts landing move every stop: re-measure whenever the shaft changes height
    if (main.current) ro.observe(main.current)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [started])

  return (
    <>
      {started && <LiftBar stop={stop} />}
      <div className="pointer-events-none fixed inset-0 z-20 [&>ol]:!top-[5.2rem]">
        <Toasts rooms={false} />
      </div>
      <main ref={main} className="relative z-10" aria-label="The plant, floor by floor">
        {/* the establishing shot */}
        <div className="relative h-[100svh]">
          {started && (
            <motion.p
              className="engraved absolute inset-x-0 bottom-8 flex flex-col items-center gap-1 text-[0.86rem] font-extrabold text-engrave"
              initial={{ opacity: 0 }}
              animate={{ opacity: scrolled ? 0 : 1, transition: { delay: scrolled ? 0 : 2, duration: 0.5 } }}
              aria-hidden={scrolled}
            >
              Scroll to ride down
              <motion.svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                stroke="var(--color-sodium)"
                strokeWidth="2.4"
                aria-hidden
                animate={reduce ? undefined : { y: [0, 6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <path d="M4 8l7 7 7-7" />
              </motion.svg>
            </motion.p>
          )}
        </div>
        {started &&
          DESCENT.map((id, i) => (
            <Stop
              key={id}
              id={id}
              setRef={(el) => {
                stops.current[i] = el
              }}
            />
          ))}
        {started && (
          <HandoverFloor
            setRef={(el) => {
              stops.current[DESCENT.length] = el
            }}
          />
        )}
      </main>
      <Intro />
    </>
  )
}
