import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import type { Venda } from './api'
import type { CarrinhoItem, KitInfo } from './PdvPage'
import type { Cliente } from '../clientes/api'
import { abrirWhatsApp } from '../../utils/whatsapp'
import { buscarSaldoCliente } from '../fiado/api'
import { gerarPdfFiado } from '../fiado/pdfFiado'
import { buscarConfiguracoes, type Configuracoes } from '../configuracoes/api'
import { precoEfetivo, nomeCompleto } from '../produtos/api'

const FORMA_LABEL: Record<string, string> = {
  a_vista: 'À vista',
  cartao: 'Cartão',
  fiado: 'A prazo',
}

export function ComprovanteStep({
  venda,
  itens,
  kitInfo,
  cliente,
  assinaturaDataUrl,
  onNovaVenda,
}: {
  venda: Venda
  itens: CarrinhoItem[]
  kitInfo: KitInfo | null
  cliente: Cliente | null
  assinaturaDataUrl: string | null
  onNovaVenda: () => void
}) {
  const [telefone, setTelefone] = useState(cliente?.telefone ?? '')
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [enviandoWhatsApp, setEnviandoWhatsApp] = useState(false)
  const [config, setConfig] = useState<Configuracoes | null>(null)
  const [saldoAnterior, setSaldoAnterior] = useState(0)

  const entrada = Number(venda.valor_entrada)
  const restanteDestaCompra = Number(venda.valor_total) - entrada
  const totalGeralDevido = saldoAnterior + restanteDestaCompra
  const nomeLoja = config?.nome_loja ?? 'Espaço Sperandir'
  const kitIds = new Set(kitInfo?.produtoIds ?? [])
  const itensDoKit = itens.filter((i) => kitIds.has(i.produto.id))
  const itensFora = itens.filter((i) => !kitIds.has(i.produto.id))

  // calcula uma vez, ao entrar na tela — o mesmo valor é usado na tela/impressão,
  // no WhatsApp e no PDF, pra nunca ficar diferente entre eles
  useEffect(() => {
    buscarConfiguracoes()
      .then(setConfig)
      .catch(() => {})

    if (venda.forma_pagamento === 'fiado' && cliente) {
      buscarSaldoCliente(cliente.id)
        .then((totalAtualComEssaVenda) => {
          setSaldoAnterior(Math.max(0, totalAtualComEssaVenda - restanteDestaCompra))
        })
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleGerarPdf() {
    if (!cliente || !assinaturaDataUrl) return
    setGerandoPdf(true)
    try {
      const cfg = config ?? (await buscarConfiguracoes())
      await gerarPdfFiado({ config: cfg, cliente, venda, itens, kitInfo, saldoAnterior, assinaturaDataUrl })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar PDF')
    } finally {
      setGerandoPdf(false)
    }
  }

  // mesmo conteúdo mostrado na tela/PDF (itens, desconto, entrada, dados do
  // cliente e saldo em aberto quando a prazo)
  function montarMensagem() {
    let linhas: string
    if (kitInfo) {
      const linhasKit = itensDoKit
        .map((i) => `${i.quantidade}x ${nomeCompleto(i.produto)}`)
        .join('\n')
      const linhasFora = itensFora
        .map((i) => `${i.quantidade}x ${nomeCompleto(i.produto)} — R$ ${(i.quantidade * precoEfetivo(i.produto)).toFixed(2)}`)
        .join('\n')
      linhas = `*Kit (${itensDoKit.length} itens) — R$ ${kitInfo.valorFinal.toFixed(2)}*\n${linhasKit}`
      if (linhasFora) linhas += `\n\n${linhasFora}`
    } else {
      linhas = itens
        .map((i) => `${i.quantidade}x ${nomeCompleto(i.produto)} — R$ ${(i.quantidade * precoEfetivo(i.produto)).toFixed(2)}`)
        .join('\n')
    }

    let msg = `*${nomeLoja}*\nComprovante de venda\n\n${linhas}`

    if (Number(venda.desconto) > 0) {
      msg += `\n\nDesconto: R$ ${Number(venda.desconto).toFixed(2)}`
    }
    msg += `\nTotal: R$ ${Number(venda.valor_total).toFixed(2)}`
    msg += `\nForma de pagamento: ${FORMA_LABEL[venda.forma_pagamento]}`
    msg += `\nData: ${format(new Date(venda.criado_em), 'dd/MM/yyyy HH:mm')}`

    if (venda.forma_pagamento === 'fiado') {
      if (cliente) {
        msg += `\n\nCliente: ${cliente.nome}`
        msg += `\nTelefone: ${cliente.telefone}`
        if (cliente.cpf) msg += `\nCPF: ${cliente.cpf}`
      }
      if (entrada > 0) {
        msg += `\n\nEntrada paga: R$ ${entrada.toFixed(2)}`
        msg += `\nFica a prazo desta compra: R$ ${restanteDestaCompra.toFixed(2)}`
      }
      if (cliente) {
        msg += `\n\nSaldo em aberto anterior: R$ ${saldoAnterior.toFixed(2)}`
        msg += `\n*TOTAL GERAL DEVIDO: R$ ${totalGeralDevido.toFixed(2)}*`
      }
      if (venda.combinacao) {
        msg += `\n\nCombinado: ${venda.combinacao}`
      }
    }

    if (venda.status === 'pendente') {
      msg += `\n\nStatus: pendente`
    }
    return msg
  }

  function handleEnviarWhatsApp() {
    if (!telefone) return
    setEnviandoWhatsApp(true)
    try {
      abrirWhatsApp(telefone, montarMensagem())
      window.print()
    } finally {
      setEnviandoWhatsApp(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="print-area rounded-xl bg-white p-4 ring-1 ring-neutral-200">
        <p className="mb-1 text-center text-sm text-neutral-400">{nomeLoja}</p>
        <p className="mb-3 text-center text-lg font-semibold">Comprovante de venda</p>

        {venda.forma_pagamento === 'fiado' && cliente && (
          <div className="mb-3 border-b border-dashed border-neutral-200 pb-3 text-sm text-neutral-700">
            <p>Cliente: {cliente.nome}</p>
            <p>Telefone: {cliente.telefone}</p>
            {cliente.cpf && <p>CPF: {cliente.cpf}</p>}
          </div>
        )}

        {kitInfo ? (
          <div className="mb-3 flex flex-col gap-2 border-b border-dashed border-neutral-200 pb-3">
            <div className="rounded-lg bg-amber-50 p-2 ring-1 ring-amber-200">
              <p className="mb-1 text-xs font-semibold text-amber-800">
                Kit ({itensDoKit.length} itens)
              </p>
              <ul className="flex flex-col gap-0.5">
                {itensDoKit.map((i) => (
                  <li key={i.produto.id} className="text-sm text-neutral-700">
                    {i.quantidade}x {nomeCompleto(i.produto)}
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
                    <span>
                      {i.quantidade}x {nomeCompleto(i.produto)}
                    </span>
                    <span>R$ {(i.quantidade * precoEfetivo(i.produto)).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <ul className="mb-3 flex flex-col gap-1 border-b border-dashed border-neutral-200 pb-3">
            {itens.map((i) => (
              <li key={i.produto.id} className="flex justify-between text-sm">
                <span>
                  {i.quantidade}x {nomeCompleto(i.produto)}
                </span>
                <span>R$ {(i.quantidade * precoEfetivo(i.produto)).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}

        {Number(venda.desconto) > 0 && (
          <p className="flex justify-between text-sm text-neutral-500">
            <span>Desconto</span>
            <span>− R$ {Number(venda.desconto).toFixed(2)}</span>
          </p>
        )}
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>R$ {Number(venda.valor_total).toFixed(2)}</span>
        </div>
        {entrada > 0 && (
          <>
            <p className="mt-1 flex justify-between text-sm text-neutral-500">
              <span>Entrada</span>
              <span>R$ {entrada.toFixed(2)}</span>
            </p>
            <p className="flex justify-between text-sm font-medium text-neutral-700">
              <span>Fica a prazo (desta compra)</span>
              <span>R$ {restanteDestaCompra.toFixed(2)}</span>
            </p>
          </>
        )}
        <p className="mt-1 text-sm text-neutral-500">
          {FORMA_LABEL[venda.forma_pagamento]} · {format(new Date(venda.criado_em), 'dd/MM/yyyy HH:mm')}
        </p>
        {venda.combinacao && (
          <p className="mt-1 text-sm text-neutral-500">Combinado: {venda.combinacao}</p>
        )}
        {venda.status === 'pendente' && (
          <p className="mt-1 text-sm font-medium text-amber-600">Pagamento pendente</p>
        )}

        {venda.forma_pagamento === 'fiado' && cliente && (
          <div className="mt-3 border-t border-neutral-200 pt-2 text-sm">
            <p className="flex justify-between text-neutral-600">
              <span>Saldo em aberto anterior</span>
              <span>R$ {saldoAnterior.toFixed(2)}</span>
            </p>
            <p className="flex justify-between font-semibold text-neutral-900">
              <span>TOTAL GERAL DEVIDO</span>
              <span>R$ {totalGeralDevido.toFixed(2)}</span>
            </p>
          </div>
        )}
      </div>

      {venda.forma_pagamento === 'fiado' && cliente && assinaturaDataUrl && (
        <button
          onClick={handleGerarPdf}
          disabled={gerandoPdf}
          className="rounded-lg bg-amber-600 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {gerandoPdf ? 'Gerando PDF...' : 'Gerar PDF da venda a prazo'}
        </button>
      )}

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">
          WhatsApp para enviar o comprovante
        </span>
        <input
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="(11) 91234-5678"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
        />
      </label>

      <button
        onClick={handleEnviarWhatsApp}
        disabled={!telefone || enviandoWhatsApp}
        className="rounded-lg bg-green-600 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {enviandoWhatsApp ? 'Preparando...' : 'Enviar por WhatsApp e imprimir'}
      </button>

      <button
        onClick={() => window.print()}
        className="rounded-lg border border-neutral-300 py-3 text-sm font-medium"
      >
        Só imprimir
      </button>

      <button
        onClick={onNovaVenda}
        className="rounded-lg border border-neutral-300 py-3 text-sm font-medium"
      >
        Nova venda
      </button>
    </div>
  )
}
