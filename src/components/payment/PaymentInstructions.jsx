import { useEffect, useState } from 'react'
import { ModalOverlay } from '../ui'
import {
  fetchPaymentSettings, hasPaymentChannels, orderReference, formatAmount,
} from '../../lib/paymentInfo'

const AMBER = { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', soft: '#B45309', icon: '#D97706' }

function CopyBtn({ value, label }) {
  const [done, setDone] = useState(false)
  if (!value) return null
  return (
    <button
      type="button"
      aria-label={`Copiar ${label}`}
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1800)
        }).catch(() => {})
      }}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '.25rem', padding: '.2rem .45rem', borderRadius: 6, border: `1px solid ${AMBER.border}`, background: 'white', color: AMBER.soft, fontSize: '.66rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', flexShrink: 0 }}>
      {done ? '¡Copiado!' : 'Copiar'}
    </button>
  )
}

function DataRow({ label, value, mono }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.6rem', padding: '.5rem 0', borderBottom: `1px solid ${AMBER.border}` }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '.68rem', fontWeight: 700, color: AMBER.soft, letterSpacing: '.05em', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '.85rem', fontWeight: 700, color: AMBER.text, fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'var(--sans)', wordBreak: 'break-word' }}>{value}</div>
      </div>
      <CopyBtn value={value} label={label} />
    </div>
  )
}

/**
 * Panel con todo lo que el estudiante necesita para pagar una orden pendiente.
 * Se usa tal cual dentro del modal posterior a la solicitud y dentro de «Mis
 * compras», para que ambas superficies digan exactamente lo mismo.
 */
export function PaymentInstructions({ order, courseTitle, compact }) {
  const [settings, setSettings] = useState(null)

  useEffect(() => { fetchPaymentSettings().then(setSettings) }, [])

  const ref = orderReference(order?.id)
  const contact = settings?.contact_email
  const channels = hasPaymentChannels(settings)

  return (
    <div style={{ background: AMBER.bg, border: `1px solid ${AMBER.border}`, borderRadius: 10, padding: compact ? '.9rem 1rem' : '1.1rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.6rem' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={AMBER.icon} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span style={{ fontSize: '.84rem', fontWeight: 700, color: AMBER.text }}>Cómo completar tu pago</span>
      </div>

      {courseTitle && (
        <p style={{ fontSize: '.78rem', color: AMBER.soft, margin: '0 0 .6rem', lineHeight: 1.5 }}>{courseTitle}</p>
      )}

      <DataRow label="Referencia" value={ref} mono />
      {order?.amount != null && (
        <DataRow label="Monto a pagar" value={formatAmount(order.amount, order.currency)} />
      )}

      {settings === null ? (
        <p style={{ fontSize: '.76rem', color: AMBER.soft, margin: '.6rem 0 0' }}>Cargando datos de pago…</p>
      ) : (
        <>
          <DataRow label="SINPE Móvil" value={settings.sinpe_number} mono />
          <DataRow label="Cuenta bancaria" value={settings.bank_account} mono />

          {!channels && (
            <p style={{ fontSize: '.78rem', color: AMBER.text, margin: '.7rem 0 0', lineHeight: 1.55, fontWeight: 600 }}>
              {contact
                ? <>Aún no hay medios de pago publicados. Escríbenos a <a href={`mailto:${contact}`} style={{ color: AMBER.text }}>{contact}</a> indicando la referencia <strong>{ref}</strong> y te confirmamos cómo pagar.</>
                : <>Aún no hay medios de pago publicados. Contáctanos indicando la referencia <strong>{ref}</strong> y te confirmamos cómo pagar.</>}
            </p>
          )}

          {settings.payment_instructions && (
            <p style={{ fontSize: '.78rem', color: AMBER.soft, margin: '.7rem 0 0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {settings.payment_instructions}
            </p>
          )}

          {channels && (
            <p style={{ fontSize: '.78rem', color: AMBER.text, margin: '.7rem 0 0', lineHeight: 1.6 }}>
              Incluye la referencia <strong>{ref}</strong> en el detalle de la transferencia y envía el comprobante
              {contact ? <> a <a href={`mailto:${contact}`} style={{ color: AMBER.text, fontWeight: 700 }}>{contact}</a></> : ' a nuestro equipo'}.
            </p>
          )}

          {settings.payment_note && (
            <p style={{ fontSize: '.75rem', color: AMBER.soft, margin: '.7rem 0 0', paddingTop: '.6rem', borderTop: `1px solid ${AMBER.border}`, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
              {settings.payment_note}
            </p>
          )}
        </>
      )}
    </div>
  )
}

/** Modal de confirmación que se abre justo después de solicitar la inscripción. */
export function PaymentInstructionsModal({ order, courseTitle, onClose }) {
  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 460, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(23,26,28,.18)' }}>
        <div style={{ width: 46, height: 46, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .9rem', color: 'var(--jade-ink)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--carbon)', textAlign: 'center', marginBottom: '.35rem' }}>
          Solicitud registrada
        </h3>
        <p style={{ fontSize: '.82rem', color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.6, fontWeight: 400, marginBottom: '1.15rem' }}>
          Tu lugar aún no está confirmado. Sigue estos pasos para completar el pago — también te enviamos esta información por correo.
        </p>

        <PaymentInstructions order={order} courseTitle={courseTitle} />

        <button onClick={onClose}
          style={{ width: '100%', marginTop: '1.15rem', padding: '.8rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 9, fontSize: '.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
          Entendido
        </button>
        <p style={{ fontSize: '.72rem', color: 'var(--text-3)', textAlign: 'center', margin: '.7rem 0 0', lineHeight: 1.5 }}>
          Puedes volver a ver estas instrucciones en <strong>Mis compras</strong>.
        </p>
      </div>
    </ModalOverlay>
  )
}
