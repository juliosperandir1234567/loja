import { useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { AppShell } from '../../components/layout/AppShell'
import { useProduto } from '../produtos/hooks'
import { useHistoricoProduto } from './hooks'

const TIPO_LABEL: Record<string, string> = {
  entrada: 'Entrada',
  saida_manual: 'Saída manual',
  venda: 'Venda',
  ajuste: 'Ajuste',
  estoque_inicial: 'Estoque inicial',
}

const TIPOS_POSITIVOS = ['entrada', 'estoque_inicial']

function ehPositivo(m: { tipo: string; positivo?: boolean | null }) {
  if (m.tipo === 'ajuste') return !!m.positivo
  return TIPOS_POSITIVOS.includes(m.tipo)
}

export function HistoricoProdutoPage() {
  const { id } = useParams()
  const { data: produto } = useProduto(id)
  const { data: movimentacoes, isLoading } = useHistoricoProduto(id)

  return (
    <AppShell title={produto ? `Histórico — ${produto.nome}` : 'Histórico'}>
      <div className="flex flex-col gap-2 p-4">
        {isLoading && <p className="text-neutral-400">Carregando...</p>}

        {movimentacoes?.map((m) => (
          <div key={m.id} className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
            <div className="flex items-center justify-between">
              <span className="font-medium">{TIPO_LABEL[m.tipo] ?? m.tipo}</span>
              <span className={ehPositivo(m) ? 'font-medium text-green-600' : 'font-medium text-red-600'}>
                {ehPositivo(m) ? '+' : '-'}
                {m.quantidade}
              </span>
            </div>
            <p className="text-sm text-neutral-500">
              {format(new Date(m.criado_em), 'dd/MM/yyyy HH:mm')}
              {m.motivo ? ` · ${m.motivo}` : ''}
            </p>
            {(m as unknown as { responsavel?: { nome: string } }).responsavel?.nome && (
              <p className="text-sm text-neutral-400">
                Por {(m as unknown as { responsavel: { nome: string } }).responsavel.nome}
              </p>
            )}
          </div>
        ))}

        {!isLoading && movimentacoes?.length === 0 && (
          <p className="mt-8 text-center text-neutral-400">Nenhuma movimentação ainda.</p>
        )}
      </div>
    </AppShell>
  )
}
