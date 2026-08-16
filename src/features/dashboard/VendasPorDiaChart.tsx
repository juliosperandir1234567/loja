import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function VendasPorDiaChart({ dados }: { dados: { dia: string; valor: number }[] }) {
  if (dados.length === 0) return <p className="text-sm text-neutral-400">Sem vendas no período.</p>

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={dados}>
        <XAxis dataKey="dia" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis fontSize={11} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Faturamento']}
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
        />
        <Bar dataKey="valor" fill="var(--cor-primaria)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
