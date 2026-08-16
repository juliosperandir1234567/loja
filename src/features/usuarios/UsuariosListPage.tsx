import { useState } from 'react'
import toast from 'react-hot-toast'
import { AppShell } from '../../components/layout/AppShell'
import { useUsuarios, useCriarVendedor, useAtualizarUsuario } from './hooks'

export function UsuariosListPage() {
  const { data: usuarios, isLoading } = useUsuarios()
  const criarVendedor = useCriarVendedor()
  const atualizarUsuario = useAtualizarUsuario()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  async function handleCriar() {
    if (!nome.trim() || !email.trim() || senha.length < 6) {
      toast.error('Informe nome, e-mail e uma senha com pelo menos 6 caracteres')
      return
    }
    try {
      await criarVendedor.mutateAsync({ nome, email, senha })
      toast.success('Vendedor criado')
      setNome('')
      setEmail('')
      setSenha('')
      setMostrarForm(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar vendedor')
    }
  }

  async function handleToggleAtivo(id: string, ativo: boolean) {
    try {
      await atualizarUsuario.mutateAsync({ id, params: { ativo: !ativo } })
      toast.success(!ativo ? 'Usuário reativado' : 'Usuário desativado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar usuário')
    }
  }

  return (
    <AppShell title="Usuários">
      <div className="flex flex-col gap-4 p-4">
        {!mostrarForm ? (
          <button
            onClick={() => setMostrarForm(true)}
            className="rounded-lg bg-[var(--cor-primaria)] px-4 py-3 text-sm font-medium text-white"
          >
            + Novo vendedor
          </button>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-neutral-200">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">Nome</span>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">Senha</span>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:outline-none"
              />
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setMostrarForm(false)}
                className="flex-1 rounded-lg border border-neutral-300 py-3 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriar}
                disabled={criarVendedor.isPending}
                className="flex-1 rounded-lg bg-[var(--cor-primaria)] py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {criarVendedor.isPending ? 'Criando...' : 'Criar vendedor'}
              </button>
            </div>
          </div>
        )}

        {isLoading && <p className="text-neutral-400">Carregando...</p>}

        <ul className="flex flex-col gap-2">
          {usuarios?.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-neutral-200"
            >
              <div>
                <p className="font-medium text-neutral-900">{u.nome}</p>
                <p className="text-sm text-neutral-500">
                  {u.email} · {u.role === 'admin' ? 'Administrador' : 'Vendedor'}
                </p>
              </div>
              {u.role === 'vendedor' && (
                <button
                  onClick={() => handleToggleAtivo(u.id, u.ativo)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    u.ativo
                      ? 'border border-red-300 text-red-700'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {u.ativo ? 'Desativar' : 'Reativar'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  )
}
