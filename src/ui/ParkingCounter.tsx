import { useStore } from '../store'

const fmt = (n: number) => n.toLocaleString('en-GB')

/** Live counter of the car park simulation: event-driven frames against a 1 Hz stream */
export function ParkingCounter({ live }: { live: boolean }) {
  const p = useStore((s) => s.parking)
  const setParking = useStore((s) => s.setParking)
  const done = useStore((s) => s.achievements.includes('parking-sim'))
  // a ratio means nothing until a few changes have actually been published
  const saved = p.sent >= 5 && p.stream ? `${((1 - p.sent / p.stream) * 100).toFixed(1)} %` : '…'
  return (
    <div className="mt-5 bg-plate p-4 text-engrave">
      <div className="engraved flex items-baseline justify-between text-[0.92rem] font-bold">
        <span>Car park sim · 12 sensor nodes</span>
        <span className="reading text-sodium">{Math.floor(p.seconds)} s</span>
      </div>
      <div className="reading mt-3 grid grid-cols-3 gap-3 text-[0.92rem]">
        <div>
          <div className="leading-none font-bold text-[#7dffb0]">{fmt(p.sent)}</div>
          <div className="mt-1 text-[#b9b4a8]">MQTT frames sent</div>
        </div>
        <div>
          <div className="leading-none font-bold text-[#ff8a7a]">{fmt(p.stream)}</div>
          <div className="mt-1 text-[#b9b4a8]">a 1 Hz stream would send</div>
        </div>
        <div>
          <div className="leading-none font-bold text-sodium">{saved}</div>
          <div className="mt-1 text-[#b9b4a8]">saved here</div>
        </div>
      </div>
      {live ? (
        <button
          type="button"
          disabled={p.running}
          onClick={() => setParking({ running: true })}
          className="engraved mt-4 w-full rounded-[3px] bg-go py-2.5 text-[0.92rem] font-bold text-go-ink transition-colors hover:bg-[#28825a] disabled:cursor-progress disabled:bg-[#2a3a31] disabled:text-[#9fb9a8]"
        >
          {p.running ? 'Running at 6× speed…' : done ? 'Run the sim again' : 'Run the parking sim'}
        </button>
      ) : null}
      <p className="mt-3 text-[0.92rem] leading-snug text-[#b9b4a8]">
        Cars come and go in the 3D car park; each LED is a node's state machine. Only confirmed changes are published.
      </p>
    </div>
  )
}
