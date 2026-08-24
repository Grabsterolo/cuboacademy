import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { runQuery } from '../lib/db'

const SettingsContext = createContext({})

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      const { data } = await runQuery(supabase.from('platform_settings').select('key, value'), 'SettingsContext: ajustes de plataforma')
      if (data) {
        const map = {}
        data.forEach(s => { map[s.key] = s.value })
        setSettings(map)
        if (map.primary_color) {
          document.documentElement.style.setProperty('--jade', map.primary_color)
        }
        if (map.platform_name) {
          document.title = map.platform_name
        }
      }
      setLoading(false)
    }
    loadSettings()
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, loading, setSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
