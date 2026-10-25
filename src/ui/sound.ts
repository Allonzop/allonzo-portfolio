import { useEffect } from 'react'
import { useStore } from '../store'

/** Ambient plant-room hum, synthesised, off by default; a relay click on each commissioning */
let ctx: AudioContext | null = null
let master: GainNode | null = null

function ensure() {
  if (ctx) return ctx
  ctx = new AudioContext()
  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)
  // 50 Hz mains hum with a soft second harmonic
  for (const [f, g] of [
    [50, 0.05],
    [100, 0.025],
  ] as const) {
    const o = ctx.createOscillator()
    o.frequency.value = f
    const gain = ctx.createGain()
    gain.gain.value = g
    o.connect(gain).connect(master)
    o.start()
  }
  // air movement: brown noise through a low-pass
  const len = ctx.sampleRate * 2
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
    d[i] = last * 3.2
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 420
  const ng = ctx.createGain()
  ng.gain.value = 0.22
  src.connect(lp).connect(ng).connect(master)
  src.start()
  return ctx
}

function click() {
  if (!ctx || !master) return
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  o.type = 'square'
  o.frequency.setValueAtTime(1800, t)
  o.frequency.exponentialRampToValueAtTime(240, t + 0.06)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.08, t + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
  o.connect(g).connect(ctx.destination)
  o.start(t)
  o.stop(t + 0.15)
}

export function useAmbientSound() {
  const on = useStore((s) => s.sound)
  useEffect(() => {
    if (!on && !ctx) return
    const c = ensure()
    c.resume()
    master!.gain.cancelScheduledValues(c.currentTime)
    master!.gain.setTargetAtTime(on ? 0.6 : 0, c.currentTime, 0.4)
  }, [on])
  useEffect(
    () =>
      useStore.subscribe((s, prev) => {
        if (s.sound && s.commissioned.length > prev.commissioned.length) {
          click()
          window.setTimeout(click, 140)
        }
      }),
    [],
  )
}
