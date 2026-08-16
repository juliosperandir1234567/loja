import { useState } from 'react'
import toast from 'react-hot-toast'
import { AppShell } from '../../components/layout/AppShell'
import { ProdutoPicker } from '../../components/ProdutoPicker'
import type { Produto } from '../produtos/api'
import { precoEfetivo } from '../produtos/api'
import type { Cliente } from '../clientes/api'
import type { FormaPagamento } from '../../types/database.types'
import type { Venda } from './api'
import { useFinalizarVenda } from './hooks'
import { FormaPagamentoStep } from './FormaPagamentoStep'
import { SignaturePadStep } from './SignaturePadStep'
import { ComprovanteStep } from './ComprovanteStep'

export interface CarrinhoItem {
  produto: Produto
  quantidade: number
}

type Etapa = 'carrinho' | 'pagamento' | 'assinatura' | 'comprovante'

interface PagamentoEscolhido {
  formaPagamento: FormaPagamento
  cliente: Cliente | null
  desconto: number
  valorEntrada: number
  combinacao: string | null
}

export function PdvPage() {
  const [etapa, setEtapa] = useState<Etapa>('carrinho')
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([])
  const [pagamento, setPagamento] = useState<PagamentoEscolhido | null>(null)
  const [vendaFinalizada, setVendaFinalizada] = useState<Venda | null>(null)
  const [assinaturaDataUrl, setAssinaturaDataUrl] = useState<string | null>(null)
  const finalizarVenda = useFinalizarVenda()

  const total = carrinho.reduce((acc, i) => acc + i.quantidade * precoEfetivo(i.produto), 0)

  function adicionarProduto(produto: Produto) {
    setCarrinho((atual) => {
      const existente = atual.find((i) => i.produto.id === produto.id)
      if (existente) {
        return atual.map((i) =>
          i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i,
        )
      }
      return [...atual, { produto, quantidade: 1 }]
    })
  }

  function ajustarQuantidade(produtoId: string, quantidade: number) {
    if (quantidade <= 0) {
      setCarrinho((atual) => atual.filter((i) => i.produto.id !== produtoId))
      return
    }
    setCarrinho((atual) =>
      atual.map((i) => (i.produto.id === produtoId ? { ...i, quantidade } : i)),
    )
  }

  function resetar() {
    setCarrinho([])
    setPagamento(null)
    setVendaFinalizada(null)
    setAssinaturaDataUrl(null)
    setEtapa('carrinho')
  }

  async function handleAssinaturaConfirmada(dataUrl: string) {
    if (!pagamento) return
    try {
      const venda = await finalizarVenda.mutateAsync({
        itens: carrinho.map((i) => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
        formaPagamento: pagamento.formaPagamento,
        clienteId: pagamento.cliente?.id ?? null,
        assinaturaDataUrl: dataUrl,
        desconto: pagamento.desconto,
        valorEntrada: pagamento.valorEntrada,
        combinacao: pagamento.combinacao,
      })
      setVendaFinalizada(venda)
      setAssinaturaDataUrl(dataUrl)
      setEtapa('comprovante')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao finalizar venda')
    }
  }

  if (etapa === 'pagamento') {
    return (
      <AppShell title="Forma de pagamento">
        <FormaPagamentoStep
          total={total}
          onVoltar={() => setEtapa('carrinho')}
          onConfirmar={(p) => {
            setPagamento(p)
            setEtapa('assinatura')
          }}
        />
      </AppShell>
    )
  }

  if (etapa === 'assinatura') {
    return (
      <AppShell title="Assinatura do cliente">
        <SignaturePadStep
          enviando={finalizarVenda.isPending}
          onVoltar={() => setEtapa('pagamento')}
          onConfirm={handleAssinaturaConfirmada}
        />
      </AppShell>
    )
  }

  if (etapa === 'comprovante' && vendaFinalizada) {
    return (
      <AppShell title="Venda concluída">
        <ComprovanteStep
          venda={vendaFinalizada}
          itens={carrinho}
          cliente={pagamento?.cliente ?? null}
          assinaturaDataUrl={assinaturaDataUrl}
          onNovaVenda={resetar}
        />
      </AppShell>
    )
  }

  return (
    <AppShell title="Vender">
      <div className="flex flex-col gap-4 p-4">
        <ProdutoPicker onSelect={adicionarProduto} />

        <div>
          <h2 className="mb-2 text-sm font-medium text-neutral-700">Carrinho</h2>
          {carrinho.length === 0 && <p className="text-sm text-neutral-400">Nenhum item ainda.</p>}
          <ul className="flex flex-col gap-2">
            {carrinho.map((item) => (
              <li
                key={item.produto.id}
                className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-neutral-200"
              >
                <div>
                  <p className="font-medium">{item.produto.nome}</p>
                  <p className="text-sm text-neutral-500">
                    R$ {precoEfetivo(item.produto).toFixed(2)} un.
                    {item.produto.preco_promocional && (
                      <span className="ml-1 text-neutral-400 line-through">
                        R$ {item.produto.preco_venda.toFixed(2)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => ajustarQuantidade(item.produto.id, item.quantidade - 1)}
                    className="h-8 w-8 rounded-full border border-neutral-300 text-lg"
                  >
                    −
                  </button>
                  <span className="w-6 text-center">{item.quantidade}</span>
                  <button
                    onClick={() => ajustarQuantidade(item.produto.id, item.quantidade + 1)}
                    className="h-8 w-8 rounded-full border border-neutral-300 text-lg"
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {carrinho.length > 0 && (
        <div className="fixed inset-x-0 bottom-16 border-t border-neutral-200 bg-white p-4">
          <div className="mb-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          <button
            onClick={() => setEtapa('pagamento')}
            className="w-full rounded-lg bg-[var(--cor-primaria)] py-3 text-base font-medium text-white"
          >
            Ir para pagamento
          </button>
        </div>
      )}
    </AppShell>
  )
}
