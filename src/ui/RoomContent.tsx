import type { Metric, Room } from '../content/rooms'

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
  return (
    <h3 className={`engraved -mx-5 mt-7 mb-3 bg-ink px-5 py-1.5 font-bold text-tag sm:-mx-6 sm:px-6 ${BODY}`}>{children}</h3>
  )
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

export function Photos({ room }: { room: Room }) {
  if (!room.photos.length) return null
  return (
    <div className={`grid gap-2 ${room.photos.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {room.photos.map((p, i) => (
        <figure key={p.src} className={room.photos.length === 3 && i === 0 ? 'col-span-2' : ''}>
          <img
            src={p.src}
            alt={p.alt}
            width={p.w}
            height={p.h}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full border-2 border-ink bg-tag-2"
          />
          {p.caption && <figcaption className={`mt-1 leading-snug text-ink-2 ${BODY}`}>{p.caption}</figcaption>}
        </figure>
      ))}
    </div>
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

      {room.status && room.id !== 'control' && (
        <p className="mt-4 border-2 border-dashed border-ink px-3 py-2">{room.status}</p>
      )}

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

      {room.photos.length > 0 && (
        <>
          <Band>On site</Band>
          <Photos room={room} />
        </>
      )}

      <Band>Stack</Band>
      <Chips items={room.stack} />
    </div>
  )
}
