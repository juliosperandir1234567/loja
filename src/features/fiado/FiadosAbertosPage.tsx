import { Link } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { AniversariantesWidget } from './AniversariantesWidget'
import { useFiadosAbertos } from './hooks'

export function FiadosAbertosPage() {
  const { data: fiados, isLoading } = useFiadosAbertos()

  return (
    <AppShell title="A prazo">
      <div className="flex flex-col gap-4 p-4">
        <AniversariantesWidget />

        <Link
          to="/clientes"
          className="rounded-lg border border-neutral-300 px-4 py-2.5 text-center text-sm font-medium"
        >
          Ver todos os clientes
        </Link>

        <div>
          <h2 className="mb-2 text-sm font-medium text-neutral-700">A prazo em aberto</h2>
          {isLoading && <p className="text-neutral-400">Carregando...</p>}
          <ul className="flex flex-col gap-2">
            {fiados?.map((f) => (
              <li key={f.cliente_id}>
                <Link
                  to={`/fiado/cliente/${f.cliente_id}`}
                  className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-neutral-200"
                >
                  <div>
                    <p className="font-medium">{f.nome}</p>
                    <p className="text-sm text-neutral-500">{f.telefone}</p>
                  </div>
                  <span className="font-medium text-red-600">
                    R$ {Number(f.saldo_devedor).toFixed(2)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {!isLoading && fiados?.length === 0 && (
            <p className="text-sm text-neutral-400">Nenhuma venda a prazo em aberto.</p>
          )}
        </div>
      </div>
    </AppShell>
  )
}
