import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../features/auth/AuthProvider'

interface Props {
  titulo: string
  descricao: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function ConfirmDeleteModal({ titulo, descricao, onConfirm, onClose }: Props) {
  const { usuario } = useAuth()
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleConfirmar() {
    if (!usuario?.email || !senha) {
      setErro('Informe a senha')
      return
    }
    setEnviando(true)
    setErro(null)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: usuario.email,
        password: senha,
      })
      if (authError) {
        setErro('Senha incorreta')
        return
      }
      await onConfirm()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível excluir')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 sm:items-center sm:justify-center">
      <div className="w-full rounded-t-2xl bg-white p-4 sm:max-w-sm sm:rounded-2xl">
        <h2 className="mb-1 text-base font-semibold text-red-700">{titulo}</h2>
        <p className="mb-4 text-sm text-neutral-500">{descricao}</p>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">
            Confirme sua senha de administrador
          </span>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:outline-none"
          />
          {erro && <p className="mt-1 text-sm text-red-600">{erro}</p>}
        </label>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-neutral-300 py-3 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={enviando}
            className="flex-1 rounded-lg bg-red-600 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {enviando ? 'Excluindo...' : 'Excluir definitivamente'}
          </button>
        </div>
      </div>
    </div>
  )
}
