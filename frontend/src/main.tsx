import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installWebCrypto } from './kernel/crypto'
import './index.css'
import App from './App.tsx'

installWebCrypto()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
