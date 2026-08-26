import { useEffect, useState } from 'react'

/**
 * Decide si el vídeo de portada debe reproducirse, y con qué respaldo.
 *
 * Se respetan dos preferencias del sistema, no una:
 *
 * - prefers-reduced-data (y navigator.connection.saveData): ya estaba, y se
 *   mantiene. Quien navega con datos limitados no debería gastarlos en un
 *   fondo decorativo.
 * - prefers-reduced-motion: es nuevo. Un bucle de vídeo a pantalla completa es
 *   exactamente el tipo de movimiento que activan quienes lo desactivan por
 *   vértigo o migrañas, y hasta ahora se les servía igual.
 *
 * Las media queries se escuchan, no se leen una sola vez al montar. Antes se
 * consultaban en el useEffect inicial y el valor se quedaba congelado, así que
 * activar la preferencia con la pestaña abierta no tenía ningún efecto.
 *
 * Cuando el vídeo se suprime NO se cae al fondo animado de burbujas: eso sería
 * cambiar un movimiento por otro. Se usa el póster fijo si existe.
 */
export function useHeroMedia(settings) {
  const [reducedData, setReducedData] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const queries = [
      ['(prefers-reduced-data: reduce)', setReducedData],
      ['(prefers-reduced-motion: reduce)', setReducedMotion],
    ]
    const cleanups = queries.map(([q, set]) => {
      const mq = window.matchMedia(q)
      const update = () => set(mq.matches)
      update()
      mq.addEventListener('change', update)
      return () => mq.removeEventListener('change', update)
    })
    // saveData no emite eventos; se consulta junto a la de datos.
    if (navigator.connection?.saveData) setReducedData(true)
    return () => cleanups.forEach(fn => fn())
  }, [])

  const mp4 = settings?.hero_video_url || ''
  const webm = settings?.hero_video_webm_url || ''
  const poster = settings?.hero_poster_url || ''

  return {
    poster,
    mp4,
    webm,
    hasVideo: Boolean(mp4 || webm),
    // El motivo se devuelve para poder explicarlo en el panel, no para el
    // visitante: a quien pidió menos movimiento no hay que darle un aviso.
    suppressed: reducedData ? 'datos' : reducedMotion ? 'movimiento' : null,
    playVideo: Boolean(mp4 || webm) && !reducedData && !reducedMotion,
  }
}
