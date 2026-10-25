import { useEffect, useRef } from 'react'
import { paintCardsInto } from './cardPaint'

/** Three real cards fanned out, for the static list */
export function CardFan() {
  const cards = ['floral-hero', 'jules-hero', 'monster-hero']
  return (
    <figure className="mt-5">
      <div className="flex justify-center gap-3 bg-[#120d1c] px-4 py-5">
        {cards.map((c, i) => (
          <img
            key={c}
            src={`/media/arcade/${c}.webp`}
            alt=""
            width={371}
            height={520}
            loading="lazy"
            decoding="async"
            className="h-auto w-[30%] max-w-[9rem]"
            style={{ transform: `rotate(${(i - 1) * 4}deg) translateY(${i === 1 ? -6 : 0}px)` }}
          />
        ))}
      </div>
      <figcaption className="mt-1 text-[0.92rem] text-ink-2">Real cards from the game, drawn by my brother.</figcaption>
    </figure>
  )
}

/** The cards turning over in a loop, standing in for a capture of the game */
export function CardFlip() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const t0 = performance.now()
    const loop = () => {
      paintCardsInto(ctx, reduced ? 4 : (performance.now() - t0) / 1000, c.width, c.height)
      // keep looping under reduced motion only until the images have arrived
      if (!reduced || performance.now() - t0 < 1500) raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <figure className="mt-5">
      <canvas ref={ref} width={640} height={360} className="block h-auto w-full border-2 border-ink" aria-label="BOLOSS cards turning over" />
      <figcaption className="mt-1 text-[0.92rem] text-ink-2">Real cards from the game, drawn by my brother.</figcaption>
    </figure>
  )
}
