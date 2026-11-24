import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles'
import './gate.css'
import { Privacy } from './PrivacyText'

// /gate/privacy: public, so anyone can read it before signing up
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="privacy-page">
      <article className="gate-privacy">
        <Privacy />
        <nav>
          <a href="/gate/">← back to the door</a>
        </nav>
      </article>
    </main>
  </StrictMode>,
)
