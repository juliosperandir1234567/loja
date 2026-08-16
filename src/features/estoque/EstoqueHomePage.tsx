import { Link } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { useProdutosEstoqueBaixo } from './hooks'

export function EstoqueHomePage() {
  const { data: estoqueBaixo, isLoading } = useProdutosEstoqueBaixo()

  return (
    <AppShell title="Estoque">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex gap-2">
          <Link
            to="/estoque/entrada"
            className="flex-1 rounded-lg bg-[var(--cor-primaria)] py-3 text-center text-sm font-medium text-white"
          >
            Entrada
          </Link>
          <Link
            to="/estoque/saida"
            className="flex-1 rounded-lg border border-neutral-300 py-3 text-center text-sm font-medium"
          >
            Saída manual
          </Link>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-neutral-700">Alerta de estoque baixo</h2>
          {isLoading && <p className="text-neutral-400">Carregando...</p>}
          <ul className="flex flex-col gap-2">
            {estoqueBaixo?.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/estoque/historico/${p.id}`}
                  className="flex items-center justify-between rounded-xl bg-red-50 p-3 ring-1 ring-red-200"
                >
                  <span className="font-medium text-red-900">{p.nome}</span>
                  <span className="text-sm font-medium text-red-700">
                    {p.estoque_atual} / mín. {p.estoque_minimo}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {!isLoading && estoqueBaixo?.length === 0 && (
            <p className="text-sm text-neutral-400">Nenhum produto com estoque baixo.</p>
          )}
        </div>
      </div>
    </AppShell>
  )
}
