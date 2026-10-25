import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ROOMS } from '../content/rooms'
import { PROFILE } from '../content/profile'
import { useStore } from '../store'
import { Handover } from './Handover'
import { MiniMap } from './MiniMap'
import { RoomPanel } from './RoomPanel'
import { useAmbientSound } from './sound'
import { Toasts } from './Toasts'

function Mark({ on, size = 10 }: { on: boolean; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 border-2 border-engrave"
      style={{ width: size, height: size, background: on ? 'var(--color-engrave)' : 'transparent', boxShadow: on ? 'inset 0 0 0 1.5px var(--color-plate)' : undefined }}
    />
  )
}

function Identity() {
  return (
    <div className="plate screws pointer-events-auto px-5 pt-3 pb-2.5 max-sm:px-4 max-sm:pt-2.5">
      <p className="engraved text-[1.05rem] leading-none font-extrabold max-sm:text-[0.8rem] max-sm:whitespace-nowrap">{PROFILE.name}</p>
      <p className="engraved mt-1 text-[0.72rem] leading-tight font-semibold text-[#c9c3b4] max-sm:hidden">{PROFILE.title}</p>
    </div>
  )
}

function Progress() {
  const done = useStore((s) => s.commissioned)
  const xp = useStore((s) => s.xp)
  const reduce = useReducedMotion()
  return (
    <div className="plate screws pointer-events-auto flex items-center gap-4 px-5 py-2.5 max-sm:gap-3 max-sm:px-4">
      <div>
        <p className="engraved text-[0.72rem] leading-none font-bold text-[#c9c3b4]">
          <span className="max-sm:hidden">Building commissioning</span>
          <span className="sm:hidden">Commissioned</span>
        </p>
        <div className="mt-1.5 flex items-center gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={ROOMS.length} aria-valuenow={done.length} aria-label="Rooms commissioned">
          {ROOMS.map((r, i) => (
            <span key={r.id} className="relative block h-2.5 w-5 border border-[#6d6a62] max-sm:w-3.5">
              <motion.span
                className="absolute inset-0 bg-sodium"
                initial={false}
                animate={{ scaleX: i < done.length ? 1 : 0 }}
                transition={{ duration: reduce ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ originX: 0 }}
              />
            </span>
          ))}
        </div>
      </div>
      <p className="reading text-[1.15rem] leading-none text-engrave">
        {done.length}/{ROOMS.length}
      </p>
      <span className="h-7 w-px bg-[#3a3a3a]" />
      <p className="reading text-[1.15rem] leading-none text-sodium" aria-label={`${xp} experience points`}>
        {xp}
        <span className="ml-1 text-[0.7rem] text-[#c9c3b4]">XP</span>
      </p>
    </div>
  )
}

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden>
      <path d="M4 9h4l5-4v14l-5-4H4z" />
      {on ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="M17 9l5 6M22 9l-5 6" />}
    </svg>
  )
}

function Controls() {
  const setMode = useStore((s) => s.setMode)
  const sound = useStore((s) => s.sound)
  const toggleSound = useStore((s) => s.toggleSound)
  return (
    <div className="pointer-events-auto flex items-stretch gap-2">
      <button
        type="button"
        onClick={toggleSound}
        aria-pressed={sound}
        aria-label={sound ? 'Turn ambient sound off' : 'Turn ambient sound on'}
        className="plate grid w-11 place-items-center text-engrave transition-colors hover:bg-[#222]"
      >
        <SoundIcon on={sound} />
      </button>
      <button
        type="button"
        onClick={() => setMode('list')}
        className="engraved rounded-[6px] border-2 border-[#d6cfbd] bg-tag px-4 text-[0.88rem] font-extrabold whitespace-nowrap text-ink shadow-[0_6px_18px_-6px_rgb(0_0_0/0.7)] transition-colors hover:bg-white max-sm:px-3 max-sm:text-[0.76rem]"
      >
        Skip the game
      </button>
    </div>
  )
}

/** Live BMS readings: simulated, rising as rooms come online */
function Readings() {
  const n = useStore((s) => s.commissioned.length)
  const [t, setT] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setT((v) => v + 1), 1000)
    return () => window.clearInterval(id)
  }, [])
  const s = Math.sin(t * 0.7)
  const temp = (n ? 20.6 + n * 0.12 : 16.8) + s * 0.1
  const co2 = Math.round((n ? 520 + n * 18 : 430) + Math.sin(t * 0.37) * 9)
  const kw = n ? 4.2 + n * 6.4 + Math.sin(t * 1.3) * 0.6 : 0.4 + Math.abs(s) * 0.1
  const rows: [string, string, string][] = [
    ['T', temp.toFixed(1), '°C'],
    ['CO₂', String(co2), 'ppm'],
    ['P', kw.toFixed(1), 'kW'],
  ]
  return (
    <div className="plate screws pointer-events-auto px-4 pt-6 pb-3 max-sm:hidden" aria-label="Simulated building readings">
      <p className="engraved absolute top-2 left-1/2 -translate-x-1/2 text-[0.62rem] font-bold whitespace-nowrap text-[#a59f92]">BMS · sim</p>
      <dl className="reading grid grid-cols-[auto_auto_auto] items-baseline gap-x-2.5 gap-y-1 text-[0.95rem]">
        {rows.map(([k, v, u]) => (
          <div key={k} className="contents">
            <dt className="text-[#a59f92]">{k}</dt>
            <dd className="text-right text-reading">{v}</dd>
            <dd className="text-[0.72rem] text-[#a59f92]">{u}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function LiftControl() {
  const onLift = useStore((s) => s.onLift)
  const level = useStore((s) => s.level)
  const request = useStore((s) => s.requestLift)
  const levels = ['G', '1', 'Roof']
  return (
    <AnimatePresence>
      {onLift && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="plate screws pointer-events-auto flex items-center gap-2 px-4 py-2.5"
          role="group"
          aria-label="Lift"
        >
          <span className="engraved mr-1 text-[0.78rem] font-bold text-[#c9c3b4]">Lift</span>
          {levels.map((l, i) => (
            <button
              key={l}
              type="button"
              disabled={i === level}
              onClick={() => request(i)}
              className="engraved min-w-11 rounded-[3px] border-2 border-[#d6cfbd] px-2.5 py-1.5 text-[0.88rem] font-extrabold text-engrave transition-colors hover:bg-engrave hover:text-ink disabled:border-sodium disabled:text-sodium disabled:hover:bg-transparent"
            >
              {l}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Intro() {
  const started = useStore((s) => s.started)
  const start = useStore((s) => s.start)
  const setMode = useStore((s) => s.setMode)
  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  return (
    <AnimatePresence>
      {!started && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
          exit={{ opacity: 0, y: 18, transition: { duration: 0.3 } }}
          className="tag pointer-events-auto relative mx-auto w-[min(34rem,100%)] rounded-[6px] border-2 border-tag-line px-6 pt-6 pb-5 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.8)] max-sm:px-4 max-sm:pt-5 max-sm:pb-4"
        >
          <span aria-hidden className="absolute -top-3 left-1/2 size-6 -translate-x-1/2 rounded-full border-[5px] border-[#9a9384] bg-night" />
          <h1 className="engraved text-[1.65rem] leading-none font-extrabold max-sm:text-[1.25rem]">The plant is offline</h1>
          <p className="mt-3 text-[1rem] leading-relaxed text-ink-2 max-sm:mt-2 max-sm:text-[0.9rem] max-sm:leading-snug">
            I'm {PROFILE.name}, a building automation and energy engineer. Each room of this building is one of my projects. Walk in to commission it,
            and the lights come on.
          </p>
          <p className="reading mt-3 text-[0.82rem] text-ink">
            {coarse ? 'Tap the floor to walk. Drag to look around.' : 'WASD or arrows to walk, or click the floor. Drag to orbit.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 max-sm:mt-4 [&>button]:max-sm:px-3.5 [&>button]:max-sm:py-2.5 [&>button]:max-sm:text-[0.82rem]">
            <button
              type="button"
              onClick={start}
              className="engraved rounded-[3px] bg-go px-5 py-3 text-[0.95rem] font-extrabold text-go-ink transition-colors hover:bg-[#28825a]"
            >
              Start commissioning
            </button>
            <button
              type="button"
              onClick={() => setMode('list')}
              className="engraved rounded-[3px] border-2 border-ink px-5 py-3 text-[0.95rem] font-extrabold text-ink transition-colors hover:bg-ink hover:text-tag"
            >
              Read it as a list
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PoweringUp() {
  const ready = useStore((s) => s.sceneReady)
  return (
    <AnimatePresence>
      {!ready && (
        <motion.div
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="absolute inset-x-0 top-[38%] flex justify-center"
          role="status"
        >
          <div className="plate screws flex items-center gap-3 px-5 py-3">
          <motion.span
            aria-hidden
            className="size-3 border-2 border-sodium"
            animate={{ backgroundColor: ['rgba(255,176,74,0)', 'rgba(255,176,74,1)', 'rgba(255,176,74,0)'] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span className="engraved text-[0.85rem] font-bold whitespace-nowrap">Powering up the plant</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function HandoverButton() {
  const seen = useStore((s) => s.handoverSeen)
  const open = useStore((s) => s.setHandover)
  const started = useStore((s) => s.started)
  if (!started) return null
  return (
    <button
      type="button"
      onClick={() => open(true)}
      className="plate pointer-events-auto flex items-center gap-2 px-3.5 py-2 text-[0.8rem]"
    >
      <Mark on={seen} />
      <span className="engraved font-bold">Contact</span>
    </button>
  )
}

export function Hud() {
  useAmbientSound()
  return (
    <div className="pointer-events-none fixed inset-0 z-10 select-none">
      <div className="absolute top-4 right-4 left-4 flex items-start justify-between gap-3 max-sm:top-3 max-sm:right-3 max-sm:left-3">
        <Identity />
        <div className="absolute left-1/2 -translate-x-1/2 max-lg:static max-lg:translate-x-0 max-sm:hidden">
          <Progress />
        </div>
        <Controls />
      </div>
      <div className="absolute top-[4.6rem] left-3 sm:hidden">
        <Progress />
      </div>
      <PoweringUp />
      <Toasts />
      <div className="absolute bottom-4 left-4 flex items-end gap-2">
        <Readings />
        <HandoverButton />
      </div>
      <div className="absolute right-4 bottom-4 max-sm:right-3 max-sm:bottom-3">
        <MiniMap />
      </div>
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 max-sm:bottom-40">
        <LiftControl />
      </div>
      <div className="absolute inset-x-4 bottom-6 flex justify-center max-sm:bottom-4">
        <Intro />
      </div>
      <RoomPanel />
      <Handover />
    </div>
  )
}
