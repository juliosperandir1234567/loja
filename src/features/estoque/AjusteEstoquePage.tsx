import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppShell } from '../../components/layout/AppShell'
import { ProdutoPicker } from '../../components/ProdutoPicker'
import { buscarProdutoPorId, type Produto } from '../produtos/api'
import { useRegistrarAjuste } from './hooks'

export function AjusteEstoquePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [produto, setProduto] = useState<Produto | null>(null)
  const [estoqueReal, setEstoqueReal] = useState(0)
  const [motivo, setMotivo] = useState('')
  const registrar = useRegistrarAjuste()

  useEffect(() => {
    const produtoId = searchParams.get('produto')
    if (produtoId) buscarProdutoPorId(produtoId).then(setProduto)
  }, [searchParams])

  useEffect(() => {
    if (produto) setEstoqueReal(produto.estoque_atual)
  }, [produto])

  const diferenca = produto ? estoqueReal - produto.estoque_atual : 0

  async function handleSubmit() {
    if (!produto || estoqueReal < 0) return
    try {
      await registrar.mutateAsync({
        produtoId: produto.id,
        estoqueReal,
        motivo: motivo || undefined,
      })
      toast.success(diferenca === 0 ? 'Nenhuma alteração necessária' : 'Estoque ajustado')
      navigate('/estoque')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao ajustar estoque')
    }
  }

  return (
    <AppShell title="Ajuste de estoque">
      <div className="flex flex-col gap-4 p-4">
        {!produto ? (
          <ProdutoPicker onSelect={setProduto} />
        ) : (
          <>
            <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
              <p className="font-medium">{produto.nome}</p>
              <p className="text-sm text-neutral-500">
                Estoque no sistema: {produto.estoque_atual}
              </p>
              <button onClick={() => setProduto(null)} className="mt-1 text-sm text-neutral-500 underline">
                Trocar produto
              </button>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">
                Estoque real (contagem física)
              </span>
              <input
                type="number"
                min={0}
                value={estoqueReal}
                onChange={(e) => setEstoqueReal(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
              />
              {diferenca !== 0 && (
                <p className={`mt-1 text-sm font-medium ${diferenca > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {diferenca > 0 ? `+${diferenca}` : diferenca} em relação ao sistema
                </p>
              )}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">Motivo (opcional)</span>
              <input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: contagem de inventário"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
              />
            </label>

            <button
              onClick={handleSubmit}
              disabled={registrar.isPending}
              className="rounded-lg bg-[var(--cor-primaria)] px-4 py-3 text-base font-medium text-white disabled:opacity-50"
            >
              {registrar.isPending ? 'Salvando...' : 'Salvar ajuste'}
            </button>
          </>
        )}
      </div>
    </AppShell>
  )
}
