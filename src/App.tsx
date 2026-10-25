import { lazy, Suspense, useState } from 'react'
import { useStore } from './store'

const Game = lazy(() => import('./Game'))
const ListMode = lazy(() => import('./ui/ListMode'))

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
  // no WebGL: straight to the list, before anything 3D is fetched
  useState(() => {
    if (useStore.getState().mode === 'game' && !hasWebGL()) useStore.getState().forceFallback()
  })
  return <Suspense fallback={null}>{mode === 'list' ? <ListMode /> : <Game />}</Suspense>
}
