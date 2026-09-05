import { useState } from 'react'
import { ClientePicker } from '../../components/ClientePicker'
import { nomeCompleto } from '../produtos/api'
import type { Cliente } from '../clientes/api'
import type { FormaPagamento, FormaRecebimento } from '../../types/database.types'
import { valorItemCarrinho, type CarrinhoItem, type KitInfo } from './carrinho'

function nomeItem(i: CarrinhoItem) {
  return i.produto.avulso ? i.observacao || 'Item avulso' : nomeCompleto(i.produto)
}

const OPCOES: { valor: FormaPagamento; label: string }[] = [
  { valor: 'dinheiro', label: 'Dinheiro' },
  { valor: 'pix', label: 'PIX' },
  { valor: 'cartao', label: 'Cartão' },
  { valor: 'fiado', label: 'A prazo' },
]

const OPCOES_RECEBIMENTO: { valor: FormaRecebimento; label: string }[] = [
  { valor: 'dinheiro', label: 'Dinheiro' },
  { valor: 'pix', label: 'PIX' },
  { valor: 'cartao', label: 'Cartão' },
]

export function FormaPagamentoStep({
  itens,
  total,
  desconto,
  kitInfo,
  onConfirmar,
  onVoltar,
}: {
  itens: CarrinhoItem[]
  total: number
  desconto: number
  kitInfo: KitInfo | null
  onConfirmar: (params: {
    formaPagamento: FormaPagamento
    cliente: Cliente | null
    desconto: number
    valorEntrada: number
    combinacao: string | null
    formaRecebimentoEntrada: FormaRecebimento | null
  }) => void
  onVoltar: () => void
}) {
  const [forma, setForma] = useState<FormaPagamento | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [valorEntrada, setValorEntrada] = useState('')
  const [combinacao, setCombinacao] = useState('')
  const [formaRecebimentoEntrada, setFormaRecebimentoEntrada] = useState<FormaRecebimento>('dinheiro')

  const totalComDesconto = Math.max(0, total - desconto)
  const numeroEntrada = Math.max(0, Number(valorEntrada) || 0)
  const kitIds = new Set(kitInfo?.produtoIds ?? [])
  const itensDoKit = itens.filter((i) => kitIds.has(i.produto.id))
  const itensFora = itens.filter((i) => !kitIds.has(i.produto.id))

  function podeContinuar() {
    if (!forma) return false
    if (forma === 'fiado') {
      if (!cliente) return false
      if (numeroEntrada > totalComDesconto) return false
    }
    return true
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-2xl bg-white p-3 ring-1 ring-neutral-200">
        <p className="mb-2 text-sm font-bold text-neutral-700">
          {itens.reduce((acc, i) => acc + i.quantidade, 0)} item(ns) nesta venda
        </p>
        {kitInfo ? (
          <div className="flex flex-col gap-2">
            <div className="rounded-lg bg-amber-50 p-2 ring-1 ring-amber-200">
              <p className="mb-1 text-xs font-semibold text-amber-800">
                Kit ({itensDoKit.length} itens com desconto)
              </p>
              <ul className="flex flex-col gap-0.5">
                {itensDoKit.map((i) => (
                  <li key={i.produto.id} className="flex justify-between text-sm text-neutral-700">
                    <span className="truncate">
                      {i.quantidade}x {nomeCompleto(i.produto)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 flex justify-between text-sm font-semibold text-amber-900">
                <span>Valor do kit</span>
                <span>R$ {kitInfo.valorFinal.toFixed(2)}</span>
              </p>
            </div>
            {itensFora.length > 0 && (
              <ul className="flex flex-col gap-1">
                {itensFora.map((i) => (
                  <li key={i.produto.id} className="flex justify-between text-sm">
                    <span className="truncate text-neutral-700">
                      {i.quantidade}x {nomeItem(i)}
                    </span>
                    <span className="shrink-0 font-medium text-neutral-900">
                      R$ {(i.quantidade * valorItemCarrinho(i)).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {itens.map((i) => (
              <li key={i.produto.id} className="flex justify-between text-sm">
                <span className="truncate text-neutral-700">
                  {i.quantidade}x {nomeItem(i)}
                </span>
                <span className="shrink-0 font-medium text-neutral-900">
                  R$ {(i.quantidade * valorItemCarrinho(i)).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-lg font-semibold">Total: R$ {totalComDesconto.toFixed(2)}</p>
        {desconto > 0 && (
          <p className="text-sm text-neutral-500">
            (R$ {total.toFixed(2)} − desconto de R$ {desconto.toFixed(2)})
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {OPCOES.map((op) => (
          <button
            key={op.valor}
            onClick={() => {
              setForma(op.valor)
              setCliente(null)
              setValorEntrada('')
              setCombinacao('')
            }}
            className={`rounded-xl border p-3 text-left font-medium ${
              forma === op.valor
                ? 'border-neutral-900 bg-[var(--cor-primaria)] text-white'
                : 'border-neutral-300 bg-white text-neutral-900'
            }`}
          >
            {op.label}
          </button>
        ))}
      </div>

      {forma === 'fiado' && (
        <>
          <div>
            <span className="mb-2 block text-sm font-medium text-neutral-700">
              {cliente ? 'Cliente selecionado' : 'Selecione o cliente'}
            </span>
            {cliente ? (
              <div className="flex items-center justify-between rounded-lg bg-white p-3 ring-1 ring-neutral-200">
                <span>{cliente.nome}</span>
                <button onClick={() => setCliente(null)} className="text-sm text-neutral-500 underline">
                  Trocar
                </button>
              </div>
            ) : (
              <ClientePicker onSelect={setCliente} />
            )}
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">
              Valor de entrada (opcional)
            </span>
            <input
              type="number"
              step="0.01"
              min={0}
              value={valorEntrada}
              onChange={(e) => setValorEntrada(e.target.value)}
              placeholder="Ex: 50,00"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
            />
            {numeroEntrada > 0 && (
              <p className="mt-1 text-sm text-neutral-500">
                Fica R$ {(totalComDesconto - numeroEntrada).toFixed(2)} a prazo
              </p>
            )}
            {numeroEntrada > totalComDesconto && (
              <p className="mt-1 text-sm text-red-600">Entrada não pode ser maior que o total</p>
            )}
          </label>

          {numeroEntrada > 0 && (
            <div>
              <span className="mb-2 block text-sm font-medium text-neutral-700">
                Forma de recebimento da entrada
              </span>
              <div className="flex gap-2">
                {OPCOES_RECEBIMENTO.map((op) => (
                  <button
                    key={op.valor}
                    type="button"
                    onClick={() => setFormaRecebimentoEntrada(op.valor)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
                      formaRecebimentoEntrada === op.valor
                        ? 'border-neutral-900 bg-[var(--cor-primaria)] text-white'
                        : 'border-neutral-300 bg-white text-neutral-900'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">
              Combinado com o cliente (opcional)
            </span>
            <textarea
              value={combinacao}
              onChange={(e) => setCombinacao(e.target.value)}
              placeholder="Ex: combinado pagar dia 10, ou em 3x"
              rows={2}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
            />
          </label>
        </>
      )}

      <div className="flex gap-2">
        <button
          onClick={onVoltar}
          className="flex-1 rounded-lg border border-neutral-300 py-3 text-sm font-medium"
        >
          Voltar
        </button>
        <button
          onClick={() =>
            forma &&
            onConfirmar({
              formaPagamento: forma,
              cliente,
              desconto,
              valorEntrada: forma === 'fiado' ? numeroEntrada : 0,
              combinacao: forma === 'fiado' ? combinacao || null : null,
              formaRecebimentoEntrada: forma === 'fiado' && numeroEntrada > 0 ? formaRecebimentoEntrada : null,
            })
          }
          disabled={!podeContinuar()}
          className="flex-1 rounded-lg bg-[var(--cor-primaria)] py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
