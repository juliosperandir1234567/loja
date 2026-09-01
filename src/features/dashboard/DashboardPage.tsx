import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { AppShell } from '../../components/layout/AppShell'
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal'
import { useCancelarVenda } from '../pdv/hooks'
import { FiltroPeriodoBar } from './FiltroPeriodoBar'
import { VendasPorDiaChart } from './VendasPorDiaChart'
import { FormaPagamentoChart } from './FormaPagamentoChart'
import {
  useDashboardKpis,
  usePagamentosFiadoPeriodo,
  useItensFiadoPendenteTodos,
  useEstoqueResumo,
  LABEL_FORMA,
  type FiltroMarca,
} from './hooks'
import { calcularPeriodo, type TipoPeriodo, type Periodo } from './periodo'
import { useAniversariantesDaSemana } from '../fiado/hooks'
import { useBoletos } from '../boletos/hooks'
import { BalancoMensalSection } from './BalancoMensalSection'
import { MARCAS_FIXAS, fornecedorCanonico } from './fornecedor'
import { baixarCsv } from '../../utils/csv'
import type { FormaPagamento } from '../../types/database.types'

function StatCard({ label, valor, sub }: { label: string; valor: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-lg font-semibold text-neutral-900">{valor}</p>
      {sub && <p className="text-xs text-neutral-400">{sub}</p>}
    </div>
  )
}

const ABAS_MARCA: { valor: FiltroMarca; label: string }[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'Natura', label: 'Natura' },
  { valor: 'Boticário', label: 'Boticário' },
]

export function DashboardPage() {
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodo>('hoje')
  const [personalizadoDesde, setPersonalizadoDesde] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [personalizadoAte, setPersonalizadoAte] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [filtroForma, setFiltroForma] = useState<FormaPagamento | 'todas'>('todas')
  const [filtroMarca, setFiltroMarca] = useState<FiltroMarca>('todos')
  const [mostrarDetalhesFornecedor, setMostrarDetalhesFornecedor] = useState(false)
  const [vendaParaExcluir, setVendaParaExcluir] = useState<string | null>(null)
  const cancelarVenda = useCancelarVenda()

  async function handleExcluirVenda() {
    if (!vendaParaExcluir) return
    await cancelarVenda.mutateAsync(vendaParaExcluir)
    toast.success('Venda excluída e estoque devolvido')
    setVendaParaExcluir(null)
  }

  const periodo: Periodo = useMemo(() => {
    if (tipoPeriodo === 'personalizado') {
      return calcularPeriodo('personalizado', {
        desde: new Date(`${personalizadoDesde}T00:00:00`),
        ate: new Date(`${personalizadoAte}T23:59:59`),
      })
    }
    return calcularPeriodo(tipoPeriodo)
  }, [tipoPeriodo, personalizadoDesde, personalizadoAte])

  const { kpis, isLoading, vendas, itens } = useDashboardKpis(periodo, filtroMarca)
  const { data: aniversariantes } = useAniversariantesDaSemana()
  const { data: boletos } = useBoletos()
  const { data: pagamentosFiadoPeriodo } = usePagamentosFiadoPeriodo(periodo)
  const { data: itensFiadoPendenteTodos } = useItensFiadoPendenteTodos()
  const estoqueResumo = useEstoqueResumo(filtroMarca)

  const boletosFiltrados =
    filtroMarca === 'todos'
      ? (boletos ?? [])
      : (boletos ?? []).filter((b) => fornecedorCanonico(b.fornecedor) === filtroMarca)

  const totalFiadoAberto = (itensFiadoPendenteTodos ?? [])
    .filter((i) => filtroMarca === 'todos' || i.produto_marca === filtroMarca)
    .reduce((acc, i) => acc + (Number(i.subtotal) - Number(i.valor_pago)), 0)

  const boletosPendentes = boletosFiltrados.filter((b) => b.status === 'pendente')
  const totalBoletosPendentes = boletosPendentes.reduce((acc, b) => acc + Number(b.valor), 0)

  const caixaContaPorMarca = useMemo(() => {
    const base: Record<string, { caixa: number; conta: number }> = Object.fromEntries(
      MARCAS_FIXAS.map((m) => [m, { caixa: 0, conta: 0 }]),
    )

    // vendas diretas: cada item já sabe sua marca e a forma de pagamento da venda
    for (const i of itens) {
      const bucket = base[i.produto_marca]
      if (!bucket) continue
      if (i.forma_pagamento === 'dinheiro') bucket.caixa += Number(i.subtotal)
      else if (i.forma_pagamento === 'pix' || i.forma_pagamento === 'cartao') bucket.conta += Number(i.subtotal)
    }

    // subtotal por venda e marca, usado pra ratear pagamentos sem item específico
    // (entrada lançada na hora da venda) proporcionalmente entre as marcas da venda
    const subtotalPorVendaEMarca = new Map<string, Map<string, number>>()
    for (const i of itens) {
      const mapaMarca = subtotalPorVendaEMarca.get(i.venda_id) ?? new Map<string, number>()
      mapaMarca.set(i.produto_marca, (mapaMarca.get(i.produto_marca) ?? 0) + Number(i.subtotal))
      subtotalPorVendaEMarca.set(i.venda_id, mapaMarca)
    }

    for (const p of pagamentosFiadoPeriodo ?? []) {
      const bucketNome =
        p.forma_recebimento === 'dinheiro'
          ? 'caixa'
          : p.forma_recebimento === 'pix' || p.forma_recebimento === 'cartao'
            ? 'conta'
            : null
      if (!bucketNome) continue

      if (p.produto_marca) {
        if (base[p.produto_marca]) base[p.produto_marca][bucketNome] += Number(p.valor_pago)
        continue
      }

      const mapaMarca = subtotalPorVendaEMarca.get(p.venda_id)
      if (!mapaMarca) continue
      const total = Array.from(mapaMarca.values()).reduce((a, b) => a + b, 0)
      if (total <= 0) continue
      for (const [marca, subtotal] of mapaMarca) {
        if (!base[marca]) continue
        base[marca][bucketNome] += (subtotal / total) * Number(p.valor_pago)
      }
    }

    return base
  }, [itens, pagamentosFiadoPeriodo])

  const financeiroPorMarca = MARCAS_FIXAS.map((marca) => {
    const boletoPendente = (boletos ?? [])
      .filter((b) => b.status === 'pendente' && fornecedorCanonico(b.fornecedor) === marca)
      .reduce((acc, b) => acc + Number(b.valor), 0)
    const prazoAberto = (itensFiadoPendenteTodos ?? [])
      .filter((i) => i.produto_marca === marca)
      .reduce((acc, i) => acc + (Number(i.subtotal) - Number(i.valor_pago)), 0)
    const { caixa, conta } = caixaContaPorMarca[marca] ?? { caixa: 0, conta: 0 }
    return {
      marca,
      boletoPendente,
      prazoAberto,
      caixa,
      conta,
      total: caixa + conta + prazoAberto - boletoPendente,
    }
  })

  const caixaVendasDiretas = (kpis?.porFormaPagamento ?? [])
    .filter((p) => p.forma === 'dinheiro' || p.forma === 'pix' || p.forma === 'cartao')
    .reduce((acc, p) => acc + p.valor, 0)
  // inclui entradas e pagamentos de vendas a prazo recebidos no período — antes esse
  // dinheiro não entrava no caixa mesmo já tendo sido recebido de fato.
  // pagamentos sem item específico (entrada na hora da venda) só entram na visão "Todos",
  // já que não dá pra saber com certeza de qual marca era aquele dinheiro.
  const caixaPagamentosAPrazo = (pagamentosFiadoPeriodo ?? [])
    .filter((p) => (filtroMarca === 'todos' ? true : p.produto_marca === filtroMarca))
    .reduce((acc, p) => acc + Number(p.valor_pago), 0)
  const caixaRecebido = caixaVendasDiretas + caixaPagamentosAPrazo
  const resultadoFinanceiro = caixaRecebido + totalFiadoAberto - totalBoletosPendentes

  const resultadoPorFornecedor = useMemo(() => {
    const fornecedores = [
      ...MARCAS_FIXAS,
      ...Array.from(
        new Set(
          (boletos ?? [])
            .map((b) => fornecedorCanonico(b.fornecedor))
            .filter((f) => !MARCAS_FIXAS.includes(f)),
        ),
      ).sort(),
    ]

    return fornecedores
      .map((fornecedor) => {
        const vendido = itens
          .filter((i) => i.produto_marca === fornecedor)
          .reduce((acc, i) => acc + Number(i.subtotal), 0)
        const boletoPendente = (boletos ?? [])
          .filter((b) => b.status === 'pendente' && fornecedorCanonico(b.fornecedor) === fornecedor)
          .reduce((acc, b) => acc + Number(b.valor), 0)
        return { fornecedor, vendido, boletoPendente, resultado: vendido - boletoPendente }
      })
      .filter((f) => f.vendido > 0 || f.boletoPendente > 0)
  }, [itens, boletos])

  const itensDaMarca = useMemo(
    () => (filtroMarca === 'todos' ? itens : itens.filter((i) => i.produto_marca === filtroMarca)),
    [itens, filtroMarca],
  )
  const vendaIdsComMarca = useMemo(
    () => new Set(itensDaMarca.map((i) => i.venda_id)),
    [itensDaMarca],
  )

  const vendasFiltradas = vendas
    .filter((v) => filtroMarca === 'todos' || vendaIdsComMarca.has(v.id))
    .filter((v) => filtroForma === 'todas' || v.forma_pagamento === filtroForma)

  const itensPorVenda = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const i of itensDaMarca) {
      const atual = mapa.get(i.venda_id) ?? ''
      const linha = `${i.quantidade}x ${i.produto_nome}`
      mapa.set(i.venda_id, atual ? `${atual}, ${linha}` : linha)
    }
    return mapa
  }, [itensDaMarca])

  const totalPorCliente = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const v of vendas) {
      if (!v.cliente_id) continue
      mapa.set(v.cliente_id, (mapa.get(v.cliente_id) ?? 0) + Number(v.valor_total))
    }
    return mapa
  }, [vendas])

  function handleExportarCsv() {
    const cabecalho = [
      'Data',
      'Cliente',
      'Telefone',
      'Vendedor',
      'Forma de pagamento',
      'Status',
      'Itens',
      'Desconto',
      'Entrada',
      'Valor total',
      'Combinado',
    ]
    const linhas = vendasFiltradas.map((v) => [
      format(new Date(v.criado_em), 'dd/MM/yyyy HH:mm'),
      v.cliente_nome ?? '',
      v.cliente_telefone ?? '',
      v.vendedor_nome,
      LABEL_FORMA[v.forma_pagamento],
      v.status,
      itensPorVenda.get(v.id) ?? '',
      Number(v.desconto).toFixed(2),
      Number(v.valor_entrada).toFixed(2),
      Number(v.valor_total).toFixed(2),
      v.combinacao ?? '',
    ])
    baixarCsv(`vendas-${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`, cabecalho, linhas)
  }

  return (
    <AppShell title="Painel">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex gap-2">
          {ABAS_MARCA.map((aba) => (
            <button
              key={aba.valor}
              onClick={() => setFiltroMarca(aba.valor)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                filtroMarca === aba.valor
                  ? 'bg-[var(--cor-primaria)] text-white'
                  : 'bg-white text-neutral-600 ring-1 ring-neutral-200'
              }`}
            >
              {aba.label}
            </button>
          ))}
        </div>

        <FiltroPeriodoBar
          tipo={tipoPeriodo}
          onChange={setTipoPeriodo}
          personalizadoDesde={personalizadoDesde}
          personalizadoAte={personalizadoAte}
          onChangePersonalizado={(d, a) => {
            setPersonalizadoDesde(d)
            setPersonalizadoAte(a)
          }}
        />

        {isLoading && <p className="text-neutral-400">Carregando...</p>}

        {kpis && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Faturamento"
                valor={`R$ ${kpis.faturamentoTotal.toFixed(2)}`}
                sub={
                  kpis.variacaoPercentual !== null
                    ? `${kpis.variacaoPercentual >= 0 ? '+' : ''}${kpis.variacaoPercentual.toFixed(0)}%`
                    : undefined
                }
              />
              <StatCard label="Vendas realizadas" valor={String(kpis.numeroVendas)} />
              <StatCard label="Itens vendidos" valor={String(kpis.itensVendidos)} />
              <StatCard label="Lucro bruto estimado" valor={`R$ ${kpis.lucroBrutoEstimado.toFixed(2)}`} />
              <StatCard label="Maior venda" valor={`R$ ${kpis.maiorVenda.toFixed(2)}`} />
              <StatCard
                label="Boletos pendentes"
                valor={`R$ ${totalBoletosPendentes.toFixed(2)}`}
                sub={`${boletosPendentes.length} boleto${boletosPendentes.length === 1 ? '' : 's'}`}
              />
            </div>

            <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
              <h2 className="mb-1 text-sm font-medium text-neutral-700">Financeiro por fornecedor</h2>
              <p className="mb-3 text-xs text-neutral-400">
                Dinheiro cai no caixa, PIX e cartão caem na conta — no período selecionado
              </p>
              <div className="flex flex-col gap-3">
                {financeiroPorMarca.map((f) => (
                  <div key={f.marca}>
                    <p className="mb-1.5 text-xs font-medium text-neutral-500">{f.marca}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard label="Boleto pendente" valor={`R$ ${f.boletoPendente.toFixed(2)}`} />
                      <StatCard label="A prazo em aberto" valor={`R$ ${f.prazoAberto.toFixed(2)}`} />
                      <StatCard label="Caixa (dinheiro)" valor={`R$ ${f.caixa.toFixed(2)}`} />
                      <StatCard label="Conta (PIX/cartão)" valor={`R$ ${f.conta.toFixed(2)}`} />
                    </div>
                    <div
                      className={`mt-3 rounded-xl p-3 ring-1 ${
                        f.total >= 0 ? 'bg-green-50 ring-green-200' : 'bg-red-50 ring-red-200'
                      }`}
                    >
                      <p className={`text-xs ${f.total >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        Total (caixa + conta + a prazo − boleto)
                      </p>
                      <p
                        className={`text-lg font-semibold ${
                          f.total >= 0 ? 'text-green-800' : 'text-red-800'
                        }`}
                      >
                        R$ {f.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
              <h2 className="mb-3 text-sm font-medium text-neutral-700">Estoque atual</h2>
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Unidades" valor={String(estoqueResumo.totalUnidades)} />
                <StatCard
                  label="Valor (custo)"
                  valor={`R$ ${estoqueResumo.valorCusto.toFixed(2)}`}
                />
                <StatCard
                  label="Valor (venda)"
                  valor={`R$ ${estoqueResumo.valorVenda.toFixed(2)}`}
                />
              </div>
              <div className="mt-3 rounded-lg bg-green-50 p-3 ring-1 ring-green-200">
                <p className="text-xs font-medium text-green-800">Lucro potencial (se vender tudo)</p>
                <p className="text-lg font-semibold text-green-800">
                  R$ {(estoqueResumo.valorVenda - estoqueResumo.valorCusto).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
              <h2 className="mb-3 text-sm font-medium text-neutral-700">Resultado financeiro</h2>

              <div className="mb-2 rounded-lg bg-green-50 p-3 ring-1 ring-green-200">
                <p className="text-xs font-medium text-green-800">Você tem / vai receber</p>
                <p className="text-lg font-semibold text-green-800">
                  R$ {(caixaRecebido + totalFiadoAberto).toFixed(2)}
                </p>
                <p className="text-xs text-green-700">
                  Caixa no período: R$ {caixaRecebido.toFixed(2)} · A prazo em aberto: R${' '}
                  {totalFiadoAberto.toFixed(2)}
                </p>
              </div>

              <div className="mb-3 rounded-lg bg-red-50 p-3 ring-1 ring-red-200">
                <p className="text-xs font-medium text-red-800">Você deve</p>
                <p className="text-lg font-semibold text-red-800">
                  R$ {totalBoletosPendentes.toFixed(2)}
                </p>
                <Link to="/boletos" className="text-xs text-red-700 underline">
                  Ver boletos a pagar
                </Link>
              </div>

              <p className="border-t border-neutral-200 pt-2 text-sm text-neutral-600">
                Se recebesse tudo e pagasse tudo agora, sobraria:{' '}
                <span
                  className={`font-semibold ${resultadoFinanceiro >= 0 ? 'text-green-700' : 'text-red-700'}`}
                >
                  R$ {resultadoFinanceiro.toFixed(2)}
                </span>
              </p>

              {filtroMarca === 'todos' && resultadoPorFornecedor.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setMostrarDetalhesFornecedor((v) => !v)}
                    className="text-xs text-neutral-400 underline"
                  >
                    {mostrarDetalhesFornecedor ? 'Ocultar' : 'Ver'} detalhes por fornecedor
                  </button>
                  {mostrarDetalhesFornecedor && (
                    <ul className="mt-2 flex flex-col gap-1 border-t border-neutral-200 pt-2">
                      {resultadoPorFornecedor.map((f) => (
                        <li key={f.fornecedor} className="flex items-center justify-between text-sm">
                          <span className="text-neutral-700">
                            {f.fornecedor}
                            <span className="ml-1 text-xs text-neutral-400">
                              (vendido R$ {f.vendido.toFixed(2)} − boleto R$ {f.boletoPendente.toFixed(2)})
                            </span>
                          </span>
                          <span
                            className={`font-medium ${f.resultado >= 0 ? 'text-green-700' : 'text-red-700'}`}
                          >
                            R$ {f.resultado.toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <BalancoMensalSection boletos={boletos ?? []} filtroMarca={filtroMarca} />

            {aniversariantes && aniversariantes.length > 0 && (
              <Link
                to="/fiado"
                className="rounded-xl bg-pink-50 p-3 text-sm font-medium text-pink-900 ring-1 ring-pink-200"
              >
                🎂 {aniversariantes.length} cliente(s) fazem aniversário essa semana
              </Link>
            )}

            <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
              <h2 className="mb-2 text-sm font-medium text-neutral-700">Vendas por dia</h2>
              <VendasPorDiaChart dados={kpis.vendasPorDia} />
            </div>

            <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
              <h2 className="mb-2 text-sm font-medium text-neutral-700">Por forma de pagamento</h2>
              <FormaPagamentoChart dados={kpis.porFormaPagamento} />
            </div>

            <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
              <h2 className="mb-2 text-sm font-medium text-neutral-700">Produtos mais vendidos</h2>
              {kpis.produtosMaisVendidos.length === 0 ? (
                <p className="text-sm text-neutral-400">Sem vendas no período.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {kpis.produtosMaisVendidos.map((p) => (
                    <li key={p.produto} className="flex justify-between text-sm">
                      <span className="text-neutral-700">
                        {p.quantidade}x {p.produto}
                      </span>
                      <span className="font-medium text-neutral-900">R$ {p.valor.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
              <h2 className="mb-2 text-sm font-medium text-neutral-700">Desempenho por vendedor</h2>
              {kpis.porVendedor.length === 0 ? (
                <p className="text-sm text-neutral-400">Sem vendas no período.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {kpis.porVendedor.map((v) => (
                    <li key={v.vendedor} className="flex justify-between text-sm">
                      <span className="text-neutral-700">
                        {v.vendedor} ({v.quantidade})
                      </span>
                      <span className="font-medium text-neutral-900">R$ {v.valor.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="print-area rounded-xl bg-white p-3 ring-1 ring-neutral-200">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-medium text-neutral-700">Histórico de vendas</h2>
                <div className="no-print flex items-center gap-2">
                  <select
                    value={filtroForma}
                    onChange={(e) => setFiltroForma(e.target.value as FormaPagamento | 'todas')}
                    className="rounded-lg border border-neutral-300 px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="todas">Todas</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="cartao">Cartão</option>
                    <option value="fiado">A prazo</option>
                  </select>
                  <button
                    onClick={handleExportarCsv}
                    disabled={vendasFiltradas.length === 0}
                    className="rounded-lg border border-neutral-300 px-2 py-1 text-xs font-medium disabled:opacity-50"
                  >
                    Exportar CSV
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="rounded-lg border border-neutral-300 px-2 py-1 text-xs font-medium"
                  >
                    Imprimir
                  </button>
                </div>
              </div>
              {vendasFiltradas.length === 0 ? (
                <p className="text-sm text-neutral-400">Nenhuma venda encontrada.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {vendasFiltradas.map((v) => (
                    <li key={v.id} className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-2 text-sm last:border-0">
                      <div className="min-w-0">
                        <p className="text-neutral-800">
                          {v.cliente_nome ?? 'Cliente não identificado'}
                        </p>
                        {v.cliente_telefone && (
                          <p className="text-xs text-neutral-400">{v.cliente_telefone}</p>
                        )}
                        <p className="truncate text-xs text-neutral-500">
                          {itensPorVenda.get(v.id) ?? '—'}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {format(new Date(v.criado_em), "dd/MM/yyyy 'às' HH:mm")} · {v.vendedor_nome} ·{' '}
                          {LABEL_FORMA[v.forma_pagamento]}
                        </p>
                        {v.cliente_id && (totalPorCliente.get(v.cliente_id) ?? 0) > Number(v.valor_total) && (
                          <p className="text-xs text-neutral-400">
                            Total do cliente no período: R${' '}
                            {(totalPorCliente.get(v.cliente_id) ?? 0).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-medium text-neutral-900">
                          {filtroMarca === 'todos'
                            ? `R$ ${Number(v.valor_total).toFixed(2)}`
                            : `R$ ${itensDaMarca
                                .filter((i) => i.venda_id === v.id)
                                .reduce((acc, i) => acc + Number(i.subtotal), 0)
                                .toFixed(2)}`}
                        </p>
                        {v.status === 'pendente' && (
                          <p className="text-xs font-medium text-amber-600">Pendente</p>
                        )}
                        {v.status === 'pago' && (
                          <p className="text-xs font-medium text-green-600">Pago</p>
                        )}
                        <button
                          onClick={() => setVendaParaExcluir(v.id)}
                          className="no-print mt-1 text-xs text-red-600 underline"
                        >
                          Excluir
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      {vendaParaExcluir && (
        <ConfirmDeleteModal
          titulo="Excluir venda"
          descricao="A venda é cancelada, some dos relatórios e o estoque dos itens é devolvido. Essa ação não pode ser desfeita."
          onConfirm={handleExcluirVenda}
          onClose={() => setVendaParaExcluir(null)}
        />
      )}
    </AppShell>
  )
}
