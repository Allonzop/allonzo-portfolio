import gsap from 'gsap'
import type { RoomId } from '../content/rooms'

// tweens follow real time even when frames are slow, so sequences never crawl
gsap.ticker.lagSmoothing(0)

/**
 * Live, non-React state of every room, read each frame by the scene.
 * light: ceiling fixtures and room light. equip: fans, pulses, screens.
 */
export type PowerId = RoomId | 'building' | 'site'

export const power: Record<PowerId, { light: number; equip: number }> = {
  solar: { light: 0, equip: 0 },
  plant: { light: 0, equip: 0 },
  boatyard: { light: 0, equip: 0 },
  parking: { light: 0, equip: 0 },
  lab: { light: 0, equip: 0 },
  studio: { light: 0, equip: 0 },
  arcade: { light: 0, equip: 0 },
  control: { light: 0, equip: 0 },
  building: { light: 0, equip: 0 },
  /** the yard outside: street lamps, energised when the visitor starts */
  site: { light: 0, equip: 0 },
}

/** Lights flicker on like old tubes, then equipment spins up */
export const commissionRoom = (id: PowerId, reduced: boolean, delay = 0) => {
  const p = power[id]
  if (reduced) {
    gsap.to(p, { light: 1, equip: 1, duration: 0.4, ease: 'power1.out' })
    return
  }
  const tl = gsap.timeline({ delay })
  const flicks = [0.55, 0.05, 0.8, 0.15, 0.35, 0.0, 1]
  flicks.forEach((v, i) => tl.to(p, { light: v, duration: i === flicks.length - 1 ? 0.35 : 0.05 + Math.random() * 0.09, ease: 'none' }))
  tl.to(p, { equip: 1, duration: 1.6, ease: 'power2.inOut' }, 0.45)
}
