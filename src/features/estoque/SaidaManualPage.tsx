import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppShell } from '../../components/layout/AppShell'
import { ProdutoPicker } from '../../components/ProdutoPicker'
import type { Produto } from '../produtos/api'
import { useRegistrarMovimentacao } from './hooks'

const MOTIVOS = ['Perda', 'Troca', 'Uso interno', 'Ajuste de inventário']

export function SaidaManualPage() {
  const navigate = useNavigate()
  const [produto, setProduto] = useState<Produto | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [motivo, setMotivo] = useState(MOTIVOS[0])
  const registrar = useRegistrarMovimentacao()

  async function handleSubmit() {
    if (!produto || quantidade <= 0) return
    try {
      await registrar.mutateAsync({
        produtoId: produto.id,
        tipo: 'saida_manual',
        quantidade,
        motivo,
      })
      toast.success('Saída registrada')
      navigate('/estoque')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar saída')
    }
  }

  return (
    <AppShell title="Saída de estoque">
      <div className="flex flex-col gap-4 p-4">
        {!produto ? (
          <ProdutoPicker onSelect={setProduto} />
        ) : (
          <>
            <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
              <p className="font-medium">{produto.nome}</p>
              <p className="text-sm text-neutral-500">Estoque atual: {produto.estoque_atual}</p>
              <button onClick={() => setProduto(null)} className="mt-1 text-sm text-neutral-500 underline">
                Trocar produto
              </button>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">Quantidade</span>
              <input
                type="number"
                min={1}
                max={produto.estoque_atual}
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">Motivo</span>
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
              >
                {MOTIVOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={handleSubmit}
              disabled={registrar.isPending}
              className="rounded-lg bg-[var(--cor-primaria)] px-4 py-3 text-base font-medium text-white disabled:opacity-50"
            >
              {registrar.isPending ? 'Registrando...' : 'Registrar saída'}
            </button>
          </>
        )}
      </div>
    </AppShell>
  )
}
