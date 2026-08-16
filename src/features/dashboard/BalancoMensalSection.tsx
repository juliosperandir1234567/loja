import { Fragment, useMemo, useState } from 'react'
import { useItensAno, type FiltroMarca } from './hooks'
import { MARCAS_FIXAS, fornecedorCanonico } from './fornecedor'
import { CompraVendaChart } from './CompraVendaChart'
import type { BoletoCompra } from '../boletos/api'

const MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

interface DadosFornecedorMes {
  venda: number
  boleto: number
}

interface LinhaMes {
  mes: number
  porFornecedor: Record<string, DadosFornecedorMes>
  totalVenda: number
  totalBoleto: number
  resultado: number
}

function fornecedorVazio(): DadosFornecedorMes {
  return { venda: 0, boleto: 0 }
}

export function BalancoMensalSection({
  boletos,
  filtroMarca,
}: {
  boletos: BoletoCompra[]
  filtroMarca: FiltroMarca
}) {
  const anoAtual = new Date().getFullYear()
  const mesAtual = new Date().getMonth()
  const [ano, setAno] = useState(anoAtual)
  const [somenteVendas, setSomenteVendas] = useState(false)
  const { data: itensAno, isLoading } = useItensAno(ano)

  const fornecedores = useMemo(() => {
    if (filtroMarca !== 'todos') return [filtroMarca]
    const outros = boletos
      .map((b) => fornecedorCanonico(b.fornecedor))
      .filter((f) => !MARCAS_FIXAS.includes(f))
    return [...MARCAS_FIXAS, ...Array.from(new Set(outros)).sort()]
  }, [boletos, filtroMarca])
  const fornecedoresPermitidos = new Set(fornecedores)

  const linhas: LinhaMes[] = useMemo(() => {
    const base: LinhaMes[] = Array.from({ length: 12 }, (_, i) => ({
      mes: i,
      porFornecedor: Object.fromEntries(fornecedores.map((f) => [f, fornecedorVazio()])),
      totalVenda: 0,
      totalBoleto: 0,
      resultado: 0,
    }))

    for (const item of itensAno ?? []) {
      const marca = item.produto_marca
      if (!fornecedoresPermitidos.has(marca)) continue
      const m = new Date(item.criado_em).getMonth()
      if (!base[m].porFornecedor[marca]) base[m].porFornecedor[marca] = fornecedorVazio()
      base[m].porFornecedor[marca].venda += Number(item.subtotal)
      base[m].totalVenda += Number(item.subtotal)
    }

    for (const b of boletos) {
      if (b.status !== 'pago' || !b.data_pagamento) continue
      const chave = fornecedorCanonico(b.fornecedor)
      if (!fornecedoresPermitidos.has(chave)) continue
      const data = new Date(b.data_pagamento)
      if (data.getFullYear() !== ano) continue
      const m = data.getMonth()
      if (!base[m].porFornecedor[chave]) base[m].porFornecedor[chave] = fornecedorVazio()
      base[m].porFornecedor[chave].boleto += Number(b.valor)
      base[m].totalBoleto += Number(b.valor)
    }

    for (const linha of base) {
      linha.resultado = linha.totalVenda - linha.totalBoleto
    }

    return base
  }, [itensAno, boletos, ano, fornecedores])

  const mesAtualDados = ano === anoAtual ? linhas[mesAtual] : null

  const totalAnoPorFornecedor = useMemo(() => {
    const totais: Record<string, DadosFornecedorMes> = Object.fromEntries(
      fornecedores.map((f) => [f, fornecedorVazio()]),
    )
    let totalVenda = 0
    let totalBoleto = 0
    for (const linha of linhas) {
      for (const f of fornecedores) {
        const d = linha.porFornecedor[f] ?? fornecedorVazio()
        totais[f].venda += d.venda
        totais[f].boleto += d.boleto
      }
      totalVenda += linha.totalVenda
      totalBoleto += linha.totalBoleto
    }
    return { porFornecedor: totais, totalVenda, totalBoleto, resultado: totalVenda - totalBoleto }
  }, [linhas, fornecedores])

  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-neutral-700">Balanço mensal por fornecedor</h2>
        <div className="flex gap-2">
          <select
            value={somenteVendas ? 'vendas' : 'tudo'}
            onChange={(e) => setSomenteVendas(e.target.value === 'vendas')}
            className="rounded-lg border border-neutral-300 px-2 py-1 text-xs focus:outline-none"
          >
            <option value="tudo">Vendas e boletos</option>
            <option value="vendas">Somente vendas</option>
          </select>
          <select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="rounded-lg border border-neutral-300 px-2 py-1 text-xs focus:outline-none"
          >
            {[anoAtual, anoAtual - 1, anoAtual - 2].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <p className="text-sm text-neutral-400">Carregando...</p>}

      {mesAtualDados && (
        <div className="mb-3 rounded-lg bg-green-50 p-3 ring-1 ring-green-200">
          <p className="mb-1 text-xs font-medium text-green-900">
            Mês atual — {MESES[mesAtual]}/{anoAtual}
          </p>
          <div className="flex flex-col gap-0.5 text-sm text-green-900">
            {fornecedores.map((f) => {
              const d = mesAtualDados.porFornecedor[f]
              if (!d || (d.venda === 0 && d.boleto === 0)) return null
              return (
                <div key={f} className="flex justify-between">
                  <span>{f}</span>
                  <span>
                    Venda R$ {d.venda.toFixed(2)}
                    {!somenteVendas && ` · Boleto R$ ${d.boleto.toFixed(2)}`}
                  </span>
                </div>
              )
            })}
            <div className="flex justify-between font-semibold">
              <span>Total do mês</span>
              <span>
                Venda R$ {mesAtualDados.totalVenda.toFixed(2)}
                {!somenteVendas && ` · Resultado R$ ${mesAtualDados.resultado.toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-neutral-400">
              <th className="pb-1 pr-2 font-medium">Mês</th>
              {fornecedores.map((f) => (
                <th key={f} className="pb-1 pr-2 text-right font-medium" colSpan={somenteVendas ? 1 : 2}>
                  {f}
                </th>
              ))}
              <th className="pb-1 text-right font-medium">Total</th>
            </tr>
            <tr className="text-left text-neutral-300">
              <th></th>
              {fornecedores.map((f) => (
                <Fragment key={f}>
                  <th className="pr-2 text-right font-normal">Venda</th>
                  {!somenteVendas && <th className="pr-2 text-right font-normal">Boleto</th>}
                </Fragment>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr
                key={l.mes}
                className={`border-t border-neutral-100 ${
                  ano === anoAtual && l.mes === mesAtual ? 'bg-green-50' : ''
                }`}
              >
                <td className="py-1 pr-2 text-neutral-700">{MESES[l.mes]}</td>
                {fornecedores.map((f) => {
                  const d = l.porFornecedor[f] ?? fornecedorVazio()
                  return (
                    <Fragment key={f}>
                      <td className="py-1 pr-2 text-right text-neutral-700">
                        {d.venda > 0 ? `R$ ${d.venda.toFixed(2)}` : '—'}
                      </td>
                      {!somenteVendas && (
                        <td className="py-1 pr-2 text-right text-neutral-700">
                          {d.boleto > 0 ? `R$ ${d.boleto.toFixed(2)}` : '—'}
                        </td>
                      )}
                    </Fragment>
                  )
                })}
                <td
                  className={`py-1 text-right font-medium ${
                    somenteVendas
                      ? 'text-neutral-900'
                      : l.resultado >= 0
                        ? 'text-green-700'
                        : 'text-red-700'
                  }`}
                >
                  R$ {(somenteVendas ? l.totalVenda : l.resultado).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-neutral-300 font-semibold text-neutral-900">
              <td className="py-1 pr-2">Total {ano}</td>
              {fornecedores.map((f) => {
                const d = totalAnoPorFornecedor.porFornecedor[f] ?? fornecedorVazio()
                return (
                  <Fragment key={f}>
                    <td className="py-1 pr-2 text-right">R$ {d.venda.toFixed(2)}</td>
                    {!somenteVendas && (
                      <td className="py-1 pr-2 text-right">R$ {d.boleto.toFixed(2)}</td>
                    )}
                  </Fragment>
                )
              })}
              <td
                className={`py-1 text-right ${
                  somenteVendas
                    ? ''
                    : totalAnoPorFornecedor.resultado >= 0
                      ? 'text-green-700'
                      : 'text-red-700'
                }`}
              >
                R${' '}
                {(somenteVendas
                  ? totalAnoPorFornecedor.totalVenda
                  : totalAnoPorFornecedor.resultado
                ).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 border-t border-neutral-200 pt-3">
        <h3 className="mb-2 text-xs font-medium text-neutral-700">Compra x Venda — {ano}</h3>
        <CompraVendaChart
          dados={linhas.map((l) => ({
            mes: MESES[l.mes],
            compra: l.totalBoleto,
            venda: l.totalVenda,
          }))}
        />
      </div>
    </div>
  )
}
