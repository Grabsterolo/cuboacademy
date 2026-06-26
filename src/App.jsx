import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/shared/Navbar'
import Footer from './components/shared/Footer'
import ProtectedRoute from './components/shared/ProtectedRoute'
import HomePage from './pages/public/HomePage'
import DashboardRouter from './pages/dashboard/DashboardRouter'
import UsersPage from './pages/dashboard/admin/UsersPage'
import CategoriesPage from './pages/dashboard/admin/CategoriesPage'
import CoursesPage from './pages/dashboard/admin/CoursesPage'
import OrdersPage from './pages/dashboard/admin/OrdersPage'
import CertificatesPage from './pages/dashboard/admin/CertificatesPage'
import ReportsPage from './pages/dashboard/admin/ReportsPage'
import SettingsPage from './pages/dashboard/admin/SettingsPage'

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
          <Route
            path="/dashboard/cursos"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/ordenes"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/certificados"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CertificatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/reportes"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/configuracion"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SettingsPage />
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
