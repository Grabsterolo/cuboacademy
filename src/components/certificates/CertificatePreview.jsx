/**
 * Vista previa del certificado.
 *
 * Réplica del PDF que genera la edge function `approve-certificate`: mismo
 * orden de líneas, mismo texto fijo y mismas proporciones (A4 apaisado,
 * 842×595 pt). La versión anterior mostraba una frase inventada
 * («[Nombre] completó exitosamente X») que no aparecía en ningún certificado
 * real, así que un instructor no podía darse cuenta de una errata mirándola.
 *
 * Si se cambia el diseño del PDF hay que cambiar esto a la vez; es el precio
 * de tener una previsualización que de verdad sirva para revisar el texto.
 */

const JADE = 'var(--jade-ink)'
const CARBON = '#17211f'
const GREY = '#6b6a61'
const CREAM = '#f6f3ee'

export function CertificatePreview({ certName, isEvent = false, instructorName }) {
  const courseName = (certName || '').trim() || (isEvent ? 'Nombre del evento' : 'Nombre del curso')
  const missing = !(certName || '').trim()
  const today = new Date().toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div>
      {/* aspect-ratio fija la proporción real del PDF; el resto se escala con
          cqw para que el texto guarde su tamaño relativo a cualquier ancho. */}
      <div style={{
        containerType: 'inline-size',
        aspectRatio: '842 / 595',
        background: CREAM,
        borderRadius: 6,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(23,26,28,.10)',
      }}>
        <div style={{ position: 'absolute', inset: '2.8cqw', border: `0.24cqw solid ${JADE}` }} />
        <div style={{ position: 'absolute', inset: '3.8cqw', border: `0.09cqw solid ${JADE}` }} />

        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center', padding: '6.5cqw 8cqw 5cqw',
        }}>
          {/* marca: cuadrados anidados, igual que en el PDF */}
          <div style={{ width: '3.3cqw', height: '3.3cqw', border: `0.18cqw solid ${JADE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.9cqw' }}>
            <div style={{ width: '1.2cqw', height: '1.2cqw', background: JADE }} />
          </div>

          <div style={{ fontSize: '1.31cqw', fontWeight: 700, letterSpacing: '.12em', color: JADE, fontFamily: 'var(--sans)' }}>
            CUBO CAMPUS
          </div>

          <div style={{ fontSize: '3.2cqw', fontWeight: 700, color: CARBON, fontFamily: 'var(--serif)', marginTop: '2.6cqw' }}>
            {isEvent ? 'Certificado de Participación' : 'Certificado de Finalización'}
          </div>

          <div style={{ fontSize: '1.54cqw', color: GREY, fontStyle: 'italic', fontFamily: 'var(--serif)', marginTop: '3.1cqw' }}>
            Se otorga el presente certificado a
          </div>

          <div style={{ fontSize: '3.56cqw', fontWeight: 700, color: JADE, fontFamily: 'var(--serif)', marginTop: '1.2cqw' }}>
            Nombre del estudiante
          </div>

          <div style={{ fontSize: '1.54cqw', color: GREY, fontStyle: 'italic', fontFamily: 'var(--serif)', marginTop: '2.2cqw' }}>
            {isEvent ? 'por haber participado en el evento' : 'por haber completado exitosamente el curso'}
          </div>

          <div style={{
            fontSize: '2.14cqw', fontWeight: 700, fontFamily: 'var(--serif)', marginTop: '1.1cqw',
            color: missing ? '#B45309' : CARBON,
            fontStyle: missing ? 'italic' : 'normal',
          }}>
            {courseName}
          </div>

          <div style={{ width: '21.4cqw', height: '0.12cqw', background: JADE, marginTop: '1.5cqw' }} />

          <div style={{ display: 'flex', width: '100%', marginTop: 'auto', paddingBottom: '1cqw' }}>
            {[
              ['INSTRUCTOR', instructorName || 'Cubo Campus'],
              ['FECHA', today],
              ['CÓDIGO DE VERIFICACIÓN', 'CUBO-…'],
            ].map(([label, value]) => (
              <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '0.95cqw', fontWeight: 700, letterSpacing: '.07em', color: GREY, fontFamily: 'var(--sans)' }}>{label}</div>
                <div style={{ fontSize: '1.43cqw', color: CARBON, fontFamily: 'var(--serif)', marginTop: '.5cqw' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p style={{ fontSize: '.73rem', color: 'var(--text-2)', margin: '.6rem 0 0', lineHeight: 1.5 }}>
        El nombre del estudiante, la fecha y el código se rellenan al emitirlo. Todo lo demás sale
        exactamente así impreso — revisa la ortografía de <strong>{isEvent ? 'el nombre del evento' : 'el nombre del curso'}</strong>.
      </p>
    </div>
  )
}
