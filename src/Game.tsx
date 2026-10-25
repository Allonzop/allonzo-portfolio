import { lazy, Suspense } from 'react'
import { Hud } from './ui/Hud'

const Experience = lazy(() => import('./three/Experience'))

/** The 3D plant and its HUD; loaded only when the visitor plays */
export default function Game() {
  return (
    <>
      <Suspense fallback={null}>
        <Experience />
      </Suspense>
      <Hud />
    </>
  )
}
