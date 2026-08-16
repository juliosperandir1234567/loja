import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProdutos } from './hooks'
import { AppShell } from '../../components/layout/AppShell'

export function ProdutosListPage() {
  const [busca, setBusca] = useState('')
  const { data: produtos, isLoading } = useProdutos(busca)

  return (
    <AppShell title="Produtos">
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
            to="/produtos/novo"
            className="flex items-center rounded-lg bg-[var(--cor-primaria)] px-4 py-2.5 text-sm font-medium text-white"
          >
            + Novo
          </Link>
        </div>

        {isLoading && <p className="text-neutral-400">Carregando...</p>}

        <ul className="flex flex-col gap-2">
          {produtos?.map((p) => (
            <li key={p.id}>
              <Link
                to={`/produtos/${p.id}/editar`}
                className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm ring-1 ring-neutral-200"
              >
                <div className="flex items-center gap-3">
                  {p.foto_url ? (
                    <img src={p.foto_url} alt={p.nome} className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-neutral-100" />
                  )}
                  <div>
                    <p className="font-medium text-neutral-900">{p.nome}</p>
                    <p className="text-sm text-neutral-500">
                      {p.marca} {p.fragrancia_linha ? `· ${p.fragrancia_linha}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {p.preco_promocional ? (
                    <div>
                      <p className="text-xs text-neutral-400 line-through">
                        R$ {Number(p.preco_venda).toFixed(2)}
                      </p>
                      <p className="font-medium text-red-600">
                        R$ {Number(p.preco_promocional).toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <p className="font-medium text-neutral-900">
                      R$ {Number(p.preco_venda).toFixed(2)}
                    </p>
                  )}
                  <p
                    className={`text-sm ${
                      p.estoque_atual <= p.estoque_minimo ? 'font-medium text-red-600' : 'text-neutral-500'
                    }`}
                  >
                    {p.estoque_atual} em estoque
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {!isLoading && produtos?.length === 0 && (
          <p className="mt-8 text-center text-neutral-400">Nenhum produto encontrado.</p>
        )}
      </div>
    </AppShell>
  )
}
