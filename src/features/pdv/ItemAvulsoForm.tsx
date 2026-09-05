import { useState } from 'react'
import toast from 'react-hot-toast'
import { useProdutosAvulsos } from '../produtos/hooks'
import type { Produto } from '../produtos/api'
import type { Marca } from '../../types/database.types'

export function ItemAvulsoForm({
  onAdicionar,
}: {
  onAdicionar: (produto: Produto, preco: number, observacao: string) => void
}) {
  const { data: produtosAvulsos } = useProdutosAvulsos()
  const [aberto, setAberto] = useState(false)
  const [marca, setMarca] = useState<Marca>('Natura')
  const [valor, setValor] = useState('')
  const [observacao, setObservacao] = useState('')

  function handleAdicionar() {
    const produto = produtosAvulsos?.find((p) => p.marca === marca)
    const numeroValor = Number(valor.replace(',', '.'))
    if (!produto) {
      toast.error('Item avulso não configurado para essa marca')
      return
    }
    if (!numeroValor || numeroValor <= 0) {
      toast.error('Informe um valor válido')
      return
    }
    onAdicionar(produto, numeroValor, observacao.trim() || 'Item avulso')
    setValor('')
    setObservacao('')
    setAberto(false)
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-xl border border-dashed border-neutral-300 py-3 text-sm font-medium text-neutral-600"
      >
        + Item avulso (sem produto)
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 ring-1 ring-neutral-200">
      <p className="text-sm font-bold text-neutral-700">Item avulso</p>

      <div className="flex gap-2">
        {(['Natura', 'Boticário'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMarca(m)}
            className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
              marca === m
                ? 'border-neutral-900 bg-[var(--cor-primaria)] text-white'
                : 'border-neutral-300 bg-white text-neutral-900'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">Valor (R$)</span>
        <input
          type="text"
          inputMode="decimal"
          value={valor}
          onChange={(e) => setValor(e.target.value.replace(/[^0-9.,]/g, ''))}
          placeholder="0,00"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">Observação</span>
        <input
          type="text"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Ex: Restante da compra"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="flex-1 rounded-lg border border-neutral-300 py-3 text-sm font-medium"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleAdicionar}
          className="flex-1 rounded-lg bg-[var(--cor-primaria)] py-3 text-sm font-medium text-white"
        >
          Adicionar
        </button>
      </div>
    </div>
  )
}
