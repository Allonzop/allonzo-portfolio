/** Shared painter for the BOLOSS card loop: the arcade screen and the panel */
const CARD_COLORS = ['#c0392b', '#2e6da4', '#e2a72e', '#2f8a59', '#7c4fb0']

export function paintCardsInto(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
  ctx.fillStyle = '#120d1c'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#ffd36a'
  ctx.font = 'condensed 900 46px "Archivo Variable", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('BOLOSS', w / 2, 56)
  ctx.textAlign = 'left'
  // three cards flip in turn
  for (let i = 0; i < 3; i++) {
    const phase = (t * 0.8 + i * 0.7) % 3
    const flip = Math.max(0, Math.min(1, phase - 1))
    const sx = Math.abs(Math.cos(flip * Math.PI))
    const face = flip > 0.5
    const cw = 78
    const ch = 112
    const cx = w / 2 + (i - 1) * 100
    const cy = h / 2 + 30
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(Math.max(0.04, sx), 1)
    ctx.fillStyle = face ? '#f3eee2' : '#2a1f3d'
    ctx.fillRect(-cw / 2, -ch / 2, cw, ch)
    ctx.strokeStyle = face ? CARD_COLORS[(i + Math.floor(t / 3)) % CARD_COLORS.length] : '#ffd36a'
    ctx.lineWidth = 5
    ctx.strokeRect(-cw / 2 + 5, -ch / 2 + 5, cw - 10, ch - 10)
    if (face) {
      ctx.fillStyle = CARD_COLORS[(i + Math.floor(t / 3)) % CARD_COLORS.length]
      ctx.fillRect(-cw / 2 + 14, -ch / 2 + 16, cw - 28, 46)
      ctx.fillStyle = '#141414'
      ctx.font = '700 16px "B612 Mono", monospace'
      ctx.fillText(`${2 + i} / ${3 + ((i * 2) % 4)}`, -cw / 2 + 14, ch / 2 - 18)
    }
    ctx.restore()
  }
}
