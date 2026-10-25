import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { PROFILE } from '../content/profile'
import { ROOMS } from '../content/rooms'
import { ACHIEVEMENTS, useStore, type AchievementId } from '../store'
import { ContactActions, PathList } from './Contact'
import { Dash } from './RoomContent'

/** The handover certificate: what you get when every room is commissioned */
export function Handover() {
  const open = useStore((s) => s.handoverOpen)
  const set = useStore((s) => s.setHandover)
  const done = useStore((s) => s.commissioned)
  const got = useStore((s) => s.achievements)
  const xp = useStore((s) => s.xp)
  const setMode = useStore((s) => s.setMode)
  const reduce = useReducedMotion()
  const closeRef = useRef<HTMLButtonElement>(null)
  const complete = done.length === ROOMS.length

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && set(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, set])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="pointer-events-auto fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-[rgb(5_10_20/0.55)] p-4 max-sm:items-end max-sm:p-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && set(false)}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="handover-title"
            initial={reduce ? { opacity: 0 } : { y: 60, rotate: -1.5, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0, transition: { duration: 0.25 } }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="tag relative w-[min(46rem,100%)] rounded-[8px] border-2 border-tag-line shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)] max-sm:rounded-b-none"
          >
            <header className="flex items-center gap-3 rounded-t-[6px] bg-ink px-6 py-3 text-tag">
              <span aria-hidden className="size-5 rounded-full border-[4px] border-[#5d5d5d] bg-tag" />
              <p className="engraved flex-1 text-[0.92rem] font-extrabold">
                Handover certificate · {done.length}/{ROOMS.length} rooms · {xp} XP
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={() => set(false)}
                className="engraved rounded-[3px] px-2 py-1 text-[0.92rem] font-bold text-tag transition-colors hover:bg-[#2c2c2c]"
              >
                Keep exploring
              </button>
            </header>
            <div className="grid gap-8 px-6 pt-6 pb-7 text-[0.92rem] md:grid-cols-[1.15fr_1fr]">
              <div>
                <h2 id="handover-title" className="engraved text-[2rem] leading-[0.95] font-extrabold text-balance" style={{ textTransform: 'none' }}>
                  {complete ? 'The plant is handed over' : 'Handover, in progress'}
                </h2>
                <p className="mt-3 leading-relaxed">
                  <span className="font-bold">{PROFILE.name}</span>
                  <br />
                  <span className="text-ink-2">
                    {PROFILE.title} · {PROFILE.subtitle}
                  </span>
                </p>
                <p className="mt-4 leading-relaxed">{PROFILE.summary}</p>
                <ul className="mt-4 space-y-1">
                  {PROFILE.availability.map((a) => (
                    <li key={a} className="relative pl-5">
                      <Dash />
                      {a}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-ink-2">{PROFILE.languages.map((l) => `${l.name}, ${l.level}`).join(' · ')}</p>
              </div>
              <div className="space-y-6">
                <ContactActions />
                <div>
                  <h3 className="engraved mb-2 border-b-2 border-ink pb-1 font-extrabold">Path</h3>
                  <PathList />
                </div>
                <div>
                  <h3 className="engraved mb-2 border-b-2 border-ink pb-1 font-extrabold">Achievements</h3>
                  <ul className="space-y-1.5">
                    {(Object.keys(ACHIEVEMENTS) as AchievementId[]).map((k) => {
                      const has = got.includes(k)
                      return (
                        <li key={k} className={`flex items-start gap-2.5 ${has ? '' : 'text-ink-2'}`}>
                          <span
                            aria-hidden
                            className="mt-1 size-3 shrink-0 border-2 border-ink"
                            style={{ background: has ? 'var(--color-ink)' : 'transparent' }}
                          />
                          <span>
                            <span className="font-semibold">{ACHIEVEMENTS[k].title}</span>
                            <span className="sr-only">{has ? ' (unlocked)' : ' (locked)'}</span>
                            {!has && k === 'easter-egg' && <span className="text-ink-2"> · look out to sea</span>}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="engraved font-bold text-ink underline decoration-1 underline-offset-4"
                >
                  Read everything as a list
                </button>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
