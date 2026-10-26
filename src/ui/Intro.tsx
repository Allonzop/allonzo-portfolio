import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { PROFILE } from '../content/profile'
import { useStore } from '../store'

const EASE = [0.16, 1, 0.3, 1] as const
const HOLD_MS = 700

/** Hazard band: the edge of a lockout tag */
const HAZARD = 'repeating-linear-gradient(-45deg, var(--color-sodium) 0 12px, var(--color-ink) 12px 24px)'

/** Press and hold, like closing a breaker. Keys and reduced motion act at once. */
function EnergiseButton({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const reduce = useReducedMotion()
  const [held, setHeld] = useState(false)
  const [nudge, setNudge] = useState(false)
  const timer = useRef(0)
  const t0 = useRef(0)
  const release = () => {
    window.clearTimeout(timer.current)
    if (held && performance.now() - t0.current < HOLD_MS) setNudge(true)
    setHeld(false)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return (
    <button
      type="button"
      disabled={!ready}
      onPointerDown={(e) => {
        if (!ready || e.button !== 0) return
        if (reduce) return onDone()
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        t0.current = performance.now()
        setHeld(true)
        setNudge(false)
        timer.current = window.setTimeout(onDone, HOLD_MS)
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (ready) onDone()
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={ready ? 'Energise the plant and start' : 'Powering up the plant'}
      className="engraved relative isolate flex min-h-14 flex-1 touch-none items-center justify-center gap-3 overflow-hidden rounded-[3px] bg-go px-6 text-[1rem] font-extrabold text-go-ink select-none disabled:cursor-progress disabled:bg-[#2b3a33] max-sm:min-h-13 max-sm:text-[0.92rem]"
    >
      {/* the breaker's travel: fills while held */}
      <motion.span
        aria-hidden
        className="absolute inset-0 -z-10 bg-[#36a06b]"
        initial={false}
        animate={{ scaleX: held ? 1 : 0 }}
        transition={{ duration: held ? HOLD_MS / 1000 : 0.25, ease: held ? 'linear' : 'easeOut' }}
        style={{ originX: 0 }}
      />
      <span aria-hidden className="grid size-4 place-items-center border-2 border-current">
        <span className={`size-1.5 ${ready ? 'bg-current' : ''}`} />
      </span>
      {!ready ? 'Powering up…' : held ? 'Energising…' : nudge ? 'Keep holding' : reduce ? 'Energise the plant' : 'Hold to energise'}
    </button>
  )
}

/** The opening: one lockout tag, alone on a dimmed blueprint, read before anything else */
export function Intro() {
  const started = useStore((s) => s.started)
  const ready = useStore((s) => s.sceneReady)
  const start = useStore((s) => s.start)
  const setMode = useStore((s) => s.setMode)
  const reduce = useReducedMotion()
  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  const line = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0, transition: { delay: 0.9 + i * 0.12, duration: 0.7, ease: EASE } },
        }

  return (
    <>
      <AnimatePresence>
        {!started && (
          <motion.div
            key="intro"
            className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center overflow-y-auto p-4"
            exit={{ opacity: 0, transition: { delay: 0.35, duration: 1.1, ease: 'easeOut' } }}
          >
            {/* the drawing stays visible behind, dimmed hard so the tag is the only thing to read */}
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgb(3_8_18/0.42),rgb(2_5_12/0.86)_80%)]" />

            <motion.section
              role="dialog"
              aria-labelledby="intro-title"
              className="tag relative w-[min(40rem,100%)] rounded-[8px] shadow-[0_40px_90px_-30px_rgb(0_0_0/0.95)]"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -60, rotate: -4 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, rotate: [-4, 1.6, -0.6, 0], transition: { delay: 0.25, duration: 1.3, ease: EASE } }}
              exit={reduce ? { opacity: 0 } : { y: '110vh', rotate: 9, transition: { duration: 0.85, ease: [0.55, 0, 0.9, 0.4] } }}
              style={{ originY: 0 }}
            >
              {/* the hasp: the tag hangs from the isolator */}
              <span aria-hidden className="absolute -top-4 left-1/2 size-8 -translate-x-1/2 rounded-full border-[6px] border-[#8f8a7d] bg-night shadow-[0_2px_0_rgb(255_255_255/0.15)]" />
              <div aria-hidden className="h-4 rounded-t-[8px]" style={{ background: HAZARD }} />
              <p className="engraved flex items-center justify-between gap-3 bg-ink px-6 py-2 text-[0.86rem] font-extrabold text-sodium max-sm:px-4 max-sm:text-[0.78rem]">
                <span>Locked out · do not operate</span>
                <span className="text-[#c9c3b4]">Isolated</span>
              </p>

              <div className="px-6 pt-5 pb-6 max-sm:px-4 max-sm:pt-4 max-sm:pb-5">
                <motion.h1
                  id="intro-title"
                  {...line(0)}
                  className="font-plate text-[clamp(3.4rem,13vw,6.4rem)] leading-[0.82] font-black tracking-[-0.01em] text-ink uppercase"
                  style={{ fontStretch: '62%' }}
                >
                  Plant
                  <br />
                  offline
                </motion.h1>

                <motion.p {...line(1)} className="mt-5 max-w-[30rem] text-[1.06rem] leading-snug text-ink max-sm:mt-4 max-sm:text-[0.98rem]">
                  This building is my portfolio. Every room is a real project, and every room is dark.{' '}
                  <strong className="font-bold">Walk in to commission it, and the lights come on.</strong>
                </motion.p>

                <motion.div {...line(2)} className="mt-5 flex items-end gap-4 border-t-2 border-ink pt-3 max-sm:mt-4">
                  <div className="min-w-0 flex-1">
                    <p className="engraved text-[0.78rem] font-bold text-ink-2">Isolated by</p>
                    <p className="engraved text-[1.1rem] leading-tight font-extrabold">{PROFILE.name}</p>
                    <p className="text-[0.92rem] text-ink-2">{PROFILE.title}</p>
                  </div>
                </motion.div>

                <motion.div {...line(3)} className="mt-6 flex items-stretch gap-2 max-sm:mt-5 max-sm:flex-col">
                  <EnergiseButton ready={ready} onDone={start} />
                  <button
                    type="button"
                    onClick={() => setMode('list')}
                    className="engraved min-h-14 rounded-[3px] border-2 border-ink px-5 text-[0.92rem] font-extrabold text-ink transition-colors hover:bg-ink hover:text-tag max-sm:min-h-12"
                  >
                    Read it as a list
                  </button>
                </motion.div>
                <motion.p {...line(4)} className="mt-3 text-[0.92rem] text-ink-2">
                  {coarse ? 'Then tap the floor to walk, drag to look around.' : 'Then WASD or arrows to walk, or click the floor. Drag to orbit.'}
                </motion.p>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the breaker closes: one sodium flash over everything */}
      <AnimatePresence>
        {started && !reduce && (
          <motion.div
            key="flash"
            aria-hidden
            className="pointer-events-none fixed inset-0 z-40 bg-[#ffd9a0] mix-blend-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 0.7, 0], transition: { duration: 1.1, times: [0, 0.3, 0.42, 1], ease: 'easeOut' } }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
