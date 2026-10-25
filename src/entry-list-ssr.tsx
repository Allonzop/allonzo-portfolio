import { Suspense } from 'react'
import { renderToString } from 'react-dom/server'
import ListMode from './ui/ListMode'

/** Build-time render of the list mode, so /list paints before any JavaScript runs */
export function render() {
  return renderToString(
    <Suspense fallback={null}>
      <ListMode />
    </Suspense>,
  )
}
