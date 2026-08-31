import { Link } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { useEstoqueResumo } from '../dashboard/hooks'

function StatCard({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-lg font-semibold text-neutral-900">{valor}</p>
    </div>
  )
}

export function EstoqueHomePage() {
  const { isLoading, totalUnidades, valorCusto, valorVenda } = useEstoqueResumo()
  const lucroPotencial = valorVenda - valorCusto
  const margem = valorVenda > 0 ? (lucroPotencial / valorVenda) * 100 : 0

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
          <Link
            to="/estoque/ajuste"
            className="flex-1 rounded-lg border border-neutral-300 py-3 text-center text-sm font-medium"
          >
            Ajustar estoque
          </Link>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-neutral-700">Estoque atual</h2>
          {isLoading ? (
            <p className="text-neutral-400">Carregando...</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Unidades" valor={String(totalUnidades)} />
              <StatCard label="Valor (custo)" valor={`R$ ${valorCusto.toFixed(2)}`} />
              <StatCard label="Valor (venda)" valor={`R$ ${valorVenda.toFixed(2)}`} />
            </div>
          )}
        </div>

        {!isLoading && (
          <div className="rounded-lg bg-green-50 p-3 ring-1 ring-green-200">
            <p className="text-xs font-medium text-green-800">Lucro potencial (se vender tudo)</p>
            <p className="text-lg font-semibold text-green-800">R$ {lucroPotencial.toFixed(2)}</p>
            <p className="text-xs text-green-700">Margem de {margem.toFixed(0)}% sobre o valor de venda</p>
          </div>
        )}

        <Link
          to="/produtos?estoque=positivo"
          className="flex items-center justify-center rounded-lg border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700"
        >
          Ver produtos em estoque
        </Link>

        <Link
          to="/estoque/minimo"
          className="flex items-center justify-center rounded-lg border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700"
        >
          Estoque mínimo
        </Link>
      </div>
    </AppShell>
  )
}
