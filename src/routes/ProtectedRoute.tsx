import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import type { Role } from '../types/database.types'

export function ProtectedRoute({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { session, usuario, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-neutral-400">
        Carregando...
      </div>
    )
  }

  if (!session || !usuario || !usuario.ativo) {
    return <Navigate to="/login" replace />
  }

  if (!allow.includes(usuario.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
