/** Shared painter for the BOLOSS card loop: the arcade screen and the panel. Cards are the real ones, drawn by my brother. */
const FACES = ['floral-hero', 'avocat-hero', 'jules-hero', 'monster-hero', 'soldat-hero', 'floral-reine-rosy', 'avocat-lancer-tortue']
const FALLBACK = ['#c0392b', '#2e6da4', '#e2a72e', '#2f8a59', '#7c4fb0']

let images: { back: HTMLImageElement; faces: HTMLImageElement[] } | null = null
const ready = (im: HTMLImageElement) => im.complete && im.naturalWidth > 0

function load() {
  if (images || typeof Image === 'undefined') return images
  const mk = (name: string) => {
    const im = new Image()
    im.decoding = 'async'
    im.src = `/media/arcade/${name}.webp`
    return im
  }
  images = { back: mk('card-back'), faces: FACES.map(mk) }
  return images
}

export function paintCardsInto(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
  const imgs = load()
  ctx.fillStyle = '#120d1c'
  ctx.fillRect(0, 0, w, h)
  const ch = h * 0.78
  const cw = ch * (371 / 520)
  const gap = cw * 0.18
  for (let i = 0; i < 3; i++) {
    // each card turns over in turn, then a new face comes up
    const cycle = t * 0.55 + i * 0.6
    const phase = cycle % 3
    const round = Math.floor(cycle / 3)
    const flip = Math.max(0, Math.min(1, phase - 1.2))
    const sx = Math.abs(Math.cos(flip * Math.PI))
    const face = flip > 0.5
    const cx = w / 2 + (i - 1) * (cw + gap)
    const cy = h / 2
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(Math.max(0.03, sx), 1)
    const faceImg = imgs?.faces[(i * 2 + round) % FACES.length]
    const img = face ? faceImg : imgs?.back
    if (img && ready(img)) {
      ctx.drawImage(img, -cw / 2, -ch / 2, cw, ch)
    } else {
      ctx.fillStyle = face ? '#f3eee2' : '#0b0b0b'
      ctx.fillRect(-cw / 2, -ch / 2, cw, ch)
      ctx.fillStyle = FALLBACK[(i + round) % FALLBACK.length]
      if (face) ctx.fillRect(-cw / 2 + 10, -ch / 2 + 14, cw - 20, ch * 0.45)
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 2
    ctx.strokeRect(-cw / 2, -ch / 2, cw, ch)
    ctx.restore()
  }
}
