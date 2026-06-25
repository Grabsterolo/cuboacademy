import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ background: 'white', borderTop: '1px solid var(--border)', padding: '1.5rem 5%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
        <span style={{ fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 700 }}>
          <span style={{ color: 'var(--carbon)' }}>Cubo </span>
          <span style={{ color: 'var(--jade)' }}>Academy</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/cursos" style={{ fontSize: '.78rem', color: 'var(--text-2)', fontWeight: 400 }}>Cursos</Link>
          <Link to="/instructores" style={{ fontSize: '.78rem', color: 'var(--text-2)', fontWeight: 400 }}>Instructores</Link>
          <Link to="#" style={{ fontSize: '.78rem', color: 'var(--text-2)', fontWeight: 400 }}>Términos</Link>
        </div>
        <span style={{ fontSize: '.74rem', color: '#B5B2AB' }}>© 2025 Grupo Cubo 130 S.A.</span>
      </div>
    </footer>
  )
}
