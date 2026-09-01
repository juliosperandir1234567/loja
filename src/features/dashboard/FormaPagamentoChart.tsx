import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { FormaPagamento } from '../../types/database.types'
import { LABEL_FORMA } from './hooks'

const CORES: Record<FormaPagamento, string> = {
  dinheiro: '#16a34a',
  pix: '#0d9488',
  cartao: '#2563eb',
  fiado: '#dc2626',
}

export function FormaPagamentoChart({
  dados,
}: {
  dados: { forma: FormaPagamento; valor: number; percentual: number }[]
}) {
  if (dados.length === 0) return <p className="text-sm text-neutral-400">Sem vendas no período.</p>

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={dados} dataKey="valor" nameKey="forma" innerRadius={35} outerRadius={60}>
            {dados.map((d) => (
              <Cell key={d.forma} fill={CORES[d.forma]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex flex-col gap-1 text-sm">
        {dados.map((d) => (
          <li key={d.forma} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: CORES[d.forma] }}
            />
            <span className="text-neutral-700">
              {LABEL_FORMA[d.forma]} — {d.percentual.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
