import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { AppShell } from '../../components/layout/AppShell'
import { useCliente } from '../clientes/hooks'
import {
  useItensFiadoPendenteCliente,
  useRegistrarPagamentoItens,
  useHistoricoVendasCliente,
} from './hooks'
import { buscarSaldoCliente, listarPagamentosCliente } from './api'
import { buscarConfiguracoes } from '../configuracoes/api'
import { gerarPdfPagamento, type PagamentoHistorico } from './pdfPagamento'
import { abrirWhatsApp } from '../../utils/whatsapp'
import type { FormaRecebimento } from '../../types/database.types'

interface Recibo {
  valorPago: number
  saldoRestante: number
  dataHora: string
  itens: string[]
}

function paraPagamentoHistorico(p: {
  valor_pago: number
  criado_em: string
  forma_recebimento: string
}): PagamentoHistorico {
  return { valorPago: Number(p.valor_pago), dataHora: p.criado_em, formaRecebimento: p.forma_recebimento }
}

const FORMA_LABEL: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao: 'Cartão',
  fiado: 'A prazo',
}

const OPCOES_RECEBIMENTO: { valor: FormaRecebimento; label: string }[] = [
  { valor: 'dinheiro', label: 'Dinheiro' },
  { valor: 'pix', label: 'PIX' },
  { valor: 'cartao', label: 'Cartão' },
]

export function ClienteFiadoDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: cliente } = useCliente(id)
  const { data: itens, isLoading } = useItensFiadoPendenteCliente(id)
  const { data: historico, isLoading: carregandoHistorico } = useHistoricoVendasCliente(id)
  const registrarItens = useRegistrarPagamentoItens()

  const [valores, setValores] = useState<Record<string, string>>({})
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [recibo, setRecibo] = useState<Recibo | null>(null)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [gerandoExtrato, setGerandoExtrato] = useState(false)
  const [pagandoTudo, setPagandoTudo] = useState(false)
  const [mostrarHistorico, setMostrarHistorico] = useState(false)
  const [valorParcial, setValorParcial] = useState('')
  const [pagandoParcial, setPagandoParcial] = useState(false)
  const [formaRecebimento, setFormaRecebimento] = useState<FormaRecebimento>('dinheiro')

  const porVenda = useMemo(() => {
    const mapa = new Map<string, typeof itens>()
    for (const i of itens ?? []) {
      const lista = mapa.get(i.venda_id) ?? []
      lista.push(i)
      mapa.set(i.venda_id, lista)
    }
    return Array.from(mapa.entries())
  }, [itens])

  const historicoPorVenda = useMemo(() => {
    const mapa = new Map<string, typeof historico>()
    for (const i of historico ?? []) {
      const lista = mapa.get(i.venda_id) ?? []
      lista.push(i)
      mapa.set(i.venda_id, lista)
    }
    return Array.from(mapa.entries())
  }, [historico])

  const totalEmAberto = (itens ?? []).reduce((acc, i) => acc + Number(i.restante), 0)

  function alternarItem(itemId: string, restante: number) {
    setSelecionados((atual) => {
      const novo = new Set(atual)
      if (novo.has(itemId)) {
        novo.delete(itemId)
      } else {
        novo.add(itemId)
        setValores((v) => ({ ...v, [itemId]: restante.toFixed(2) }))
      }
      return novo
    })
  }

  function marcarTodos() {
    const novoSet = new Set((itens ?? []).map((i) => i.item_id))
    const novosValores: Record<string, string> = {}
    for (const i of itens ?? []) novosValores[i.item_id] = Number(i.restante).toFixed(2)
    setSelecionados(novoSet)
    setValores(novosValores)
  }

  function limparSelecao() {
    setSelecionados(new Set())
    setValores({})
  }

  const totalSelecionado = Array.from(selecionados).reduce(
    (acc, id) => acc + (Number(valores[id]) || 0),
    0,
  )

  async function processarPagamento(
    pagamentos: { itemId: string; valor: number }[],
    nomesItens: string[],
  ) {
    if (pagamentos.length === 0) {
      toast.error('Selecione ao menos um item e informe o valor')
      return
    }
    try {
      await registrarItens.mutateAsync({ pagamentos, formaRecebimento })
      const saldoRestante = await buscarSaldoCliente(id!)
      setRecibo({
        valorPago: pagamentos.reduce((acc, p) => acc + p.valor, 0),
        saldoRestante,
        dataHora: new Date().toISOString(),
        itens: nomesItens,
      })
      limparSelecao()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar pagamento')
    }
  }

  async function handleConfirmar() {
    const pagamentos = Array.from(selecionados)
      .map((itemId) => ({ itemId, valor: Number(valores[itemId]) || 0 }))
      .filter((p) => p.valor > 0)
    const nomesItens = (itens ?? [])
      .filter((i) => selecionados.has(i.item_id))
      .map((i) => `${i.produto_nome} (R$ ${(Number(valores[i.item_id]) || 0).toFixed(2)})`)
    await processarPagamento(pagamentos, nomesItens)
  }

  async function handlePagamentoTotal() {
    if (!itens || itens.length === 0) return
    setPagandoTudo(true)
    const pagamentos = itens
      .map((i) => ({ itemId: i.item_id, valor: Number(i.restante) }))
      .filter((p) => p.valor > 0)
    const nomesItens = itens.map(
      (i) => `${i.produto_nome} (R$ ${Number(i.restante).toFixed(2)})`,
    )
    await processarPagamento(pagamentos, nomesItens)
    setPagandoTudo(false)
  }

  async function handlePagamentoParcial() {
    const valorInformado = Number(valorParcial.replace(',', '.'))
    if (!itens || itens.length === 0 || !valorInformado || valorInformado <= 0) return
    if (valorInformado > totalEmAberto) {
      toast.error('Valor maior que o total em aberto')
      return
    }
    setPagandoParcial(true)
    let restanteParaDistribuir = valorInformado
    const pagamentos: { itemId: string; valor: number }[] = []
    const nomesItens: string[] = []
    for (const i of itens) {
      if (restanteParaDistribuir <= 0) break
      const valorItem = Math.min(Number(i.restante), restanteParaDistribuir)
      if (valorItem <= 0) continue
      pagamentos.push({ itemId: i.item_id, valor: Number(valorItem.toFixed(2)) })
      nomesItens.push(`${i.produto_nome} (R$ ${valorItem.toFixed(2)})`)
      restanteParaDistribuir -= valorItem
    }
    await processarPagamento(pagamentos, nomesItens)
    setValorParcial('')
    setPagandoParcial(false)
  }

  async function handleGerarPdf() {
    if (!recibo || !cliente || !id) return
    setGerandoPdf(true)
    try {
      const [config, historicoPagamentos] = await Promise.all([
        buscarConfiguracoes(),
        listarPagamentosCliente(id),
      ])
      await gerarPdfPagamento({
        config,
        nome: cliente.nome,
        telefone: cliente.telefone,
        pagamentos: historicoPagamentos.map(paraPagamentoHistorico),
        saldoRestante: recibo.saldoRestante,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar PDF')
    } finally {
      setGerandoPdf(false)
    }
  }

  async function handleReenviarExtrato() {
    if (!cliente || !id) return
    setGerandoExtrato(true)
    try {
      const [config, historicoPagamentos, saldoAtual] = await Promise.all([
        buscarConfiguracoes(),
        listarPagamentosCliente(id),
        buscarSaldoCliente(id),
      ])
      if (historicoPagamentos.length === 0) {
        toast.error('Esse cliente ainda não tem pagamentos registrados')
        return
      }
      await gerarPdfPagamento({
        config,
        nome: cliente.nome,
        telefone: cliente.telefone,
        pagamentos: historicoPagamentos.map(paraPagamentoHistorico),
        saldoRestante: saldoAtual,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar PDF')
    } finally {
      setGerandoExtrato(false)
    }
  }

  function mensagemWhatsApp(r: Recibo) {
    const linhas = [
      '*Espaço Sperandir*',
      'Comprovante de Pagamento — Venda a Prazo',
      '',
      `Cliente: ${cliente?.nome ?? ''}`,
      `Telefone: ${cliente?.telefone ?? ''}`,
      `Data do pagamento: ${format(new Date(r.dataHora), 'dd/MM/yyyy HH:mm')}`,
      '',
      `Valor pago: R$ ${r.valorPago.toFixed(2)}`,
      r.saldoRestante > 0
        ? `Saldo restante em aberto: R$ ${r.saldoRestante.toFixed(2)}`
        : 'Conta a prazo totalmente quitada.',
    ]
    return linhas.join('\n')
  }

  if (recibo) {
    return (
      <AppShell title="Pagamento registrado">
        <div className="flex flex-col gap-4 p-4">
          <div className="rounded-xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
            <p className="text-sm text-neutral-500">{cliente?.nome}</p>
            <p className="text-lg font-semibold">R$ {recibo.valorPago.toFixed(2)}</p>
            <p className="text-sm text-neutral-500">
              {format(new Date(recibo.dataHora), 'dd/MM/yyyy HH:mm')}
            </p>
            <ul className="mt-2 text-sm text-neutral-600">
              {recibo.itens.map((i) => (
                <li key={i}>• {i}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm font-medium text-neutral-700">
              {recibo.saldoRestante > 0
                ? `Saldo restante: R$ ${recibo.saldoRestante.toFixed(2)}`
                : 'Conta a prazo quitada 🎉'}
            </p>
          </div>

          <button
            onClick={handleGerarPdf}
            disabled={gerandoPdf}
            className="rounded-lg bg-amber-600 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {gerandoPdf ? 'Gerando PDF...' : 'Gerar PDF do recibo'}
          </button>
          <button
            onClick={() => cliente && abrirWhatsApp(cliente.telefone, mensagemWhatsApp(recibo))}
            className="rounded-lg bg-green-600 py-3 text-sm font-medium text-white"
          >
            Enviar por WhatsApp
          </button>
          <button
            onClick={() => setRecibo(null)}
            className="rounded-lg border border-neutral-300 py-3 text-sm font-medium"
          >
            {recibo.saldoRestante > 0 ? 'Registrar outro recebimento' : 'Voltar'}
          </button>
          <button
            onClick={() => navigate('/fiado')}
            className="text-center text-sm text-neutral-400 underline"
          >
            Voltar para A prazo
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title={cliente?.nome ?? 'Cliente'}>
      <div className="flex flex-col gap-4 p-4 pb-28">
        <Link to="/fiado" className="text-sm text-neutral-400 underline">
          ← Voltar para A prazo
        </Link>

        <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
          <p className="text-sm text-neutral-500">{cliente?.telefone}</p>
          <p className="text-lg font-semibold text-red-700">Total em aberto: R$ {totalEmAberto.toFixed(2)}</p>
        </div>

        <button
          onClick={handleReenviarExtrato}
          disabled={gerandoExtrato}
          className="rounded-lg border border-neutral-300 py-3 text-sm font-medium text-neutral-700 disabled:opacity-50"
        >
          {gerandoExtrato ? 'Gerando PDF...' : 'Reenviar PDF do extrato de pagamentos'}
        </button>

        {isLoading && <p className="text-neutral-400">Carregando...</p>}

        {!isLoading && porVenda.length === 0 && (
          <p className="text-sm text-neutral-400">Nenhuma compra em aberto.</p>
        )}

        {totalEmAberto > 0 && (
          <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
            <p className="mb-2 text-sm font-medium text-neutral-700">Forma de recebimento</p>
            <div className="flex gap-2">
              {OPCOES_RECEBIMENTO.map((op) => (
                <button
                  key={op.valor}
                  type="button"
                  onClick={() => setFormaRecebimento(op.valor)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
                    formaRecebimento === op.valor
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

        {totalEmAberto > 0 && (
          <button
            onClick={handlePagamentoTotal}
            disabled={pagandoTudo || registrarItens.isPending}
            className="rounded-xl bg-green-600 py-4 text-lg font-bold text-white disabled:opacity-50"
          >
            {pagandoTudo ? 'Registrando...' : `Pagamento total — R$ ${totalEmAberto.toFixed(2)}`}
          </button>
        )}

        {totalEmAberto > 0 && (
          <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
            <p className="mb-2 text-sm font-medium text-neutral-700">
              Ou informe o valor recebido agora
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                max={totalEmAberto}
                placeholder="0,00"
                value={valorParcial}
                onChange={(e) => setValorParcial(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none"
              />
              <button
                onClick={handlePagamentoParcial}
                disabled={pagandoParcial || registrarItens.isPending || !valorParcial}
                className="rounded-lg bg-[var(--cor-primaria)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {pagandoParcial ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
            {Number(valorParcial.replace(',', '.')) > 0 && (
              <p className="mt-2 text-xs text-neutral-500">
                Ficará faltando: R${' '}
                {Math.max(0, totalEmAberto - Number(valorParcial.replace(',', '.'))).toFixed(2)}
              </p>
            )}
          </div>
        )}

        {porVenda.length > 0 && (
          <div className="flex gap-2">
            <button onClick={marcarTodos} className="text-sm text-neutral-600 underline">
              Ou selecione item por item
            </button>
            {selecionados.size > 0 && (
              <button onClick={limparSelecao} className="text-sm text-neutral-400 underline">
                Limpar seleção
              </button>
            )}
          </div>
        )}

        {porVenda.map(([vendaId, itensDaVenda]) => (
          <div key={vendaId} className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
            <p className="mb-2 text-xs font-medium text-neutral-500">
              Compra de {format(new Date(itensDaVenda![0].venda_criado_em), 'dd/MM/yyyy')}
              {itensDaVenda![0].combinacao && ` · Combinado: ${itensDaVenda![0].combinacao}`}
            </p>
            <ul className="flex flex-col gap-2">
              {itensDaVenda!.map((i) => (
                <li key={i.item_id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selecionados.has(i.item_id)}
                    onChange={() => alternarItem(i.item_id, Number(i.restante))}
                    className="h-4 w-4"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      {i.quantidade}x {i.produto_nome}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Restante: R$ {Number(i.restante).toFixed(2)}
                      {Number(i.valor_pago) > 0 && ` (já pago R$ ${Number(i.valor_pago).toFixed(2)})`}
                    </p>
                  </div>
                  {selecionados.has(i.item_id) && (
                    <input
                      type="number"
                      step="0.01"
                      max={i.restante}
                      value={valores[i.item_id] ?? ''}
                      onChange={(e) =>
                        setValores((v) => ({ ...v, [i.item_id]: e.target.value }))
                      }
                      className="w-24 rounded-lg border border-neutral-300 px-2 py-1.5 text-right text-sm focus:outline-none"
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="mt-2 border-t border-neutral-200 pt-3">
          <button
            onClick={() => setMostrarHistorico((v) => !v)}
            className="text-sm font-medium text-neutral-600 underline"
          >
            {mostrarHistorico ? 'Ocultar' : 'Ver'} histórico de compras
          </button>

          {mostrarHistorico && (
            <div className="mt-3 flex flex-col gap-2">
              {carregandoHistorico && <p className="text-sm text-neutral-400">Carregando...</p>}
              {!carregandoHistorico && historicoPorVenda.length === 0 && (
                <p className="text-sm text-neutral-400">Nenhuma compra encontrada.</p>
              )}
              {historicoPorVenda.map(([vendaId, itensDaVenda]) => {
                const primeiro = itensDaVenda![0]
                const valorTotal = Number(primeiro.valor_total)
                const restanteVenda = itensDaVenda!.reduce(
                  (acc, i) => acc + (Number(i.subtotal) - Number(i.valor_pago)),
                  0,
                )
                return (
                  <div
                    key={vendaId}
                    className="rounded-xl bg-white p-3 text-sm ring-1 ring-neutral-200"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-neutral-500">
                        {format(new Date(primeiro.criado_em), 'dd/MM/yyyy')} ·{' '}
                        {FORMA_LABEL[primeiro.forma_pagamento]} · {primeiro.vendedor_nome}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          primeiro.status === 'pago' ? 'text-green-600' : 'text-amber-600'
                        }`}
                      >
                        {primeiro.status === 'pago' ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                    <p className="text-neutral-700">
                      {itensDaVenda!.map((i) => `${i.quantidade}x ${i.produto_nome}`).join(', ')}
                    </p>
                    <p className="mt-1 font-semibold text-neutral-900">
                      Valor da compra: R$ {valorTotal.toFixed(2)}
                    </p>
                    {primeiro.status !== 'pago' && restanteVenda > 0 && (
                      <p className="text-xs font-medium text-amber-600">
                        Falta pagar: R$ {restanteVenda.toFixed(2)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {selecionados.size > 0 && (
        <div className="fixed inset-x-0 bottom-[4.75rem] border-t border-neutral-200 bg-white p-4">
          <div className="mb-2 flex justify-between font-semibold">
            <span>Total a receber</span>
            <span>R$ {totalSelecionado.toFixed(2)}</span>
          </div>
          <button
            onClick={handleConfirmar}
            disabled={registrarItens.isPending}
            className="w-full rounded-lg bg-[var(--cor-primaria)] py-3 text-base font-medium text-white disabled:opacity-50"
          >
            {registrarItens.isPending ? 'Registrando...' : 'Confirmar recebimento'}
          </button>
        </div>
      )}
    </AppShell>
  )
}
