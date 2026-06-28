import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { INSTRUCTOR_NAV } from '../../../config/navigation'

const FEATURES = [
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    title: 'Resultados por quiz',
    desc: 'Visualiza las respuestas y puntajes de cada estudiante en los quizzes de tus cursos.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    title: 'Estadísticas de rendimiento',
    desc: 'Tasa de aprobación, promedio de intentos y preguntas con mayor dificultad.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    title: 'Historial de intentos',
    desc: 'Consulta el historial completo de evaluaciones por estudiante y por lección.',
  },
]

export default function InstructorEvaluationsPage() {
  return (
    <DashboardLayout navItems={INSTRUCTOR_NAV}>
      <style>{`
        @media (max-width: 768px) { .ev-pad { padding: 1.25rem 1rem 2rem !important; } .ev-grid { grid-template-columns: 1fr !important; } }
        .ev-feat { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; gap: .75rem; }
      `}</style>

      <div className="ev-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Instructor</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Evaluaciones</h1>
        </div>

        {/* Próximamente card */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '3rem 2.5rem', textAlign: 'center', marginBottom: '2rem', maxWidth: 540 }}>
          <div style={{ width: 64, height: 64, background: 'var(--jade-soft)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--jade)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <span style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--jade)', background: 'var(--jade-soft)', padding: '4px 12px', borderRadius: 20, display: 'inline-block', marginBottom: '1rem' }}>
            Próximamente
          </span>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.35rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.25, marginBottom: '.75rem' }}>
            Centro de evaluaciones
          </h2>
          <p style={{ fontSize: '.875rem', color: 'var(--text-2)', lineHeight: 1.7, fontWeight: 300 }}>
            Aquí podrás revisar el rendimiento de tus estudiantes en los quizzes y ejercicios de tus cursos, con estadísticas detalladas por lección y por alumno.
          </p>
        </div>

        {/* Feature cards */}
        <div className="ev-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', maxWidth: 800 }}>
          {FEATURES.map(f => (
            <div key={f.title} className="ev-feat">
              <div style={{ width: 42, height: 42, background: 'var(--jade-soft)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--jade)' }}>{f.icon}</div>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.3rem' }}>{f.title}</div>
                <div style={{ fontSize: '.79rem', color: 'var(--text-2)', lineHeight: 1.6, fontWeight: 300 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
