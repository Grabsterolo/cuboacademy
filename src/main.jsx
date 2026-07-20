import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.jsx'

// The custom accent color (platform_settings.primary_color) is applied by
// SettingsContext once it loads — no need to block first paint on a fetch
// for it here too, that was a duplicate round-trip against the same table.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
