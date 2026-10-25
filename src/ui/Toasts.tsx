import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect } from 'react'
import { ROOM_BY_ID } from '../content/rooms'
import { ACHIEVEMENTS, useStore, type Toast } from '../store'

/** Die-cut tag: corners clipped at the eyelet end */
const DIE_CUT = 'polygon(16px 0, 100% 0, 100% 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)'

function Item({ t }: { t: Toast }) {
  const dismiss = useStore((s) => s.dismissToast)
  const reduce = useReducedMotion()
  useEffect(() => {
    const id = window.setTimeout(() => dismiss(t.key), t.kind === 'room' ? 3800 : 4800)
    return () => window.clearTimeout(id)
  }, [t, dismiss])
  const room = t.kind === 'room'
  return (
    <motion.li
      layout
      // a commissioning tag tied on with wire: it drops and swings to rest on the wire
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -36, rotate: -10 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, rotate: [-10, 5, -2.5, 1, 0] }}
      exit={{ opacity: 0, y: -14, transition: { duration: 0.25 } }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], opacity: { duration: 0.2 } }}
      style={{ originX: '22px', originY: 0 }}
      className="relative pt-7"
    >
      {/* the wire, from above, through the eyelet */}
      <svg aria-hidden className="absolute top-0 left-[6px] overflow-visible" width="34" height="46" viewBox="0 0 34 46">
        <path d="M 16 0 C 16 18, 12 30, 16 46" fill="none" stroke="#c9c3b4" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div
        className={`relative flex items-center gap-3 py-2.5 pr-2.5 pl-11 shadow-[0_12px_26px_-10px_rgb(0_0_0/0.85)] ${room ? 'bg-go text-go-ink' : 'bg-plate text-engrave'}`}
        style={{ clipPath: DIE_CUT }}
      >
        {/* reinforced eyelet */}
        <span aria-hidden className="absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 rounded-full border-[4px] border-[#d6d0c0] bg-night" />
        <span aria-hidden className="size-3.5 shrink-0 border-2 border-current p-[2px]">
          <span className="block size-full bg-current" />
        </span>
        <p className="engraved text-[0.86rem] leading-tight font-extrabold whitespace-nowrap max-sm:whitespace-normal">
          {room ? 'Room commissioned' : 'Achievement'}
          <span className="font-semibold opacity-85"> · {t.kind === 'room' ? ROOM_BY_ID[t.room].code : ACHIEVEMENTS[t.id].title}</span>
        </p>
        <span className="reading ml-1 bg-ink px-2 py-1 text-[0.86rem] leading-none font-bold whitespace-nowrap text-sodium">+{t.xp} XP</span>
      </div>
    </motion.li>
  )
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  return (
    <ol className="absolute top-[4.6rem] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 max-sm:top-[8.4rem]" aria-live="polite">
      <AnimatePresence>
        {toasts.slice(-3).map((t) => (
          <Item key={t.key} t={t} />
        ))}
      </AnimatePresence>
    </ol>
  )
}
