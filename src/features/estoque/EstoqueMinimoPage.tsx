import { Link } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { useProdutosEstoqueBaixo } from './hooks'

export function EstoqueMinimoPage() {
  const { data: estoqueBaixo, isLoading } = useProdutosEstoqueBaixo()

  return (
    <AppShell title="Estoque mínimo">
      <div className="flex flex-col gap-4 p-4">
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
          <p className="text-sm text-neutral-400">Nenhum produto no ou abaixo do estoque mínimo.</p>
        )}
      </div>
    </AppShell>
  )
}
