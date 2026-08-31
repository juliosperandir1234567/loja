import { useState } from 'react'
import { ClientePicker } from '../../components/ClientePicker'
import { precoEfetivo, nomeCompleto } from '../produtos/api'
import type { Cliente } from '../clientes/api'
import type { FormaPagamento } from '../../types/database.types'
import type { CarrinhoItem } from './PdvPage'

const OPCOES: { valor: FormaPagamento; label: string }[] = [
  { valor: 'a_vista', label: 'À vista (dinheiro/PIX)' },
  { valor: 'cartao', label: 'Cartão' },
  { valor: 'fiado', label: 'A prazo' },
]

export function FormaPagamentoStep({
  itens,
  total,
  onConfirmar,
  onVoltar,
}: {
  itens: CarrinhoItem[]
  total: number
  onConfirmar: (params: {
    formaPagamento: FormaPagamento
    cliente: Cliente | null
    desconto: number
    valorEntrada: number
    combinacao: string | null
  }) => void
  onVoltar: () => void
}) {
  const [forma, setForma] = useState<FormaPagamento | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [desconto, setDesconto] = useState('')
  const [valorEntrada, setValorEntrada] = useState('')
  const [combinacao, setCombinacao] = useState('')
  const [itensDoKit, setItensDoKit] = useState<Set<string>>(new Set())
  const [descontoKit, setDescontoKit] = useState('')

  const numeroDescontoKit = itensDoKit.size >= 2 ? Math.max(0, Number(descontoKit) || 0) : 0
  const numeroDesconto = Math.max(0, Number(desconto) || 0) + numeroDescontoKit
  const totalComDesconto = Math.max(0, total - numeroDesconto)
  const numeroEntrada = Math.max(0, Number(valorEntrada) || 0)

  function alternarItemKit(produtoId: string) {
    setItensDoKit((atual) => {
      const novo = new Set(atual)
      if (novo.has(produtoId)) novo.delete(produtoId)
      else novo.add(produtoId)
      return novo
    })
  }

  function podeContinuar() {
    if (!forma) return false
    if (numeroDesconto > total) return false
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
        <ul className="flex flex-col gap-1">
          {itens.map((i) => (
            <li key={i.produto.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-neutral-700">
                {itens.length >= 2 && (
                  <input
                    type="checkbox"
                    checked={itensDoKit.has(i.produto.id)}
                    onChange={() => alternarItemKit(i.produto.id)}
                    className="h-4 w-4 shrink-0"
                    aria-label={`Incluir ${nomeCompleto(i.produto)} no kit`}
                  />
                )}
                <span className="truncate">
                  {i.quantidade}x {nomeCompleto(i.produto)}
                </span>
              </span>
              <span className="shrink-0 font-medium text-neutral-900">
                R$ {(i.quantidade * precoEfetivo(i.produto)).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        {itensDoKit.size >= 2 && (
          <div className="mt-3 border-t border-neutral-100 pt-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">
                Desconto do kit ({itensDoKit.size} itens marcados)
              </span>
              <input
                type="number"
                step="0.01"
                min={0}
                value={descontoKit}
                onChange={(e) => setDescontoKit(e.target.value)}
                placeholder="Ex: 20,00"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
              />
            </label>
          </div>
        )}
      </div>

      <div>
        <p className="text-lg font-semibold">Total: R$ {totalComDesconto.toFixed(2)}</p>
        {numeroDesconto > 0 && (
          <p className="text-sm text-neutral-500">
            (R$ {total.toFixed(2)} − desconto de R$ {numeroDesconto.toFixed(2)})
          </p>
        )}
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">Desconto geral (R$, opcional)</span>
        <input
          type="number"
          step="0.01"
          min={0}
          value={desconto}
          onChange={(e) => setDesconto(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
        />
        {numeroDesconto > total && (
          <p className="mt-1 text-sm text-red-600">Desconto não pode ser maior que o total</p>
        )}
      </label>

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
              desconto: numeroDesconto,
              valorEntrada: forma === 'fiado' ? numeroEntrada : 0,
              combinacao: forma === 'fiado' ? combinacao || null : null,
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
