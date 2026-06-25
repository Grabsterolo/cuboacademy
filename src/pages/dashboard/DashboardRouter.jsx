import { useAuth } from '../../context/AuthContext'
import StudentDashboard from './StudentDashboard'
import InstructorDashboard from './InstructorDashboard'
import GeneralPage from './admin/GeneralPage'

export default function DashboardRouter() {
  const { profile, loading } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: 'var(--sans)', color: 'var(--text-2)' }}>
      Cargando...
    </div>
  )

  if (profile?.role === 'admin') return <GeneralPage />
  if (profile?.role === 'instructor') return <InstructorDashboard />
  return <StudentDashboard />
}
