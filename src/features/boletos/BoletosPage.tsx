import { useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { AppShell } from '../../components/layout/AppShell'
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal'
import { MARCAS_FIXAS, fornecedorCanonico } from '../dashboard/fornecedor'
import {
  useBoletos,
  useCriarBoletoParcelado,
  useMarcarBoletoComoPago,
  useAtualizarVencimentoBoleto,
  useDeletarBoletos,
} from './hooks'

const ABAS_FORNECEDOR = ['todos', ...MARCAS_FIXAS] as const

export function BoletosPage() {
  const { data: boletos, isLoading } = useBoletos()
  const criarBoletoParcelado = useCriarBoletoParcelado()
  const marcarPago = useMarcarBoletoComoPago()
  const atualizarVencimento = useAtualizarVencimentoBoleto()
  const deletarBoletos = useDeletarBoletos()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [fornecedor, setFornecedor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valorTotal, setValorTotal] = useState('')
  const [parcelas, setParcelas] = useState('1')
  const [primeiroVencimento, setPrimeiroVencimento] = useState('')
  const [editandoVencimentoId, setEditandoVencimentoId] = useState<string | null>(null)
  const [novoVencimento, setNovoVencimento] = useState('')
  const [filtroFornecedor, setFiltroFornecedor] = useState<(typeof ABAS_FORNECEDOR)[number]>('todos')
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroDescricao, setFiltroDescricao] = useState('')

  const boletosFiltrados = (boletos ?? []).filter((b) => {
    if (filtroFornecedor !== 'todos' && fornecedorCanonico(b.fornecedor) !== filtroFornecedor) {
      return false
    }
    if (filtroMes && b.vencimento.slice(0, 7) !== filtroMes) return false
    if (filtroDescricao && !(b.descricao ?? '').toLowerCase().includes(filtroDescricao.toLowerCase())) {
      return false
    }
    return true
  })

  const pendentes = boletosFiltrados.filter((b) => b.status === 'pendente')
  const pagos = boletosFiltrados.filter((b) => b.status === 'pago')
  const totalPendente = pendentes.reduce((acc, b) => acc + Number(b.valor), 0)

  const numeroTotal = Number(valorTotal)
  const numeroParcelas = Math.max(1, Number(parcelas) || 1)
  const valorPorParcela = numeroTotal > 0 ? numeroTotal / numeroParcelas : 0

  async function handleCriar() {
    if (!fornecedor.trim() || !numeroTotal || numeroTotal <= 0 || !primeiroVencimento) {
      toast.error('Preencha fornecedor, valor total e vencimento')
      return
    }
    try {
      await criarBoletoParcelado.mutateAsync({
        fornecedor,
        descricao: descricao || null,
        valorTotal: numeroTotal,
        parcelas: numeroParcelas,
        primeiroVencimento,
      })
      toast.success(
        numeroParcelas > 1 ? `${numeroParcelas} parcelas lançadas` : 'Boleto lançado',
      )
      setFornecedor('')
      setDescricao('')
      setValorTotal('')
      setParcelas('1')
      setPrimeiroVencimento('')
      setMostrarForm(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao lançar boleto')
    }
  }

  function iniciarEdicaoVencimento(id: string, vencimentoAtual: string) {
    setEditandoVencimentoId(id)
    setNovoVencimento(vencimentoAtual)
  }

  async function handleSalvarVencimento(id: string) {
    if (!novoVencimento) return
    try {
      await atualizarVencimento.mutateAsync({ id, vencimento: novoVencimento })
      toast.success('Vencimento atualizado')
      setEditandoVencimentoId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar vencimento')
    }
  }

  async function handleMarcarPago(id: string) {
    try {
      await marcarPago.mutateAsync(id)
      toast.success('Boleto marcado como pago')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar boleto')
    }
  }

  function alternarSelecao(id: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  async function handleExcluirSelecionados() {
    await deletarBoletos.mutateAsync(Array.from(selecionados))
    toast.success('Boleto(s) excluído(s)')
    setSelecionados(new Set())
    setConfirmandoExclusao(false)
  }

  return (
    <AppShell title="Boletos a pagar">
      <div className="flex flex-col gap-4 p-4">
        <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
          <p className="text-xs text-neutral-500">Total pendente a fornecedores</p>
          <p className="text-lg font-semibold text-red-700">R$ {totalPendente.toFixed(2)}</p>
        </div>

        {!mostrarForm ? (
          <button
            onClick={() => setMostrarForm(true)}
            className="rounded-lg bg-[var(--cor-primaria)] px-4 py-3 text-sm font-medium text-white"
          >
            + Lançar boleto de compra
          </button>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-neutral-200">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">Fornecedor</span>
              <input
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                placeholder="Natura, Boticário..."
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">Descrição (opcional)</span>
              <input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Nº da nota, referência..."
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:outline-none"
              />
            </label>

            <div className="flex gap-3">
              <label className="block flex-1">
                <span className="mb-1 block text-sm font-medium text-neutral-700">
                  Valor total da compra
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={valorTotal}
                  onChange={(e) => setValorTotal(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:outline-none"
                />
              </label>
              <label className="block w-28">
                <span className="mb-1 block text-sm font-medium text-neutral-700">Parcelas</span>
                <input
                  type="number"
                  min={1}
                  step="1"
                  value={parcelas}
                  onChange={(e) => setParcelas(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:outline-none"
                />
              </label>
            </div>

            {numeroParcelas > 1 && numeroTotal > 0 && (
              <p className="text-xs text-neutral-500">
                {numeroParcelas}x de R$ {valorPorParcela.toFixed(2)}, vencendo mensalmente a partir da
                1ª parcela
              </p>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">
                Vencimento da 1ª parcela
              </span>
              <input
                type="date"
                value={primeiroVencimento}
                onChange={(e) => setPrimeiroVencimento(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:outline-none"
              />
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setMostrarForm(false)}
                className="flex-1 rounded-lg border border-neutral-300 py-3 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriar}
                disabled={criarBoletoParcelado.isPending}
                className="flex-1 rounded-lg bg-[var(--cor-primaria)] py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 rounded-xl bg-white p-3 ring-1 ring-neutral-200">
          <div className="flex gap-2">
            {ABAS_FORNECEDOR.map((f) => (
              <button
                key={f}
                onClick={() => setFiltroFornecedor(f)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${
                  filtroFornecedor === f
                    ? 'bg-[var(--cor-primaria)] text-white'
                    : 'bg-white text-neutral-600 ring-1 ring-neutral-200'
                }`}
              >
                {f === 'todos' ? 'Todos' : f}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="month"
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="flex-1 rounded-lg border border-neutral-300 px-2 py-1.5 text-xs focus:outline-none"
            />
            <input
              type="text"
              value={filtroDescricao}
              onChange={(e) => setFiltroDescricao(e.target.value)}
              placeholder="Buscar por descrição..."
              className="flex-[2] rounded-lg border border-neutral-300 px-2 py-1.5 text-xs focus:outline-none"
            />
            {(filtroFornecedor !== 'todos' || filtroMes || filtroDescricao) && (
              <button
                onClick={() => {
                  setFiltroFornecedor('todos')
                  setFiltroMes('')
                  setFiltroDescricao('')
                }}
                className="rounded-lg border border-neutral-300 px-2 py-1.5 text-xs font-medium text-neutral-600"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {isLoading && <p className="text-neutral-400">Carregando...</p>}

        {selecionados.size > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-red-50 p-3 ring-1 ring-red-200">
            <span className="text-sm text-red-800">{selecionados.size} selecionado(s)</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelecionados(new Set())}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium"
              >
                Limpar
              </button>
              <button
                onClick={() => setConfirmandoExclusao(true)}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
              >
                Excluir selecionados
              </button>
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-2 text-sm font-medium text-neutral-700">Pendentes</h2>
          {pendentes.length === 0 ? (
            <p className="text-sm text-neutral-400">Nenhum boleto pendente.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pendentes.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-neutral-200"
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selecionados.has(b.id)}
                      onChange={() => alternarSelecao(b.id)}
                      className="mt-1 h-4 w-4"
                    />
                    <div>
                    <p className="font-medium text-neutral-900">{b.fornecedor}</p>
                    {b.descricao && <p className="text-xs text-neutral-500">{b.descricao}</p>}
                    {editandoVencimentoId === b.id ? (
                      <div className="mt-1 flex items-center gap-1">
                        <input
                          type="date"
                          value={novoVencimento}
                          onChange={(e) => setNovoVencimento(e.target.value)}
                          className="rounded-lg border border-neutral-300 px-2 py-1 text-xs focus:outline-none"
                        />
                        <button
                          onClick={() => handleSalvarVencimento(b.id)}
                          disabled={atualizarVencimento.isPending}
                          className="rounded-lg bg-[var(--cor-primaria)] px-2 py-1 text-xs font-medium text-white"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditandoVencimentoId(null)}
                          className="rounded-lg border border-neutral-300 px-2 py-1 text-xs font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => iniciarEdicaoVencimento(b.id, b.vencimento)}
                        className="text-xs text-neutral-400 underline"
                      >
                        Vence em {format(new Date(`${b.vencimento}T00:00:00`), 'dd/MM/yyyy')} · editar
                      </button>
                    )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="mb-1 font-medium text-neutral-900">R$ {Number(b.valor).toFixed(2)}</p>
                    <button
                      onClick={() => handleMarcarPago(b.id)}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Marcar como pago
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {pagos.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-medium text-neutral-700">Pagos</h2>
            <ul className="flex flex-col gap-2">
              {pagos.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-xl bg-white p-3 opacity-60 ring-1 ring-neutral-200"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selecionados.has(b.id)}
                      onChange={() => alternarSelecao(b.id)}
                      className="h-4 w-4"
                    />
                    <div>
                      <p className="font-medium text-neutral-900">{b.fornecedor}</p>
                      <p className="text-xs text-neutral-400">
                        Pago em{' '}
                        {b.data_pagamento ? format(new Date(b.data_pagamento), 'dd/MM/yyyy') : '—'}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium text-neutral-900">R$ {Number(b.valor).toFixed(2)}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {confirmandoExclusao && (
        <ConfirmDeleteModal
          titulo="Excluir boletos"
          descricao={`Isso vai excluir ${selecionados.size} boleto(s) definitivamente. Essa ação não pode ser desfeita.`}
          onConfirm={handleExcluirSelecionados}
          onClose={() => setConfirmandoExclusao(false)}
        />
      )}
    </AppShell>
  )
}
