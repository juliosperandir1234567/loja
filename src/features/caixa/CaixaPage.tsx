import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { AppShell } from '../../components/layout/AppShell'
import { useSaldoCaixa, useAtualizarSaldoCaixa } from './hooks'
import type { Marca } from '../../types/database.types'

const MARCAS: Marca[] = ['Natura', 'Boticário']

export function CaixaPage() {
  const { data: saldos, isLoading } = useSaldoCaixa()
  const atualizar = useAtualizarSaldoCaixa()
  const [valores, setValores] = useState<Record<string, { caixa: string; conta: string }>>({})

  useEffect(() => {
    if (!saldos) return
    const novo: Record<string, { caixa: string; conta: string }> = {}
    for (const s of saldos) {
      novo[s.fornecedor] = {
        caixa: Number(s.saldo_caixa).toFixed(2).replace('.', ','),
        conta: Number(s.saldo_conta).toFixed(2).replace('.', ','),
      }
    }
    setValores(novo)
  }, [saldos])

  function numero(marca: Marca, campo: 'caixa' | 'conta') {
    return Number((valores[marca]?.[campo] ?? '').replace(',', '.')) || 0
  }

  async function handleSalvar(marca: Marca) {
    try {
      await atualizar.mutateAsync({
        fornecedor: marca,
        saldoCaixa: numero(marca, 'caixa'),
        saldoConta: numero(marca, 'conta'),
      })
      toast.success(`Saldo de ${marca} atualizado`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar saldo')
    }
  }

  return (
    <AppShell title="Caixa">
      <div className="flex flex-col gap-4 p-4">
        <p className="text-sm text-neutral-500">
          Digite quanto tem de verdade no caixa (dinheiro) e na conta (banco) de cada fornecedor.
          Esse valor fica registrado até você atualizar de novo.
        </p>

        {isLoading && <p className="text-sm text-neutral-400">Carregando...</p>}

        {MARCAS.map((marca) => {
          const saldo = saldos?.find((s) => s.fornecedor === marca)
          return (
            <div key={marca} className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
              <h2 className="mb-3 text-sm font-medium text-neutral-700">{marca}</h2>

              <div className="flex flex-col gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-neutral-700">
                    Saldo em caixa
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valores[marca]?.caixa ?? ''}
                    onChange={(e) =>
                      setValores((v) => ({
                        ...v,
                        [marca]: { caixa: e.target.value, conta: v[marca]?.conta ?? '' },
                      }))
                    }
                    placeholder="0,00"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-neutral-700">
                    Saldo em conta
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valores[marca]?.conta ?? ''}
                    onChange={(e) =>
                      setValores((v) => ({
                        ...v,
                        [marca]: { caixa: v[marca]?.caixa ?? '', conta: e.target.value },
                      }))
                    }
                    placeholder="0,00"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
                  />
                </label>

                <div className="rounded-lg bg-green-50 p-3 ring-1 ring-green-200">
                  <p className="text-xs font-medium text-green-800">Total (caixa + conta)</p>
                  <p className="text-lg font-semibold text-green-800">
                    R$ {(numero(marca, 'caixa') + numero(marca, 'conta')).toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => handleSalvar(marca)}
                  disabled={atualizar.isPending}
                  className="rounded-lg bg-[var(--cor-primaria)] py-3 text-sm font-medium text-white disabled:opacity-50"
                >
                  {atualizar.isPending ? 'Salvando...' : `Salvar ${marca}`}
                </button>

                {saldo && (
                  <p className="text-center text-xs text-neutral-400">
                    Última atualização: {format(new Date(saldo.atualizado_em), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </AppShell>
  )
}
