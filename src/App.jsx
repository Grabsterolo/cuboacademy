import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import Navbar from './components/shared/Navbar'
import Footer from './components/shared/Footer'
import ProtectedRoute from './components/shared/ProtectedRoute'

import HomePage from './pages/public/HomePage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import InstructorApplicationPage from './pages/public/InstructorApplicationPage'
import DashboardRouter from './pages/dashboard/DashboardRouter'

// Admin pages
import UsersPage from './pages/dashboard/admin/UsersPage'
import CategoriesPage from './pages/dashboard/admin/CategoriesPage'
import CoursesPage from './pages/dashboard/admin/CoursesPage'
import CourseFormPage from './pages/dashboard/admin/CourseFormPage'
import CourseStructurePage from './pages/dashboard/admin/CourseStructurePage'
import OrdersPage from './pages/dashboard/admin/OrdersPage'
import CertificatesPage from './pages/dashboard/admin/CertificatesPage'
import ReportsPage from './pages/dashboard/admin/ReportsPage'
import SettingsPage from './pages/dashboard/admin/SettingsPage'
import RequestsPage from './pages/dashboard/admin/RequestsPage'
import AnnouncementsPage from './pages/dashboard/admin/AnnouncementsPage'

// Instructor pages
import InstructorProfilePage from './pages/dashboard/instructor/InstructorProfilePage'
import InstructorCoursesPage from './pages/dashboard/instructor/InstructorCoursesPage'
import InstructorStudentsPage from './pages/dashboard/instructor/InstructorStudentsPage'
import InstructorEvaluationsPage from './pages/dashboard/instructor/InstructorEvaluationsPage'
import InstructorReportsPage from './pages/dashboard/instructor/InstructorReportsPage'
import InstructorEarningsPage from './pages/dashboard/instructor/InstructorEarningsPage'
import InstructorSettingsPage from './pages/dashboard/instructor/InstructorSettingsPage'

// Student pages
import StudentProfilePage from './pages/dashboard/student/StudentProfilePage'
import StudentCoursesPage from './pages/dashboard/student/StudentCoursesPage'
import StudentInstructorsPage from './pages/dashboard/student/StudentInstructorsPage'
import StudentAchievementsPage from './pages/dashboard/student/StudentAchievementsPage'
import StudentCertificatesPage from './pages/dashboard/student/StudentCertificatesPage'
import StudentStorePage from './pages/dashboard/student/StudentStorePage'
import StudentSettingsPage from './pages/dashboard/student/StudentSettingsPage'

function RoleRouter({ admin, instructor, student }) {
  const { profile, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: 'var(--sans)', color: 'var(--text-2)' }}>
      Cargando...
    </div>
  )
  if (profile?.role === 'admin' && admin) return admin
  if (profile?.role === 'instructor' && instructor) return instructor
  if (profile?.role === 'student' && student) return student
  return null
}

function AppShell() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const isAuthPage = location.pathname === '/login' || location.pathname === '/registro'
  const showNav = !isDashboard && !isAuthPage

  return (
    <>
      {showNav && <Navbar />}
      <main style={showNav ? { paddingTop: 66 } : {}}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/quiero-ser-instructor" element={<InstructorApplicationPage />} />
          <Route path="/cursos" element={<div style={{ padding: '8rem 5%', textAlign: 'center', fontFamily: 'var(--serif)', fontSize: '2rem', color: 'var(--carbon)' }}>Catálogo de cursos — próximamente</div>} />

          {/* Dashboard root — role-aware */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />

          {/* Admin-only */}
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
            path="/dashboard/solicitudes"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/pagos"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />

          {/* Cursos — admin + instructor (role-aware) */}
          <Route
            path="/dashboard/cursos"
            element={
              <ProtectedRoute allowedRoles={['admin', 'instructor']}>
                <RoleRouter
                  admin={<CoursesPage />}
                  instructor={<InstructorCoursesPage />}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/cursos/nuevo"
            element={
              <ProtectedRoute allowedRoles={['admin', 'instructor']}>
                <CourseFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/cursos/:id/editar"
            element={
              <ProtectedRoute allowedRoles={['admin', 'instructor']}>
                <CourseFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/cursos/:id/estructura"
            element={
              <ProtectedRoute allowedRoles={['admin', 'instructor']}>
                <CourseStructurePage />
              </ProtectedRoute>
            }
          />

          {/* Comunicados — admin + instructor + student */}
          <Route
            path="/dashboard/comunicados"
            element={
              <ProtectedRoute>
                <RoleRouter
                  admin={<AnnouncementsPage />}
                  instructor={<AnnouncementsPage />}
                  student={<AnnouncementsPage />}
                />
              </ProtectedRoute>
            }
          />

          {/* Certificados — admin + student */}
          <Route
            path="/dashboard/certificados"
            element={
              <ProtectedRoute allowedRoles={['admin', 'student']}>
                <RoleRouter
                  admin={<CertificatesPage />}
                  student={<StudentCertificatesPage />}
                />
              </ProtectedRoute>
            }
          />

          {/* Reportes — admin + instructor */}
          <Route
            path="/dashboard/reportes"
            element={
              <ProtectedRoute allowedRoles={['admin', 'instructor']}>
                <RoleRouter
                  admin={<ReportsPage />}
                  instructor={<InstructorReportsPage />}
                />
              </ProtectedRoute>
            }
          />

          {/* Configuración — all roles */}
          <Route
            path="/dashboard/configuracion"
            element={
              <ProtectedRoute>
                <RoleRouter
                  admin={<SettingsPage />}
                  instructor={<InstructorSettingsPage />}
                  student={<StudentSettingsPage />}
                />
              </ProtectedRoute>
            }
          />

          {/* Perfil — instructor + student */}
          <Route
            path="/dashboard/perfil"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'student']}>
                <RoleRouter
                  instructor={<InstructorProfilePage />}
                  student={<StudentProfilePage />}
                />
              </ProtectedRoute>
            }
          />

          {/* Instructor-only */}
          <Route
            path="/dashboard/estudiantes"
            element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <InstructorStudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/evaluaciones"
            element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <InstructorEvaluationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/ganancias"
            element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <InstructorEarningsPage />
              </ProtectedRoute>
            }
          />

          {/* Student-only */}
          <Route
            path="/dashboard/instructores"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentInstructorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/logros"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentAchievementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tienda"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentStorePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {showNav && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  )
}
