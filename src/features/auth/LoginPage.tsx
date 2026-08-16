import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { useConfiguracoes } from '../configuracoes/hooks'

export function LoginPage() {
  const { session, usuario, loading, signIn } = useAuth()
  const { data: config } = useConfiguracoes()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session && usuario) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) setError('E-mail ou senha inválidos.')
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"
      >
        {config?.logo_url && (
          <img
            src={config.logo_url}
            alt={config.nome_loja}
            className="mx-auto mb-4 h-16 object-contain"
          />
        )}
        <h1 className="mb-1 text-xl font-semibold text-neutral-900">
          {config?.nome_loja ?? 'Espaço Sperandir'}
        </h1>
        <p className="mb-6 text-sm text-neutral-500">Entre com seu e-mail e senha</p>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">E-mail</span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">Senha</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
          />
        </label>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[var(--cor-primaria)] px-4 py-3 text-base font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
