import { Link } from 'react-router-dom'

const COLS = [
  {
    title: 'Plataforma',
    links: ['Explorar cursos', 'Instructores', 'Certificaciones', 'Para empresas'],
  },
  {
    title: 'Áreas',
    links: ['Gestión de Procesos', 'Datos & Analytics', 'Liderazgo'],
  },
  {
    title: 'Empresa',
    links: ['Acerca de', 'Grupo Cubo 130', 'Contacto', 'Términos'],
  },
]

export default function Footer() {
  return (
    <>
      <style>{`
        .footer-link { font-size: .8rem; color: var(--text-2); font-weight: 300; transition: color .2s; -webkit-tap-highlight-color: transparent; }
        .footer-link:hover { color: var(--jade); }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 3rem; padding-bottom: 2.5rem; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem; }
        .footer-copy { display: flex; justify-content: space-between; font-size: .74rem; color: #B5B2AB; }
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr 1fr; gap: 2rem; }
          .footer-brand { grid-column: 1 / -1; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr; gap: 1.5rem; }
          .footer-copy { flex-direction: column; gap: .4rem; text-align: center; }
        }
      `}</style>
      <footer style={{ background: 'white', borderTop: '1px solid var(--border)', padding: '3rem 5% max(2rem, env(safe-area-inset-bottom))' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="footer-grid">
            <div className="footer-brand">
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, marginBottom: '.7rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <span style={{ color: 'var(--carbon)' }}>Cubo </span>
                <span style={{ color: 'var(--jade)' }}>Academy</span>
              </div>
              <p style={{ fontSize: '.8rem', color: 'var(--text-2)', lineHeight: 1.65, fontWeight: 300, maxWidth: 280 }}>
                Formación consultiva en procesos, datos y liderazgo. Diseñada por quienes trabajan en el campo, para quienes quieren transformar sus organizaciones.
              </p>
            </div>
            {COLS.map((col) => (
              <div key={col.title}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#B5B2AB', marginBottom: '.85rem' }}>
                  {col.title}
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link to="#" className="footer-link">{link}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="footer-copy">
            <span>© 2025 Cubo Academy · Grupo Cubo 130 S.A.</span>
            <span>Hecho con propósito</span>
          </div>
        </div>
      </footer>
    </>
  )
}
