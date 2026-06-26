import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.jsx'
import { supabase } from './lib/supabase.js'

async function init() {
  try {
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'primary_color')
      .single()
    if (data?.value) {
      document.documentElement.style.setProperty('--jade', data.value)
    }
  } catch (_) {}

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

init()
