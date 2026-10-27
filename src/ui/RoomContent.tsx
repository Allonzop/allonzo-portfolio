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

/** Every figure a room has: its own photos first, then the ones proving each feature */
export const roomMedia = (room: Room): Photo[] => [...room.photos, ...(room.features ?? []).flatMap((f) => f.photos ?? [])]

/** Drawings and charts keep every edge; photos fill their frame */
const isDrawing = (p: Photo) => /model|robot|consumption|fem-|network|wiring|reading-tree|play-furniture|park-/.test(p.src)

/** The evidence, shown first: one large print, the rest on a strip beneath; tap the print to read it full size */
export function Gallery({ photos }: { photos: Photo[] }) {
  const [i, setI] = useState(0)
  const [open, setOpen] = useState<Photo | null>(null)
  if (!photos.length) return null
  const lead = photos[Math.min(i, photos.length - 1)]
  const n = photos.length
  return (
    <figure>
      {/* a link, so the static list page still opens the full image without scripts */}
      <a
        href={lead.src}
        onClick={(e) => {
          e.preventDefault()
          setOpen(lead)
        }}
        className={`relative block cursor-zoom-in overflow-hidden rounded-[4px] border-2 border-ink ${isDrawing(lead) ? 'bg-white' : 'bg-ink'}`}
        aria-label={`Enlarge: ${lead.alt}`}
      >
        <img
          key={lead.src}
          src={lead.src}
          alt={lead.alt}
          width={lead.w}
          height={lead.h}
          decoding="async"
          className={`block aspect-[4/3] w-full ${isDrawing(lead) ? 'object-contain p-2' : 'object-cover'}`}
        />
        <span className="reading absolute top-0 left-0 bg-ink px-2 py-1 text-[0.72rem] text-tag">
          FIG {String(i + 1).padStart(2, '0')}/{String(n).padStart(2, '0')}
        </span>
        <span aria-hidden className="engraved absolute right-2 bottom-2 rounded-[3px] bg-[rgb(20_20_20/0.8)] px-2 py-1 text-[0.72rem] font-extrabold text-tag">
          Tap to enlarge
        </span>
      </a>
      {lead.caption && <figcaption className={`mt-1.5 leading-snug text-ink-2 ${BODY}`}>{lead.caption}</figcaption>}
      {n > 1 && (
        <ul className="mt-2.5 flex gap-2 overflow-x-auto pb-1" aria-label="More figures">
          {photos.map((p, k) => (
            <li key={p.src} className="shrink-0">
              {/* links too, so the static list page still opens each figure */}
              <a
                href={p.src}
                onClick={(e) => {
                  e.preventDefault()
                  setI(k)
                }}
                aria-label={`Show figure ${k + 1}: ${p.alt}`}
                aria-current={k === i}
                className={`block overflow-hidden rounded-[3px] border-2 transition-opacity ${k === i ? 'border-sodium' : 'border-ink opacity-70 hover:opacity-100'} ${isDrawing(p) ? 'bg-white' : 'bg-ink'}`}
              >
                <img src={p.src} alt="" loading="lazy" decoding="async" className={`block h-16 w-[5.4rem] ${isDrawing(p) ? 'object-contain p-0.5' : 'object-cover'}`} />
              </a>
            </li>
          ))}
        </ul>
      )}
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
    </figure>
  )
}

export function RoomContent({ room, live = false }: { room: Room; live?: boolean }) {
  return (
    <div className={`leading-relaxed ${BODY}`}>
      <p className="leading-snug font-bold text-balance">{room.hook}</p>
      {roomMedia(room).length > 0 && (
        <div className="mt-4">
          <Gallery photos={roomMedia(room)} />
        </div>
      )}
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


      <Band>Stack</Band>
      <Chips items={room.stack} />
    </div>
  )
}
