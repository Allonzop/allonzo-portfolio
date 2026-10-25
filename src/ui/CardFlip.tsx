import { useEffect, useRef } from 'react'
import { paintCardsInto } from './cardPaint'

/** Stylised card-flip loop standing in for a capture of the game */
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
      paintCardsInto(ctx, reduced ? 1.6 : (performance.now() - t0) / 1000, c.width, c.height)
      if (!reduced) raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <figure className="mt-5">
      <canvas ref={ref} width={640} height={360} className="block h-auto w-full border-2 border-ink" aria-label="Animated card flip in the style of BOLOSS" />
      <figcaption className="mt-1 text-[0.75rem] text-ink-2">Stylised loop. Cards are drawn by my brother.</figcaption>
    </figure>
  )
}
