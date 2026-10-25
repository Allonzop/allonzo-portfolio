import { lazy, Suspense, useEffect, useState } from 'react'
import { useStore } from './store'
import { Hud } from './ui/Hud'
import { ListMode } from './ui/ListMode'

const Experience = lazy(() => import('./three/Experience'))

const hasWebGL = () => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function App() {
  const mode = useStore((s) => s.mode)
  const forceFallback = useStore((s) => s.forceFallback)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (mode === 'game' && !hasWebGL()) forceFallback()
    setReady(true)
  }, [mode, forceFallback])

  if (!ready) return null
  if (mode === 'list') return <ListMode />
  return (
    <>
      <Suspense fallback={null}>
        <Experience />
      </Suspense>
      <Hud />
    </>
  )
}
