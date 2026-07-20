import { StepHeader } from '../components/StepHeader'
import { IC, stripHtml } from '../components/shared'

export function Step7Preview({ info, modules, eval: ev, cert, pricing }) {
  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0)

  const checks = [
    { label: 'Tiene título',      ok: Boolean(info.title.trim()) },
    { label: 'Tiene descripción', ok: Boolean(stripHtml(info.description)) },
    { label: 'Tiene portada',     ok: Boolean(info.coverUrl) },
    { label: 'Tiene estructura',  ok: modules.length > 0 && totalLessons > 0 },
    { label: 'Tiene contenido',   ok: modules.some(m => m.lessons.some(l => l.video_url || l.content_text)) },
  ]
  const ready = checks.every(c => c.ok)

  return (
    <div>
      <StepHeader n={7} title="Vista previa" sub="Revisa el resumen de tu curso antes de publicar." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="wiz-grid">
        {/* Course card preview */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ aspectRatio: '16/9', background: 'linear-gradient(140deg,#0d3840,#082830)', position: 'relative' }}>
            {info.coverUrl
              ? <img loading="lazy" src={info.coverUrl} alt="Portada" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,.3)' }}>{IC.image}</div>
            }
          </div>
          <div style={{ padding: '1.25rem' }}>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', margin: '0 0 .35rem', lineHeight: 1.3 }}>
              {info.title || 'Sin título'}
            </p>
            <p style={{ fontSize: '.8rem', color: 'var(--text-2)', margin: '0 0 .85rem', lineHeight: 1.5 }}>
              {stripHtml(info.description).slice(0, 120) || 'Sin descripción'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
              {!pricing.isFree && pricing.price ? (
                <span style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--jade)' }}>
                  ${pricing.discount ? (parseFloat(pricing.price) * (1 - parseFloat(pricing.discount) / 100)).toFixed(2) : parseFloat(pricing.price).toFixed(2)}
                </span>
              ) : (
                <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--jade)', padding: '.2rem .6rem', background: 'var(--jade-soft)', borderRadius: 6 }}>Gratuito</span>
              )}
              {cert.hasCert && (
                <span style={{ fontSize: '.75rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '.25rem' }}>{IC.star} Certificado</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Checklist */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem' }}>
            <p style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.9rem', color: 'var(--carbon)', margin: '0 0 .85rem' }}>Checklist de publicación</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {checks.map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: c.ok ? 'var(--jade)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {c.ok ? <span style={{ color: 'white' }}>{IC.check}</span> : null}
                  </div>
                  <span style={{ fontSize: '.83rem', color: c.ok ? 'var(--carbon)' : 'var(--text-2)' }}>{c.label}</span>
                </div>
              ))}
            </div>
            {ready && (
              <div style={{ marginTop: '1rem', padding: '.7rem', background: 'var(--jade-soft)', borderRadius: 8, fontSize: '.8rem', color: 'var(--jade)', fontWeight: 600 }}>
                ¡Tu curso está listo para publicar!
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem' }}>
            <p style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.9rem', color: 'var(--carbon)', margin: '0 0 .85rem' }}>Resumen</p>
            {[
              { label: 'Módulos', value: modules.length },
              { label: 'Lecciones', value: totalLessons },
              { label: 'Evaluación', value: ev.hasEval ? `Sí · ${ev.minScore}% mínimo` : 'No' },
              { label: 'Certificado', value: cert.hasCert ? 'Sí' : 'No' },
              { label: 'Precio', value: pricing.isFree ? 'Gratuito' : `$${pricing.price || '0'}` },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '.83rem', color: 'var(--text-2)' }}>{r.label}</span>
                <span style={{ fontSize: '.83rem', fontWeight: 600, color: 'var(--carbon)' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
