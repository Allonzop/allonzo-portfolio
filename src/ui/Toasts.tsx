import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect } from 'react'
import { ROOM_BY_ID } from '../content/rooms'
import { ACHIEVEMENTS, useStore, type Toast } from '../store'

function Item({ t }: { t: Toast }) {
  const dismiss = useStore((s) => s.dismissToast)
  const reduce = useReducedMotion()
  useEffect(() => {
    const id = window.setTimeout(() => dismiss(t.key), t.kind === 'room' ? 3600 : 4600)
    return () => window.clearTimeout(id)
  }, [t, dismiss])
  const room = t.kind === 'room'
  return (
    <motion.li
      layout
      // a tag tied on with wire: it drops and swings to rest
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -40, rotate: -9 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, rotate: [-9, 5, -2.5, 1, 0] }}
      exit={{ opacity: 0, y: -16, transition: { duration: 0.25 } }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      style={{ originY: 0 }}
      className="relative"
    >
      <span aria-hidden className="absolute -top-5 left-1/2 h-5 w-px -translate-x-1/2 bg-[#9a9384]" />
      <div
        className={`flex items-center gap-3 rounded-[5px] px-4 py-2.5 shadow-[0_10px_24px_-8px_rgb(0_0_0/0.8)] ${
          room ? 'bg-go text-go-ink' : 'plate text-engrave'
        }`}
      >
        <span aria-hidden className="size-3 rounded-full border-2 border-current opacity-70" />
        <div>
          <p className="engraved text-[0.95rem] leading-none font-extrabold whitespace-nowrap max-sm:text-[0.82rem]">{room ? 'Room commissioned' : 'Achievement unlocked'}</p>
          <p className="engraved mt-1 text-[0.75rem] leading-none font-semibold opacity-85">
            {t.kind === 'room' ? ROOM_BY_ID[t.room].code : ACHIEVEMENTS[t.id].title}
          </p>
        </div>
        <p className="reading ml-2 text-[1.05rem] leading-none whitespace-nowrap text-sodium max-sm:text-[0.9rem]">+{t.xp} XP</p>
      </div>
    </motion.li>
  )
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  return (
    <ol className="absolute top-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-6 max-sm:top-32" aria-live="polite">
      <AnimatePresence>
        {toasts.slice(-3).map((t) => (
          <Item key={t.key} t={t} />
        ))}
      </AnimatePresence>
    </ol>
  )
}
