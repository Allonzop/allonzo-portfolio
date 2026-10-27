import { lazy, Suspense, useState } from 'react'
import { useStore } from './store'
import { Hud } from './ui/Hud'

const Experience = lazy(() => import('./three/Experience'))
const LiftMode = lazy(() => import('./ui/LiftMode'))

/** Phones ride a lift down through the plant; wider screens walk it */
const isPhone = () => window.matchMedia('(max-width: 759px)').matches

/** The 3D plant and its HUD; loaded only when the visitor plays */
export default function Game() {
  const [lift] = useState(() => {
    const on = isPhone()
    useStore.getState().setLift(on)
    return on
  })
  return (
    <>
      <Suspense fallback={null}>
        <Experience lift={lift} />
      </Suspense>
      {lift ? (
        <Suspense fallback={null}>
          <LiftMode />
        </Suspense>
      ) : (
        <Hud />
      )}
    </>
  )
}
