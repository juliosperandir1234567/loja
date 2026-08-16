import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { useClientes } from './hooks'

export function ClientesListPage() {
  const [busca, setBusca] = useState('')
  const { data: clientes, isLoading } = useClientes(busca)

  return (
    <AppShell title="Clientes">
      <div className="p-4">
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
          />
          <Link
            to="/clientes/novo"
            className="flex items-center rounded-lg bg-[var(--cor-primaria)] px-4 py-2.5 text-sm font-medium text-white"
          >
            + Novo
          </Link>
        </div>

        {isLoading && <p className="text-neutral-400">Carregando...</p>}

        <ul className="flex flex-col gap-2">
          {clientes?.map((c) => (
            <li key={c.id}>
              <Link
                to={`/clientes/${c.id}/editar`}
                className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm ring-1 ring-neutral-200"
              >
                <div>
                  <p className="font-medium text-neutral-900">{c.nome}</p>
                  <p className="text-sm text-neutral-500">{c.telefone}</p>
                </div>
                {c.data_aniversario && (
                  <span className="text-sm text-neutral-400">
                    🎂 {c.data_aniversario.split('-').reverse().slice(0, 2).join('/')}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {!isLoading && clientes?.length === 0 && (
          <p className="mt-8 text-center text-neutral-400">Nenhum cliente cadastrado.</p>
        )}
      </div>
    </AppShell>
  )
}
