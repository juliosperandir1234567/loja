import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function CompraVendaChart({
  dados,
}: {
  dados: { mes: string; compra: number; venda: number }[]
}) {
  const temDados = dados.some((d) => d.compra > 0 || d.venda > 0)
  if (!temDados) return <p className="text-sm text-neutral-400">Sem dados no ano.</p>

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={dados}>
        <XAxis dataKey="mes" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis fontSize={11} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          formatter={(value, name) => [`R$ ${Number(value).toFixed(2)}`, name]}
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="compra" name="Compra (boletos pagos)" fill="#dc2626" radius={[4, 4, 0, 0]} />
        <Bar dataKey="venda" name="Venda" fill="#16a34a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
