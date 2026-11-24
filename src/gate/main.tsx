import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles'
import { Gate } from './Gate'

// the landing page at /gate/: public, built on its own (vite.gate.config.ts)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Gate />
  </StrictMode>,
)
