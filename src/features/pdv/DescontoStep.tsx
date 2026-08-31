import { useEffect, useState } from 'react'
import { precoEfetivo, nomeCompleto } from '../produtos/api'
import type { CarrinhoItem, KitInfo } from './PdvPage'

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
  onAvancar: (desconto: number, kit: KitInfo | null) => void
  onVoltar: () => void
}) {
  const [descontoGeral, setDescontoGeral] = useState('')
  const [itensDoKit, setItensDoKit] = useState<Set<string>>(new Set())
  const [valorFinalKitTexto, setValorFinalKitTexto] = useState('')

  useEffect(() => {
    const idsValidos = new Set(itens.map((i) => i.produto.id))
    setItensDoKit((atual) => {
      const novo = new Set([...atual].filter((id) => idsValidos.has(id)))
      return novo.size === atual.size ? atual : novo
    })
  }, [itens])

  function alternarItemKit(produtoId: string) {
    setItensDoKit((atual) => {
      const novo = new Set(atual)
      if (novo.has(produtoId)) novo.delete(produtoId)
      else novo.add(produtoId)
      return novo
    })
  }

  const itensDoKitLista = itens.filter((i) => itensDoKit.has(i.produto.id))
  const subtotalKit = itensDoKitLista.reduce(
    (acc, i) => acc + i.quantidade * precoEfetivo(i.produto),
    0,
  )

  // aceita "," ou "." como separador decimal (teclado numerico do celular
  // costuma inserir virgula, que <input type="number"> rejeita silenciosamente)
  const valorFinalKitDigitado =
    valorFinalKitTexto === '' ? null : Number(valorFinalKitTexto.replace(',', '.')) || 0
  const valorFinalKit =
    itensDoKitLista.length >= 2 ? (valorFinalKitDigitado ?? subtotalKit) : subtotalKit
  const numeroDescontoKit = itensDoKitLista.length >= 2 ? Math.max(0, subtotalKit - valorFinalKit) : 0
  const numeroDescontoGeral = Math.max(0, Number(descontoGeral.replace(',', '.')) || 0)
  const numeroDesconto = numeroDescontoGeral + numeroDescontoKit
  const totalComDesconto = Math.max(0, total - numeroDesconto)
  const descontoInvalido = numeroDesconto > total || valorFinalKit > subtotalKit || valorFinalKit < 0

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-2xl bg-white p-3 ring-1 ring-neutral-200">
        <p className="mb-2 text-sm font-bold text-neutral-700">
          {itens.reduce((acc, i) => acc + i.quantidade, 0)} item(ns) nesta venda
        </p>
        <ul className="flex flex-col divide-y divide-neutral-100">
          {itens.map((i) => {
            const noKit = itensDoKit.has(i.produto.id)
            return (
              <li key={i.produto.id} className="flex flex-col gap-1.5 py-2 text-sm first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-neutral-700">
                    {itens.length >= 2 && (
                      <input
                        type="checkbox"
                        checked={noKit}
                        onChange={() => alternarItemKit(i.produto.id)}
                        className="h-5 w-5 shrink-0"
                        aria-label={`Incluir ${nomeCompleto(i.produto)} no kit`}
                      />
                    )}
                    <span className="truncate">{nomeCompleto(i.produto)}</span>
                  </span>
                  <span className="shrink-0 font-medium text-neutral-900">
                    R$ {(i.quantidade * precoEfetivo(i.produto)).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pl-7">
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
            )
          })}
        </ul>
      </div>

      {itensDoKitLista.length >= 2 && (
        <div className="rounded-2xl bg-white p-3 ring-1 ring-neutral-200">
          <p className="mb-1 text-sm font-bold text-neutral-700">
            Kit ({itensDoKitLista.length} itens marcados)
          </p>
          <p className="mb-2 text-xs text-neutral-500">
            {itensDoKitLista.map((i) => `${nomeCompleto(i.produto)} #${i.produto.id.slice(-4)}`).join(' | ')}
          </p>
          <p className="mb-2 text-sm text-neutral-600">
            Subtotal do kit ({itensDoKitLista.length} itens somados): R$ {subtotalKit.toFixed(2)}
          </p>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">
              Valor final do kit (R$)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={valorFinalKitTexto}
              onChange={(e) => setValorFinalKitTexto(e.target.value.replace(/[^0-9.,]/g, ''))}
              placeholder={`Ex: ${subtotalKit.toFixed(2).replace('.', ',')}`}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
            />
          </label>
          {valorFinalKit > subtotalKit && (
            <p className="mt-1 text-sm text-red-600">Valor final maior que o subtotal do kit</p>
          )}

          <div className="mt-3 flex flex-col gap-1 border-t border-neutral-100 pt-3 text-sm">
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
          {itensDoKitLista.length >= 2 ? (
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
          onClick={() =>
            onAvancar(
              numeroDesconto,
              itensDoKitLista.length >= 2
                ? { produtoIds: itensDoKitLista.map((i) => i.produto.id), valorFinal: valorFinalKit }
                : null,
            )
          }
          disabled={descontoInvalido}
          className="flex-1 rounded-lg bg-[var(--cor-primaria)] py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          Avançar
        </button>
      </div>
    </div>
  )
}
