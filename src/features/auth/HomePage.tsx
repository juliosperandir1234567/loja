import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { DashboardPage } from '../dashboard/DashboardPage'

export function HomePage() {
  const { usuario } = useAuth()

  if (usuario?.role === 'vendedor') {
    return <Navigate to="/pdv" replace />
  }

  return <DashboardPage />
}
