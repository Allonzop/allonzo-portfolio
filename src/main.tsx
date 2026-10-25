import '@fontsource-variable/archivo/wdth.css'
import '@fontsource/b612-mono/latin-400.css'
import '@fontsource/b612-mono/latin-700.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
