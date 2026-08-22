import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppShell } from '../../components/layout/AppShell'
import { ProdutoPicker } from '../../components/ProdutoPicker'
import { buscarProdutoPorId, nomeCompleto, type Produto } from '../produtos/api'
import { useRegistrarMovimentacao } from './hooks'

export function EntradaEstoquePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [produto, setProduto] = useState<Produto | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [fornecedor, setFornecedor] = useState('')
  const [motivo, setMotivo] = useState('')
  const registrar = useRegistrarMovimentacao()
  const precoInvalido = !!produto && Number(produto.preco_venda) <= 0

  useEffect(() => {
    const produtoId = searchParams.get('produto')
    if (produtoId) buscarProdutoPorId(produtoId).then(setProduto)
  }, [searchParams])

  async function handleSubmit() {
    if (!produto || quantidade <= 0 || precoInvalido) return
    try {
      await registrar.mutateAsync({
        produtoId: produto.id,
        tipo: 'entrada',
        quantidade,
        fornecedor: fornecedor || undefined,
        motivo: motivo || undefined,
      })
      toast.success('Entrada registrada')
      navigate('/estoque')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar entrada')
    }
  }

  return (
    <AppShell title="Entrada de estoque">
      <div className="flex flex-col gap-4 p-4">
        {!produto ? (
          <ProdutoPicker onSelect={setProduto} />
        ) : (
          <>
            <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
              <p className="font-medium">{nomeCompleto(produto)}</p>
              <p className="text-sm text-neutral-500">
                Estoque atual: {produto.estoque_atual}
              </p>
              <button onClick={() => setProduto(null)} className="mt-1 text-sm text-neutral-500 underline">
                Trocar produto
              </button>
            </div>

            {precoInvalido && (
              <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
                <p className="mb-2">
                  Este produto está com preço R$ 0,00. Defina o preço revista antes de lançar
                  estoque, pra não vender de graça sem querer.
                </p>
                <Link
                  to={`/produtos/${produto.id}/editar`}
                  className="inline-block rounded-lg bg-amber-800 px-3 py-1.5 text-white"
                >
                  Definir preço agora
                </Link>
              </div>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">Quantidade recebida</span>
              <input
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">Fornecedor/nota (opcional)</span>
              <input
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">Observação (opcional)</span>
              <input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
              />
            </label>

            <button
              onClick={handleSubmit}
              disabled={registrar.isPending || precoInvalido}
              className="rounded-lg bg-[var(--cor-primaria)] px-4 py-3 text-base font-medium text-white disabled:opacity-50"
            >
              {registrar.isPending ? 'Registrando...' : 'Registrar entrada'}
            </button>
          </>
        )}
      </div>
    </AppShell>
  )
}
