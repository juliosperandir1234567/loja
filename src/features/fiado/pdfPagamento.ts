import { jsPDF } from 'jspdf'
import { format } from 'date-fns'

interface ConfigLoja {
  nome_loja: string
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

export async function gerarPdfPagamento(params: {
  config: ConfigLoja
  nome: string
  telefone: string
  valorPago: number
  saldoRestante: number
  dataHora: string
}) {
  const { config, nome, telefone, valorPago, saldoRestante, dataHora } = params
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
  doc.text('Comprovante de Pagamento — Venda a Prazo', 14, 25)
  if (config.telefone_loja) doc.text(`Tel: ${config.telefone_loja}`, 14, 30)

  doc.setFontSize(11)
  doc.text(`Cliente: ${nome}`, 14, 45)
  doc.text(`Telefone: ${telefone}`, 14, 51)
  doc.text(`Data do pagamento: ${format(new Date(dataHora), 'dd/MM/yyyy HH:mm')}`, 14, 57)

  doc.setFontSize(13)
  doc.text(`Valor pago: R$ ${valorPago.toFixed(2)}`, 14, 70)

  doc.setFontSize(11)
  doc.text(
    saldoRestante > 0
      ? `Saldo restante em aberto: R$ ${saldoRestante.toFixed(2)}`
      : 'Conta a prazo totalmente quitada.',
    14,
    78,
  )

  doc.setFontSize(8)
  doc.text(
    `Documento gerado eletronicamente pelo sistema ${config.nome_loja}`,
    14,
    doc.internal.pageSize.getHeight() - 10,
  )

  doc.save(`pagamento-${nome.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}
