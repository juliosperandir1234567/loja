import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import * as api from './api'
import { calcularPeriodoAnterior, type Periodo } from './periodo'
import type { FormaPagamento, Marca } from '../../types/database.types'

export type FiltroMarca = 'todos' | Marca

function chaveDoPeriodo(p: Periodo) {
  return `${p.desde.toISOString()}_${p.ate.toISOString()}`
}

export function useVendasPeriodo(periodo: Periodo) {
  return useQuery({
    queryKey: ['dashboard', 'vendas', chaveDoPeriodo(periodo)],
    queryFn: () => api.listarVendasPeriodo(periodo),
  })
}

export function useItensPeriodo(periodo: Periodo) {
  return useQuery({
    queryKey: ['dashboard', 'itens', chaveDoPeriodo(periodo)],
    queryFn: () => api.listarItensPeriodo(periodo),
  })
}

export function useFaturamentoPeriodoAnterior(periodo: Periodo) {
  const anterior = calcularPeriodoAnterior(periodo)
  return useQuery({
    queryKey: ['dashboard', 'vendas', chaveDoPeriodo(anterior)],
    queryFn: () => api.listarVendasPeriodo(anterior),
  })
}

export function useItensPeriodoAnterior(periodo: Periodo) {
  const anterior = calcularPeriodoAnterior(periodo)
  return useQuery({
    queryKey: ['dashboard', 'itens', chaveDoPeriodo(anterior)],
    queryFn: () => api.listarItensPeriodo(anterior),
  })
}

export function usePagamentosFiadoPeriodo(periodo: Periodo) {
  return useQuery({
    queryKey: ['dashboard', 'pagamentos-fiado', chaveDoPeriodo(periodo)],
    queryFn: () => api.listarPagamentosFiadoPeriodo(periodo),
  })
}

export function useItensFiadoPendenteTodos() {
  return useQuery({
    queryKey: ['dashboard', 'itens-fiado-pendente-todos'],
    queryFn: api.listarItensFiadoPendenteTodos,
  })
}

export function useVendasAno(ano: number) {
  return useQuery({
    queryKey: ['dashboard', 'vendas-ano', ano],
    queryFn: () => api.listarVendasAno(ano),
  })
}

export function useItensAno(ano: number) {
  return useQuery({
    queryKey: ['dashboard', 'itens-ano', ano],
    queryFn: () => api.listarItensAno(ano),
  })
}

export interface KpisDashboard {
  faturamentoTotal: number
  faturamentoAnterior: number
  variacaoPercentual: number | null
  numeroVendas: number
  itensVendidos: number
  lucroBrutoEstimado: number
  maiorVenda: number
  porFormaPagamento: { forma: FormaPagamento; valor: number; quantidade: number; percentual: number }[]
  porVendedor: { vendedor: string; valor: number; quantidade: number }[]
  produtosMaisVendidos: { produto: string; quantidade: number; valor: number }[]
  vendasPorDia: { dia: string; valor: number }[]
}

const LABEL_FORMA: Record<FormaPagamento, string> = {
  a_vista: 'À vista',
  cartao: 'Cartão',
  fiado: 'A prazo',
}

export function useDashboardKpis(periodo: Periodo, filtroMarca: FiltroMarca = 'todos') {
  const vendas = useVendasPeriodo(periodo)
  const itens = useItensPeriodo(periodo)
  const anterior = useFaturamentoPeriodoAnterior(periodo)
  const itensAnterior = useItensPeriodoAnterior(periodo)

  const isLoading =
    vendas.isLoading || itens.isLoading || anterior.isLoading || itensAnterior.isLoading

  let kpis: KpisDashboard | null = null

  if (vendas.data && itens.data) {
    const vendedorNomePorVenda = new Map(vendas.data.map((v) => [v.id, v.vendedor_nome]))

    const itensFiltrados =
      filtroMarca === 'todos' ? itens.data : itens.data.filter((i) => i.produto_marca === filtroMarca)
    const itensAnteriorFiltrados =
      filtroMarca === 'todos'
        ? (itensAnterior.data ?? [])
        : (itensAnterior.data ?? []).filter((i) => i.produto_marca === filtroMarca)

    let faturamentoTotal: number
    let faturamentoAnterior: number
    let numeroVendas: number
    let maiorVenda: number

    if (filtroMarca === 'todos') {
      // usa vendas.valor_total (já com desconto aplicado) — número exato
      faturamentoTotal = vendas.data.reduce((acc, v) => acc + Number(v.valor_total), 0)
      faturamentoAnterior = (anterior.data ?? []).reduce((acc, v) => acc + Number(v.valor_total), 0)
      numeroVendas = vendas.data.length
      maiorVenda = vendas.data.reduce((max, v) => Math.max(max, Number(v.valor_total)), 0)
    } else {
      // sem uma marca só, usa a soma dos itens daquela marca (estimativa: itens não
      // refletem desconto da venda, que é aplicado no total geral, não por item)
      const somaPorVenda = (lista: typeof itensFiltrados) => {
        const mapa = new Map<string, number>()
        for (const i of lista) mapa.set(i.venda_id, (mapa.get(i.venda_id) ?? 0) + Number(i.subtotal))
        return mapa
      }
      const mapaVendas = somaPorVenda(itensFiltrados)
      faturamentoTotal = Array.from(mapaVendas.values()).reduce((acc, v) => acc + v, 0)
      faturamentoAnterior = Array.from(somaPorVenda(itensAnteriorFiltrados).values()).reduce(
        (acc, v) => acc + v,
        0,
      )
      numeroVendas = mapaVendas.size
      maiorVenda = Array.from(mapaVendas.values()).reduce((max, v) => Math.max(max, v), 0)
    }

    const variacaoPercentual =
      faturamentoAnterior > 0
        ? ((faturamentoTotal - faturamentoAnterior) / faturamentoAnterior) * 100
        : null

    const porFormaMap = new Map<FormaPagamento, { valor: number; vendaIds: Set<string> }>()
    for (const i of itensFiltrados) {
      const atual = porFormaMap.get(i.forma_pagamento) ?? { valor: 0, vendaIds: new Set<string>() }
      atual.valor += Number(i.subtotal)
      atual.vendaIds.add(i.venda_id)
      porFormaMap.set(i.forma_pagamento, atual)
    }
    const porFormaPagamento = Array.from(porFormaMap.entries()).map(([forma, dados]) => ({
      forma,
      valor: dados.valor,
      quantidade: dados.vendaIds.size,
      percentual: faturamentoTotal > 0 ? (dados.valor / faturamentoTotal) * 100 : 0,
    }))

    const porVendedorMap = new Map<string, { valor: number; vendaIds: Set<string> }>()
    for (const i of itensFiltrados) {
      const nome = vendedorNomePorVenda.get(i.venda_id) ?? 'Desconhecido'
      const atual = porVendedorMap.get(nome) ?? { valor: 0, vendaIds: new Set<string>() }
      atual.valor += Number(i.subtotal)
      atual.vendaIds.add(i.venda_id)
      porVendedorMap.set(nome, atual)
    }
    const porVendedor = Array.from(porVendedorMap.entries())
      .map(([vendedor, dados]) => ({ vendedor, valor: dados.valor, quantidade: dados.vendaIds.size }))
      .sort((a, b) => b.valor - a.valor)

    const porProdutoMap = new Map<string, { quantidade: number; valor: number }>()
    for (const i of itensFiltrados) {
      const atual = porProdutoMap.get(i.produto_nome) ?? { quantidade: 0, valor: 0 }
      atual.quantidade += i.quantidade
      atual.valor += Number(i.subtotal)
      porProdutoMap.set(i.produto_nome, atual)
    }
    const produtosMaisVendidos = Array.from(porProdutoMap.entries())
      .map(([produto, dados]) => ({ produto, ...dados }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10)

    const porDiaMap = new Map<string, number>()
    for (const i of itensFiltrados) {
      const dia = format(new Date(i.criado_em), 'dd/MM')
      porDiaMap.set(dia, (porDiaMap.get(dia) ?? 0) + Number(i.subtotal))
    }
    const vendasPorDia = Array.from(porDiaMap.entries())
      .map(([dia, valor]) => ({ dia, valor }))
      .reverse()

    const itensVendidos = itensFiltrados.reduce((acc, i) => acc + i.quantidade, 0)
    const lucroBrutoEstimado = itensFiltrados.reduce(
      (acc, i) => acc + (Number(i.preco_unitario) - Number(i.produto_preco_custo)) * i.quantidade,
      0,
    )

    kpis = {
      faturamentoTotal,
      faturamentoAnterior,
      variacaoPercentual,
      numeroVendas,
      itensVendidos,
      lucroBrutoEstimado,
      maiorVenda,
      porFormaPagamento,
      porVendedor,
      produtosMaisVendidos,
      vendasPorDia,
    }
  }

  return { kpis, isLoading, vendas: vendas.data ?? [], itens: itens.data ?? [] }
}

export { LABEL_FORMA }
