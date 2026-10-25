import { useEffect, useRef } from 'react'
import { PROFILE } from '../content/profile'
import { ROOMS, ROOM_BY_ID, TOUR } from '../content/rooms'
import { useStore } from '../store'
import { ContactActions, PathList } from './Contact'
import { BODY, Dash, keepRanges, RoomContent, TITLE } from './RoomContent'

/** The fast path: the same projects as a clean scrolling list */
export default function ListMode() {
  const setMode = useStore((s) => s.setMode)
  const fallback = useStore((s) => s.fallback)
  const done = useStore((s) => s.commissioned)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = `${PROFILE.name} · ${PROFILE.title}`
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let kill = () => {}
    // tags settle on their hooks as they scroll in; content is visible without it
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ default: gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger)
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('[data-tag]').forEach((el) => {
          gsap.from(el, {
            rotate: -1.2,
            y: 28,
            duration: 0.9,
            ease: 'expo.out',
            transformOrigin: '50% 0%',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          })
        })
      }, root)
      kill = () => ctx.revert()
    })
    return () => kill()
  }, [])

  return (
    <div ref={root} className="min-h-full overflow-x-clip bg-night text-engrave">
      <header className="sticky top-0 z-20 border-b border-[#1d2636] bg-[rgb(5_10_20/0.92)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-[60rem] items-center justify-between gap-3 px-4 py-3">
          <p className="engraved text-[1rem] font-extrabold">{PROFILE.name}</p>
          {!fallback && (
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault()
                setMode('game')
              }}
              className="engraved rounded-[5px] border-2 border-[#d6cfbd] bg-tag px-4 py-2 text-[0.84rem] font-extrabold text-ink no-underline transition-colors hover:bg-white"
            >
              Play the 3D plant
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[60rem] px-4 pb-24">
        {fallback && (
          <p className="mt-6 rounded-[5px] border border-[#3a4658] px-4 py-3 text-[0.92rem] text-[#c9c3b4]">
            Your browser could not start the 3D scene, so here is the list version. Same projects, same numbers.
          </p>
        )}

        {/* identity: the building's main nameplate */}
        <section className="pt-10 pb-8 sm:pt-16">
          <div className="plate screws px-10 py-6 text-[clamp(1.25rem,3.6vw,2rem)] leading-tight max-sm:px-8">
            <h1 className="engraved font-extrabold">{PROFILE.name}</h1>
            <p className="engraved font-semibold text-[#d9d3c5]">{PROFILE.title}</p>
            <p className="engraved font-semibold text-[#a59f92]">{PROFILE.subtitle}</p>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_1fr] [&>*]:min-w-0">
            <div className="text-[1.05rem] leading-relaxed text-[#ddd7ca]">
              <p>{PROFILE.summary}</p>
              <ul className="mt-4 space-y-1.5 text-[0.98rem]">
                {PROFILE.availability.map((a) => (
                  <li key={a} className="relative pl-5">
                    <Dash tone="sodium" />
                    {a}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.95rem] text-[#a59f92]">{PROFILE.languages.map((l) => `${l.name}, ${l.level}`).join(' · ')}</p>
            </div>
            <div className="tag self-start rounded-[6px] border-2 border-tag-line p-4">
              <ContactActions />
            </div>
          </div>
        </section>

        {/* room index */}
        <nav aria-label="Projects" className="mb-10">
          <ul className="flex flex-wrap gap-2">
            {TOUR.map((id) => {
              const r = ROOM_BY_ID[id]
              return (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="engraved flex items-center gap-2 rounded-[4px] border-2 border-[#2c2c2c] bg-plate px-3 py-2 text-[0.8rem] font-bold text-engrave no-underline transition-colors hover:border-sodium"
                  >
                    <span aria-hidden className="size-2.5 border-2 border-engrave" style={{ background: done.includes(id) ? 'var(--color-engrave)' : 'transparent' }} />
                    {r.code}
                    <span className="font-semibold text-[#a59f92] normal-case">{r.title}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="space-y-10">
          {ROOMS.slice()
            .sort((a, b) => TOUR.indexOf(a.id) - TOUR.indexOf(b.id))
            .map((room) => (
              <article key={room.id} id={room.id} data-tag className="tag scroll-mt-20 overflow-hidden rounded-[8px] border-2 border-tag-line">
                <header className="flex items-center gap-3 bg-ink px-5 py-2.5 text-tag sm:px-6">
                  <span aria-hidden className="size-4 rounded-full border-[3px] border-[#5d5d5d] bg-tag" />
                  <p className={`engraved flex-1 font-extrabold ${BODY}`}>{room.code}</p>
                </header>
                <div className="px-5 pt-5 pb-6 sm:px-6">
                  <h2 className={`engraved leading-[0.95] font-extrabold ${TITLE}`} style={{ textTransform: 'none' }}>
                    {room.title}
                  </h2>
                  <p className={`mt-2 text-ink-2 ${BODY}`}>{keepRanges(room.context)}</p>
                  <div className="mt-4 max-w-[46rem]">
                    <RoomContent room={room} />
                  </div>
                </div>
              </article>
            ))}
        </div>

        <section className="mt-14 grid gap-6 md:grid-cols-2 [&>*]:min-w-0" aria-labelledby="path-title">
          <div className="tag rounded-[6px] border-2 border-tag-line p-5">
            <h2 id="path-title" className={`engraved mb-3 border-b-2 border-ink pb-1 font-extrabold ${BODY}`}>
              Path
            </h2>
            <PathList />
          </div>
          <div className="plate screws px-8 py-5 text-[0.95rem]">
            <h2 className="engraved font-extrabold">Let's talk</h2>
            <p className="text-[#c9c3b4]">Engineering roles abroad, from March 2027.</p>
            <div className="tag mt-4 rounded-[4px] p-3">
              <ContactActions />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
