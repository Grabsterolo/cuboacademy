import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { INP, fi, fb } from '../ui'

/**
 * Fila de «Contraseña» de Configuración, compartida por estudiante e instructor.
 *
 * Cambiar la contraseña sin salir de la sesión es la vía que funciona siempre:
 * el enlace por correo depende de que el correo se entregue y de que el Site
 * URL de Auth apunte al sitio de verdad, y cuando alguno de los dos falla la
 * persona se queda sin forma de entrar. Aquí basta con saber la actual.
 *
 * Esa comprobación no la hace `updateUser`, que cambia la contraseña de quien
 * tenga la sesión abierta sin preguntar nada más. Por eso primero se vuelve a
 * iniciar sesión con la contraseña actual: si es la correcta, la sesión se
 * renueva para la misma persona y no se nota; si no lo es, no se toca nada.
 */

const MIN = 8

export default function ChangePasswordRow() {
  const { user } = useAuth()

  const [abierto, setAbierto] = useState(false)
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [hecho, setHecho] = useState(false)

  // El enlace por correo sigue estando, pero como salida secundaria: es lo
  // único que sirve cuando alguien no recuerda su contraseña actual.
  const [enviando, setEnviando] = useState(false)
  const [avisoCorreo, setAvisoCorreo] = useState('')

  function cerrar() {
    setAbierto(false)
    setActual(''); setNueva(''); setRepetir('')
    setError(''); setHecho(false)
  }

  async function enviarEnlace() {
    if (!user?.email) return
    setEnviando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin,
    })
    setEnviando(false)
    setAvisoCorreo(error ? 'No se pudo enviar el correo.' : `Enlace enviado a ${user.email}`)
    setTimeout(() => setAvisoCorreo(''), 5000)
  }

  async function guardar(e) {
    e.preventDefault()
    setError('')

    if (nueva.length < MIN) { setError(`La contraseña nueva debe tener al menos ${MIN} caracteres.`); return }
    if (nueva !== repetir)  { setError('Las dos contraseñas nuevas no coinciden.'); return }
    if (nueva === actual)   { setError('La contraseña nueva tiene que ser distinta de la actual.'); return }
    if (!user?.email)       { setError('No se pudo leer tu correo. Vuelve a entrar e inténtalo de nuevo.'); return }

    setGuardando(true)

    const { error: errActual } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: actual,
    })
    if (errActual) {
      setGuardando(false)
      setError('La contraseña actual no es correcta.')
      return
    }

    const { error: errNueva } = await supabase.auth.updateUser({ password: nueva })
    setGuardando(false)
    if (errNueva) {
      // Auth rechaza aquí, por ejemplo, una contraseña que ya se filtró en
      // alguna brecha conocida. El mensaje suyo es más útil que uno genérico.
      setError(errNueva.message || 'No se pudo cambiar la contraseña.')
      return
    }

    setActual(''); setNueva(''); setRepetir('')
    setHecho(true)
  }

  const campo = (etiqueta, valor, onChange, autocomplete) => (
    <label style={{ display: 'block', marginBottom: '.8rem' }}>
      <span style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: '.35rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>
        {etiqueta}
      </span>
      <input type="password" value={valor} onChange={e => onChange(e.target.value)}
        autoComplete={autocomplete} style={INP} onFocus={fi} onBlur={fb} />
    </label>
  )

  return (
    <div style={{ padding: '1.1rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--carbon)' }}>Contraseña</div>
          <div style={{ fontSize: '.75rem', color: 'var(--text-2)', marginTop: '.2rem', fontWeight: 300 }}>
            Cambiala indicando la actual y una nueva.
          </div>
        </div>
        <button onClick={() => (abierto ? cerrar() : setAbierto(true))}
          style={{ flexShrink: 0, padding: '.45rem 1rem', background: abierto ? 'white' : 'var(--jade)', border: abierto ? '1px solid var(--border)' : 'none', borderRadius: 7, fontSize: '.8rem', fontWeight: 600, color: abierto ? 'var(--carbon)' : 'white', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
          {abierto ? 'Cancelar' : 'Cambiar contraseña'}
        </button>
      </div>

      {abierto && (
        <form onSubmit={guardar} style={{ marginTop: '1.1rem', paddingTop: '1.1rem', borderTop: '1px solid var(--border)' }}>
          {hecho ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '.84rem', color: 'var(--jade-ink, var(--jade))', margin: 0, fontWeight: 600 }}>
                Contraseña cambiada. Usa la nueva la próxima vez que entres.
              </p>
              <button type="button" onClick={cerrar}
                style={{ padding: '.45rem 1rem', background: 'white', border: '1px solid var(--border)', borderRadius: 7, fontSize: '.8rem', fontWeight: 600, color: 'var(--carbon)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                Cerrar
              </button>
            </div>
          ) : (
            <>
              <div style={{ maxWidth: 380 }}>
                {campo('Contraseña actual', actual, setActual, 'current-password')}
                {campo('Contraseña nueva', nueva, setNueva, 'new-password')}
                {campo('Repetir la nueva', repetir, setRepetir, 'new-password')}
              </div>

              <p style={{ fontSize: '.73rem', color: 'var(--text-3)', margin: '0 0 1rem' }}>
                Mínimo {MIN} caracteres.
              </p>

              {error && (
                <p style={{ fontSize: '.79rem', color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '.55rem .8rem', margin: '0 0 1rem', maxWidth: 380 }}>
                  {error}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button type="submit" disabled={guardando || !actual || !nueva || !repetir}
                  style={{ padding: '.5rem 1.15rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 7, fontSize: '.82rem', fontWeight: 600, cursor: guardando ? 'wait' : 'pointer', fontFamily: 'var(--sans)', opacity: (guardando || !actual || !nueva || !repetir) ? .55 : 1 }}>
                  {guardando ? 'Guardando…' : 'Guardar contraseña'}
                </button>

                <button type="button" onClick={enviarEnlace} disabled={enviando}
                  style={{ padding: 0, background: 'none', border: 'none', fontSize: '.78rem', color: 'var(--text-2)', textDecoration: 'underline', cursor: enviando ? 'wait' : 'pointer', fontFamily: 'var(--sans)' }}>
                  {enviando ? 'Enviando…' : '¿No recuerdas la actual? Recibe un enlace por correo'}
                </button>
              </div>

              {avisoCorreo && (
                <p style={{ fontSize: '.74rem', color: avisoCorreo.startsWith('No se pudo') ? '#dc2626' : 'var(--jade)', margin: '.6rem 0 0' }}>
                  {avisoCorreo}
                </p>
              )}
            </>
          )}
        </form>
      )}
    </div>
  )
}
