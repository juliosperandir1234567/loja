import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import type { Cliente } from '../clientes/api'
import type { CarrinhoItem } from '../pdv/PdvPage'
import type { Venda } from '../pdv/api'
import { precoEfetivo } from '../produtos/api'

interface ConfigLoja {
  nome_loja: string
  endereco: string | null
  telefone_loja: string | null
  logo_url?: string | null
}

async function fetchImagemComoDataUrl(url: string): Promise<string | null> {
  try {
    const resposta = await fetch(url)
    const blob = await resposta.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function gerarPdfFiado(params: {
  config: ConfigLoja
  cliente: Cliente
  venda: Venda
  itens: CarrinhoItem[]
  saldoAnterior: number
  assinaturaDataUrl: string
}) {
  const { config, cliente, venda, itens, saldoAnterior, assinaturaDataUrl } = params
  const valorAtual = Number(venda.valor_total)
  const entrada = Number(venda.valor_entrada)
  const restanteDestaCompra = valorAtual - entrada
  const totalGeral = saldoAnterior + restanteDestaCompra

  const doc = new jsPDF()

  if (config.logo_url) {
    const logoDataUrl = await fetchImagemComoDataUrl(config.logo_url)
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 150, 8, 45, 20, undefined, 'FAST')
      } catch {
        // ignora falha ao embutir logo, PDF segue sem ela
      }
    }
  }

  doc.setFontSize(16)
  doc.text(config.nome_loja, 14, 18)
  doc.setFontSize(10)
  doc.text('Comprovante de Venda a Prazo', 14, 25)
  if (config.telefone_loja) doc.text(`Tel: ${config.telefone_loja}`, 14, 30)

  doc.setFontSize(11)
  doc.text(`Cliente: ${cliente.nome}`, 14, 42)
  doc.text(`Telefone: ${cliente.telefone}`, 14, 48)
  if (cliente.cpf) doc.text(`CPF: ${cliente.cpf}`, 14, 54)
  doc.text(`Data da compra: ${format(new Date(venda.criado_em), 'dd/MM/yyyy HH:mm')}`, 14, 60)

  autoTable(doc, {
    startY: 68,
    head: [['Produto', 'Qtd', 'Preço unit.', 'Subtotal']],
    body: itens.map((i) => [
      i.produto.nome,
      String(i.quantidade),
      `R$ ${precoEfetivo(i.produto).toFixed(2)}`,
      `R$ ${(i.quantidade * precoEfetivo(i.produto)).toFixed(2)}`,
    ]),
  })

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  let y = finalY
  doc.setFontSize(11)
  doc.text(`Valor desta compra: R$ ${valorAtual.toFixed(2)}`, 14, y)
  if (venda.desconto && Number(venda.desconto) > 0) {
    y += 6
    doc.text(`Desconto: R$ ${Number(venda.desconto).toFixed(2)}`, 14, y)
  }
  if (entrada > 0) {
    y += 6
    doc.text(`Entrada paga: R$ ${entrada.toFixed(2)}`, 14, y)
  }
  y += 6
  doc.text(`Saldo em aberto anterior: R$ ${saldoAnterior.toFixed(2)}`, 14, y)
  y += 10
  doc.setFontSize(13)
  doc.text(`TOTAL GERAL DEVIDO: R$ ${totalGeral.toFixed(2)}`, 14, y)
  if (venda.combinacao) {
    y += 8
    doc.setFontSize(10)
    doc.text(`Combinado: ${venda.combinacao}`, 14, y)
  }

  y += 12
  doc.setFontSize(10)
  doc.text('Assinatura do cliente:', 14, y)
  doc.addImage(assinaturaDataUrl, 'PNG', 14, y + 3, 70, 25)

  doc.setFontSize(8)
  doc.text(
    'Documento gerado eletronicamente pelo sistema Espaço Sperandir',
    14,
    doc.internal.pageSize.getHeight() - 10,
  )

  doc.save(`fiado-${cliente.nome.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}
