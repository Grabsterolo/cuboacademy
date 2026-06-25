import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/shared/Navbar'
import Footer from './components/shared/Footer'
import ProtectedRoute from './components/shared/ProtectedRoute'
import HomePage from './pages/public/HomePage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <Navbar />
      <main style={{ paddingTop: 66 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cursos" element={<div style={{ padding: '8rem 5%', textAlign: 'center', fontFamily: 'var(--serif)', fontSize: '2rem', color: 'var(--carbon)' }}>Catálogo de cursos — próximamente</div>} />
          <Route path="/registro" element={<div style={{ padding: '8rem 5%', textAlign: 'center', fontFamily: 'var(--serif)', fontSize: '2rem', color: 'var(--carbon)' }}>Registro — próximamente</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div style={{ padding: '8rem 5%', textAlign: 'center', fontFamily: 'var(--serif)', fontSize: '2rem', color: 'var(--carbon)' }}>
                  Dashboard — próximamente
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
      </AuthProvider>
    </BrowserRouter>
  )
}
