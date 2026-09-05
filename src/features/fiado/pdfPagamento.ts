import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

interface ConfigLoja {
  nome_loja: string
  telefone_loja: string | null
  logo_url?: string | null
}

export interface PagamentoHistorico {
  valorPago: number
  dataHora: string
  formaRecebimento: string
  produto: string | null
}

const FORMA_LABEL: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao: 'Cartão',
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

export async function gerarPdfPagamento(params: {
  config: ConfigLoja
  nome: string
  telefone: string
  pagamentos: PagamentoHistorico[]
  saldoRestante: number
}) {
  const { config, nome, telefone, pagamentos, saldoRestante } = params
  const doc = new jsPDF()

  if (config.logo_url) {
    const logoDataUrl = await fetchImagemComoDataUrl(config.logo_url)
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 150, 8, 45, 20, undefined, 'FAST')
      } catch {
        // segue sem logo se falhar
      }
    }
  }

  doc.setFontSize(16)
  doc.text(config.nome_loja, 14, 18)
  doc.setFontSize(10)
  doc.text('Extrato de Pagamentos — Venda a Prazo', 14, 25)
  if (config.telefone_loja) doc.text(`Tel: ${config.telefone_loja}`, 14, 30)

  doc.setFontSize(11)
  doc.text(`Cliente: ${nome}`, 14, 45)
  doc.text(`Telefone: ${telefone}`, 14, 51)

  autoTable(doc, {
    startY: 58,
    head: [['Data', 'Comprou', 'Forma', 'Valor pago']],
    body: pagamentos.map((p) => [
      format(new Date(p.dataHora), 'dd/MM/yyyy HH:mm'),
      p.produto ?? '—',
      FORMA_LABEL[p.formaRecebimento] ?? p.formaRecebimento,
      `R$ ${p.valorPago.toFixed(2)}`,
    ]),
  })

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  doc.setFontSize(11)
  const totalPago = pagamentos.reduce((acc, p) => acc + p.valorPago, 0)
  doc.text(`Total pago: R$ ${totalPago.toFixed(2)}`, 14, finalY)

  doc.setFontSize(13)
  doc.text(
    saldoRestante > 0
      ? `Saldo restante em aberto: R$ ${saldoRestante.toFixed(2)}`
      : 'Conta a prazo totalmente quitada.',
    14,
    finalY + 8,
  )

  doc.setFontSize(8)
  doc.text(
    `Documento gerado eletronicamente pelo sistema ${config.nome_loja}`,
    14,
    doc.internal.pageSize.getHeight() - 10,
  )

  doc.save(`extrato-pagamentos-${nome.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}
