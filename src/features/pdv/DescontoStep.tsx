import { useEffect, useState } from 'react'
import { precoEfetivo, nomeCompleto } from '../produtos/api'
import type { CarrinhoItem } from './PdvPage'

function SelecaoKitOverlay({
  itens,
  selecaoInicial,
  onConfirmar,
  onCancelar,
}: {
  itens: CarrinhoItem[]
  selecaoInicial: Set<string>
  onConfirmar: (selecao: Set<string>) => void
  onCancelar: () => void
}) {
  const [selecao, setSelecao] = useState(new Set(selecaoInicial))

  function alternar(produtoId: string) {
    setSelecao((atual) => {
      const novo = new Set(atual)
      if (novo.has(produtoId)) novo.delete(produtoId)
      else novo.add(produtoId)
      return novo
    })
  }

  const subtotal = itens
    .filter((i) => selecao.has(i.produto.id))
    .reduce((acc, i) => acc + i.quantidade * precoEfetivo(i.produto), 0)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 p-4">
        <h2 className="text-lg font-bold text-neutral-900">Selecionar itens do kit</h2>
        <button onClick={onCancelar} className="text-sm font-medium text-neutral-500">
          Cancelar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <ul className="flex flex-col divide-y divide-neutral-100">
          {itens.map((i) => {
            const marcado = selecao.has(i.produto.id)
            return (
              <li key={i.produto.id}>
                <button
                  type="button"
                  onClick={() => alternar(i.produto.id)}
                  className={`flex w-full items-center justify-between gap-3 py-3.5 text-left ${
                    marcado ? 'bg-amber-50' : ''
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-base font-bold text-white ${
                        marcado
                          ? 'border-[var(--cor-primaria)] bg-[var(--cor-primaria)]'
                          : 'border-neutral-300 bg-white'
                      }`}
                    >
                      {marcado && '✓'}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-neutral-900">
                        {nomeCompleto(i.produto)}
                      </span>
                      <span className="text-xs text-neutral-400">{i.quantidade}x</span>
                    </span>
                  </span>
                  <span className="shrink-0 font-medium text-neutral-900">
                    R$ {(i.quantidade * precoEfetivo(i.produto)).toFixed(2)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="border-t border-neutral-200 p-4">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-neutral-600">
            {selecao.size} item{selecao.size === 1 ? '' : 's'} selecionado
            {selecao.size === 1 ? '' : 's'}
          </span>
          <span className="text-base font-bold text-neutral-900">R$ {subtotal.toFixed(2)}</span>
        </div>
        <button
          onClick={() => onConfirmar(selecao)}
          disabled={selecao.size < 2}
          className="w-full rounded-lg bg-[var(--cor-primaria)] py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {selecao.size < 2 ? 'Selecione ao menos 2 itens' : `Confirmar ${selecao.size} itens do kit`}
        </button>
      </div>
    </div>
  )
}

export function DescontoStep({
  itens,
  total,
  onAjustarQuantidade,
  onAvancar,
  onVoltar,
}: {
  itens: CarrinhoItem[]
  total: number
  onAjustarQuantidade: (produtoId: string, quantidade: number) => void
  onAvancar: (desconto: number) => void
  onVoltar: () => void
}) {
  const [descontoGeral, setDescontoGeral] = useState('')
  const [itensDoKit, setItensDoKit] = useState<Set<string>>(new Set())
  const [descontoKit, setDescontoKit] = useState('')
  const [selecionandoKit, setSelecionandoKit] = useState(false)

  useEffect(() => {
    const idsValidos = new Set(itens.map((i) => i.produto.id))
    setItensDoKit((atual) => {
      const novo = new Set([...atual].filter((id) => idsValidos.has(id)))
      return novo.size === atual.size ? atual : novo
    })
  }, [itens])

  const itensDoKitOrdenados = itens.filter((i) => itensDoKit.has(i.produto.id))
  const subtotalKit = itensDoKitOrdenados.reduce(
    (acc, i) => acc + i.quantidade * precoEfetivo(i.produto),
    0,
  )

  // aceita "," ou "." como separador decimal (teclado numerico do celular
  // costuma inserir virgula, que <input type="number"> rejeita silenciosamente)
  const numeroDescontoKit =
    itensDoKit.size >= 2 ? Math.max(0, Number(descontoKit.replace(',', '.')) || 0) : 0
  const valorFinalKit = Math.max(0, subtotalKit - numeroDescontoKit)
  const numeroDescontoGeral = Math.max(0, Number(descontoGeral.replace(',', '.')) || 0)
  const numeroDesconto = numeroDescontoGeral + numeroDescontoKit
  const totalComDesconto = Math.max(0, total - numeroDesconto)
  const descontoInvalido = numeroDesconto > total || numeroDescontoKit > subtotalKit

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-2xl bg-white p-3 ring-1 ring-neutral-200">
        <p className="mb-2 text-sm font-bold text-neutral-700">
          {itens.reduce((acc, i) => acc + i.quantidade, 0)} item(ns) nesta venda
        </p>
        <ul className="flex flex-col divide-y divide-neutral-100">
          {itens.map((i) => (
            <li key={i.produto.id} className="flex flex-col gap-1.5 py-2 text-sm first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-neutral-700">{nomeCompleto(i.produto)}</span>
                <span className="shrink-0 font-medium text-neutral-900">
                  R$ {(i.quantidade * precoEfetivo(i.produto)).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAjustarQuantidade(i.produto.id, i.quantidade - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 text-base font-bold text-neutral-700"
                    aria-label={`Diminuir quantidade de ${nomeCompleto(i.produto)}`}
                  >
                    −
                  </button>
                  <span className="w-5 text-center font-medium">{i.quantidade}</span>
                  <button
                    type="button"
                    onClick={() => onAjustarQuantidade(i.produto.id, i.quantidade + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 text-base font-bold text-neutral-700"
                    aria-label={`Aumentar quantidade de ${nomeCompleto(i.produto)}`}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onAjustarQuantidade(i.produto.id, 0)}
                  className="text-xs font-medium text-red-600 underline"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {itens.length >= 2 && (
        <button
          type="button"
          onClick={() => setSelecionandoKit(true)}
          className="rounded-lg border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700"
        >
          {itensDoKit.size >= 2 ? `Editar kit (${itensDoKit.size} itens)` : 'Marcar itens do kit'}
        </button>
      )}

      {itensDoKit.size >= 2 && (
        <div className="rounded-2xl bg-white p-3 ring-1 ring-neutral-200">
          <p className="mb-1 text-sm font-bold text-neutral-700">Kit ({itensDoKit.size} itens)</p>
          <p className="mb-2 text-xs text-neutral-500">
            {itensDoKitOrdenados.map((i) => nomeCompleto(i.produto)).join(', ')}
          </p>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">Desconto do kit (R$)</span>
            <input
              type="text"
              inputMode="decimal"
              value={descontoKit}
              onChange={(e) => setDescontoKit(e.target.value.replace(/[^0-9.,]/g, ''))}
              placeholder="Ex: 20,00"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
            />
          </label>
          {numeroDescontoKit > subtotalKit && (
            <p className="mt-1 text-sm text-red-600">Desconto do kit maior que o subtotal dos itens marcados</p>
          )}

          <div className="mt-3 flex flex-col gap-1 border-t border-neutral-100 pt-3 text-sm">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal do kit</span>
              <span>R$ {subtotalKit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Desconto do kit</span>
              <span>− R$ {numeroDescontoKit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-neutral-900">
              <span>Valor final do kit</span>
              <span>R$ {valorFinalKit.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">Desconto geral (R$, opcional)</span>
        <input
          type="text"
          inputMode="decimal"
          value={descontoGeral}
          onChange={(e) => setDescontoGeral(e.target.value.replace(/[^0-9.,]/g, ''))}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
        />
      </label>

      <div className="rounded-2xl bg-white p-3 ring-1 ring-neutral-200">
        <div className="flex flex-col gap-1 text-sm">
          {itensDoKit.size >= 2 ? (
            <>
              <div className="flex justify-between text-neutral-600">
                <span>Valor final do kit</span>
                <span>R$ {valorFinalKit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Outros produtos</span>
                <span>R$ {(total - subtotalKit).toFixed(2)}</span>
              </div>
              {numeroDescontoGeral > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Desconto geral</span>
                  <span>− R$ {numeroDescontoGeral.toFixed(2)}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              {numeroDesconto > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Desconto</span>
                  <span>− R$ {numeroDesconto.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
          <div className="flex justify-between text-lg font-bold text-neutral-900">
            <span>Total</span>
            <span>R$ {totalComDesconto.toFixed(2)}</span>
          </div>
        </div>
        {numeroDesconto > total && (
          <p className="mt-2 text-sm text-red-600">Desconto não pode ser maior que o total</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onVoltar}
          className="flex-1 rounded-lg border border-neutral-300 py-3 text-sm font-medium"
        >
          Voltar
        </button>
        <button
          onClick={() => onAvancar(numeroDesconto)}
          disabled={descontoInvalido}
          className="flex-1 rounded-lg bg-[var(--cor-primaria)] py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          Avançar
        </button>
      </div>

      {selecionandoKit && (
        <SelecaoKitOverlay
          itens={itens}
          selecaoInicial={itensDoKit}
          onCancelar={() => setSelecionandoKit(false)}
          onConfirmar={(selecao) => {
            setItensDoKit(selecao)
            setSelecionandoKit(false)
          }}
        />
      )}
    </div>
  )
}
