import { useState } from 'react'
import toast from 'react-hot-toast'
import { AppShell } from '../../components/layout/AppShell'
import { ProdutoGridPicker } from '../../components/ProdutoGridPicker'
import type { Produto } from '../produtos/api'
import { precoEfetivo, nomeCompleto } from '../produtos/api'
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
    if (produto.estoque_atual <= 0) {
      toast.error(`"${produto.nome}" está sem estoque`)
      return
    }
    setCarrinho((atual) => {
      const existente = atual.find((i) => i.produto.id === produto.id)
      const quantidadeAtual = existente?.quantidade ?? 0
      if (quantidadeAtual + 1 > produto.estoque_atual) {
        toast.error(`Só tem ${produto.estoque_atual} un. de "${produto.nome}" em estoque`)
        return atual
      }
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
      atual.map((i) => {
        if (i.produto.id !== produtoId) return i
        if (quantidade > i.produto.estoque_atual) {
          toast.error(`Só tem ${i.produto.estoque_atual} un. de "${i.produto.nome}" em estoque`)
          return i
        }
        return { ...i, quantidade }
      }),
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
          itens={carrinho}
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
      <div className={`flex flex-col gap-4 p-4 ${carrinho.length > 0 ? 'pb-32' : ''}`}>
        <ProdutoGridPicker onSelect={adicionarProduto} />

        {carrinho.length > 0 && (
          <div>
            <h2 className="mb-2 text-base font-bold text-neutral-700">
              Carrinho ({carrinho.reduce((acc, i) => acc + i.quantidade, 0)} itens)
            </h2>
            <ul className="flex flex-col gap-2">
              {carrinho.map((item) => (
                <li
                  key={item.produto.id}
                  className="flex items-center justify-between rounded-2xl bg-white p-3 ring-1 ring-neutral-200"
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-semibold text-neutral-900">{nomeCompleto(item.produto)}</p>
                    <p className="text-sm text-neutral-500">
                      R$ {precoEfetivo(item.produto).toFixed(2)} un.
                      {item.produto.preco_promocional && (
                        <span className="ml-1 text-neutral-400 line-through">
                          R$ {item.produto.preco_venda.toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => ajustarQuantidade(item.produto.id, item.quantidade - 1)}
                      className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-neutral-300 text-2xl font-bold text-neutral-700"
                      aria-label="Diminuir quantidade"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-lg font-bold">{item.quantidade}</span>
                    <button
                      onClick={() => ajustarQuantidade(item.produto.id, item.quantidade + 1)}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--cor-primaria)] text-2xl font-bold text-white"
                      aria-label="Aumentar quantidade"
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {carrinho.length > 0 && (
        <div className="fixed inset-x-0 bottom-[4.75rem] border-t border-neutral-200 bg-white p-4 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-base font-semibold text-neutral-600">Total</span>
            <span className="text-2xl font-bold text-neutral-900">R$ {total.toFixed(2)}</span>
          </div>
          <button
            onClick={() => setEtapa('pagamento')}
            className="w-full rounded-xl bg-[var(--cor-primaria)] py-4 text-lg font-bold text-white"
          >
            Ir para pagamento →
          </button>
        </div>
      )}
    </AppShell>
  )
}
