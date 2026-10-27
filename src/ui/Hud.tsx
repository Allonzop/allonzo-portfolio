import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ROOMS } from '../content/rooms'
import { PROFILE } from '../content/profile'
import { useStore } from '../store'
import { Handover } from './Handover'
import { MiniMap } from './MiniMap'
import { RoomPanel } from './RoomPanel'
import { useAmbientSound } from './sound'
import { Intro } from './Intro'
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
    <div className="plate screws pointer-events-auto px-7 py-2.5 text-[0.86rem] max-sm:py-2 max-sm:text-[0.8rem]">
      <p className="engraved leading-tight font-extrabold whitespace-nowrap">{PROFILE.name}</p>
      <p className="engraved leading-tight font-semibold text-[#c9c3b4] max-sm:hidden">{PROFILE.title}</p>
    </div>
  )
}

function Progress() {
  const done = useStore((s) => s.commissioned)
  const xp = useStore((s) => s.xp)
  const reduce = useReducedMotion()
  return (
    <div className="plate screws pointer-events-auto flex items-center gap-4 px-7 py-2.5 text-[0.86rem] max-sm:gap-3">
      <div>
        <p className="engraved leading-none font-bold text-[#c9c3b4]">
          <span className="max-sm:hidden">Building commissioning</span>
          <span className="sm:hidden">Commissioned</span>
        </p>
        <div className="mt-1.5 flex items-center gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={ROOMS.length} aria-valuenow={done.length} aria-label="Rooms commissioned">
          {ROOMS.map((r, i) => (
            <span key={r.id} className={`relative block h-2.5 w-5 border max-sm:w-3.5 ${i < done.length ? 'border-sodium' : 'border-line'}`}>
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
      <p className="reading leading-none font-bold text-engrave">
        {done.length}/{ROOMS.length}
      </p>
      <span className="h-7 w-px bg-[#3a3a3a]" />
      <p className="reading leading-none font-bold text-sodium" aria-label={`${xp} experience points`}>
        {xp}
        <span className="ml-1 font-normal text-[#c9c3b4]">XP</span>
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
          className="plate screws pointer-events-auto flex items-center gap-2 px-7 py-2.5"
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

/** HUD plates are bolted on once the plant is energised, one after another */
function Bolt({ i, from, className, children }: { i: number; from: 'top' | 'bottom'; className: string; children: React.ReactNode }) {
  const started = useStore((s) => s.started)
  const reduce = useReducedMotion()
  if (!started) return null
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: from === 'top' ? -24 : 24 }}
      animate={{ opacity: 1, y: 0, transition: { delay: reduce ? 0 : 1.5 + i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}
    >
      {children}
    </motion.div>
  )
}

export function Hud() {
  useAmbientSound()
  return (
    <div className="pointer-events-none fixed inset-0 z-10 select-none">
      {/* a lens vignette: the edges fall away so the lit room carries the frame */}
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_55%,rgb(2_5_12/0.55))]" />
      <Bolt i={0} from="top" className="absolute top-4 right-4 left-4 flex items-start justify-between gap-3 max-sm:top-3 max-sm:right-3 max-sm:left-3">
        <Identity />
        <div className="absolute left-1/2 -translate-x-1/2 max-lg:static max-lg:translate-x-0 max-sm:hidden">
          <Progress />
        </div>
        <Controls />
      </Bolt>
      <Bolt i={1} from="top" className="absolute top-[4.6rem] left-3 sm:hidden">
        <Progress />
      </Bolt>
      <Toasts />
      <Bolt i={2} from="bottom" className="absolute bottom-4 left-4 flex items-end gap-2">
        <HandoverButton />
      </Bolt>
      <Bolt i={3} from="bottom" className="absolute right-4 bottom-4 max-sm:right-3 max-sm:bottom-3">
        <MiniMap />
      </Bolt>
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 max-sm:bottom-40">
        <LiftControl />
      </div>
      <RoomPanel />
      <Handover />
      <Intro />
    </div>
  )
}
