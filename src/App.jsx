import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/shared/Navbar'
import Footer from './components/shared/Footer'
import ProtectedRoute from './components/shared/ProtectedRoute'
import HomePage from './pages/public/HomePage'
import DashboardRouter from './pages/dashboard/DashboardRouter'
import UsersPage from './pages/dashboard/admin/UsersPage'
import CategoriesPage from './pages/dashboard/admin/CategoriesPage'

function AppShell() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')

  return (
    <>
      {!isDashboard && <Navbar />}
      <main style={isDashboard ? {} : { paddingTop: 66 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cursos" element={<div style={{ padding: '8rem 5%', textAlign: 'center', fontFamily: 'var(--serif)', fontSize: '2rem', color: 'var(--carbon)' }}>Catálogo de cursos — próximamente</div>} />
          <Route path="/registro" element={<div style={{ padding: '8rem 5%', textAlign: 'center', fontFamily: 'var(--serif)', fontSize: '2rem', color: 'var(--carbon)' }}>Registro — próximamente</div>} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/usuarios"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/categorias"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!isDashboard && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}
