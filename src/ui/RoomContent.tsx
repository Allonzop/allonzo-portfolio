import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { Metric, Photo, Room } from '../content/rooms'

/** Two sizes per tag: TITLE for the room title and every figure, BODY for everything else */
export const TITLE = 'text-[2rem] max-sm:text-[1.7rem]'
export const BODY = 'text-[0.92rem]'

/** Dates and ranges never break across lines */
const WJ = String.fromCharCode(0x2060)
export const keepRanges = (s: string) => s.replace(/(\w)([–-])(\w)/g, `$1${WJ}$2${WJ}$3`)

/** An engraved dash: a list bullet that is never mistaken for a state mark */
export function Dash({ tone = 'ink' }: { tone?: 'ink' | 'sodium' }) {
  return <span aria-hidden className={`absolute top-[0.72em] left-0 h-[2px] w-2.5 ${tone === 'ink' ? 'bg-ink' : 'bg-sodium'}`} />
}
import { CardFan, CardFlip } from './CardFlip'
import { ParkingCounter } from './ParkingCounter'

/** Rating-plate grid: the fields engraved on a piece of equipment */
export function RatingPlate({ items }: { items: Metric[] }) {
  return (
    <dl className="grid grid-cols-2 border-t-2 border-l-2 border-ink">
      {items.map((m, i) => (
        <div key={i} className={`border-r-2 border-b-2 border-ink px-3 pt-2.5 pb-3 ${items.length % 2 && i === items.length - 1 ? 'col-span-2' : ''}`}>
          <dt className="sr-only">{m.label}</dt>
          <dd className={`engraved leading-none font-extrabold text-ink ${TITLE}`} style={{ textTransform: 'none' }}>
            {m.value}
          </dd>
          <dd className={`mt-1.5 leading-snug text-ink-2 ${BODY}`}>{m.label}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Reversed band: black core showing through the ivory face */
export function Band({ children }: { children: React.ReactNode }) {
  return <h3 className={`engraved -mx-5 mt-7 mb-3 bg-ink px-5 py-1.5 font-bold text-tag sm:-mx-6 sm:px-6 ${BODY}`}>{children}</h3>
}

export function Chips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Stack">
      {items.map((s) => (
        <li key={s} className={`engraved rounded-[3px] bg-plate px-2 py-1 font-semibold text-engrave ${BODY}`}>
          {s}
        </li>
      ))}
    </ul>
  )
}

/** Evidence prints: real figures pinned to the tag; tap one to read it full size */
export function Photos({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<Photo | null>(null)
  if (!photos.length) return null
  return (
    <>
      <div className={`grid gap-3 ${photos.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {photos.map((p, i) => {
          // the lead print hugs its own shape; the others sit in matched frames
          const lead = i === 0 && photos.length % 2 === 1
          return (
            <figure key={p.src} className={lead && photos.length > 1 ? 'col-span-2' : ''}>
              {/* a link, so the static list page still opens the full image without scripts */}
              <a
                href={p.src}
                onClick={(e) => {
                  e.preventDefault()
                  setOpen(p)
                }}
                className={`group relative cursor-zoom-in border-2 border-ink bg-white p-1 ${lead ? 'inline-block max-w-full align-top' : 'block w-full'}`}
                aria-label={`Enlarge: ${p.alt}`}
              >
                <img
                  src={p.src}
                  alt={p.alt}
                  width={p.w}
                  height={p.h}
                  loading="lazy"
                  decoding="async"
                  className={lead ? 'block h-auto max-h-[22rem] w-auto max-w-full' : 'block w-full object-contain'}
                  style={lead ? undefined : { aspectRatio: Math.abs(p.w - p.h) < 0.05 * p.w ? '1 / 1' : p.h > p.w ? '3 / 4' : '4 / 3' }}
                />
                <span className="reading absolute top-0 left-0 bg-ink px-1.5 py-0.5 text-[0.7rem] text-tag">FIG {String(i + 1).padStart(2, '0')}</span>
              </a>
              {p.caption && <figcaption className={`mt-1.5 leading-snug text-ink-2 ${BODY}`}>{p.caption}</figcaption>}
            </figure>
          )
        })}
      </div>
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={open.alt}
            onClick={() => setOpen(null)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(null)}
            className="fixed inset-0 z-[80] flex cursor-zoom-out flex-col items-center justify-center gap-3 bg-[rgb(3_6_12/0.92)] p-4 backdrop-blur-sm"
          >
            <img src={open.src} alt={open.alt} className="max-h-[82svh] max-w-full border-4 border-tag bg-white object-contain" />
            {open.caption && <p className="max-w-[46rem] text-center text-[0.92rem] text-engrave">{open.caption}</p>}
            <button autoFocus type="button" className="engraved rounded-[3px] bg-tag px-4 py-2 text-[0.84rem] font-extrabold text-ink">
              Close
            </button>
          </div>,
          document.body,
        )}
    </>
  )
}

export function RoomContent({ room, live = false }: { room: Room; live?: boolean }) {
  return (
    <div className={`leading-relaxed ${BODY}`}>
      <p className="leading-snug font-bold text-balance">{room.hook}</p>
      <div className="mt-5">
        <RatingPlate items={room.metrics} />
      </div>

      {room.id === 'parking' && live && <ParkingCounter live />}
      {room.id === 'arcade' && (live ? <CardFlip /> : <CardFan />)}

      <Band>What I did</Band>
      <ul className="space-y-2.5">
        {room.did.map((d) => (
          <li key={d} className="relative pl-5">
            <Dash />
            {d}
          </li>
        ))}
      </ul>

      {room.status && room.id !== 'control' && <p className="mt-4 border-2 border-dashed border-ink px-3 py-2">{room.status}</p>}

      {room.features?.map((f) => (
        <section key={f.title}>
          <Band>{f.title}</Band>
          {f.lead && <p className="mb-2 font-semibold">{f.lead}</p>}
          <div className="space-y-2">
            {f.body.map((b) => (
              <p key={b}>{b}</p>
            ))}
          </div>
          {f.figures && (
            <div className="mt-3">
              <RatingPlate items={f.figures} />
            </div>
          )}
          {f.photos && (
            <div className="mt-4">
              <Photos photos={f.photos} />
            </div>
          )}
        </section>
      ))}

      {room.also && (
        <>
          <Band>Also</Band>
          <ul className="space-y-1.5">
            {room.also.map((a) => (
              <li key={a} className="relative pl-5">
                <Dash />
                {a}
              </li>
            ))}
          </ul>
        </>
      )}

      {room.aside && <p className="mt-5 font-semibold text-ink-2">{room.aside}</p>}

      {room.photos.length > 0 && (
        <>
          <Band>Evidence</Band>
          <Photos photos={room.photos} />
        </>
      )}

      <Band>Stack</Band>
      <Chips items={room.stack} />
    </div>
  )
}
