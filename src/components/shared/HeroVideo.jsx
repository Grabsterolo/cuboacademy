import { useHeroMedia } from '../../hooks/useHeroMedia'

/**
 * Fondo de vídeo de la portada.
 *
 * El póster va siempre, tanto en el atributo del <video> como de imagen de
 * respaldo: es lo que pinta mientras el vídeo aún no ha llegado, así que el
 * hero deja de aparecer en negro durante la descarga.
 *
 * El orden de <source> importa: WebM/AV1 primero porque pesa menos, MP4
 * después para quien no lo soporte. El navegador se queda con el primero que
 * entienda, no descarga los dos.
 */
export function HeroVideo({ settings, overlay = 'linear-gradient(140deg, rgba(8,26,30,.82), rgba(13,56,52,.75))' }) {
  const { playVideo, poster, mp4, webm } = useHeroMedia(settings)

  const fill = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }

  return (
    <>
      {playVideo ? (
        // preload="none": el póster ya cubre el primer pintado, así que el
        // vídeo no compite por ancho de banda con el resto de la página.
        <video key={`${webm}|${mp4}`} poster={poster || undefined}
          autoPlay muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1}
          style={fill}>
          {webm && <source src={webm} type="video/webm" />}
          {mp4 && <source src={mp4} type="video/mp4" />}
        </video>
      ) : poster ? (
        <img src={poster} alt="" aria-hidden="true" style={fill} />
      ) : null}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: overlay }} />
    </>
  )
}
