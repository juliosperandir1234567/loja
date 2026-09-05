import { format } from 'date-fns'
import type { PagamentoHistorico } from './pdfPagamento'

interface ConfigLoja {
  nome_loja: string
  telefone_loja: string | null
}

const FORMA_LABEL: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao: 'Cartão',
}

function quebrarLinhas(ctx: CanvasRenderingContext2D, texto: string, larguraMax: number): string[] {
  const palavras = texto.split(' ')
  const linhas: string[] = []
  let atual = ''
  for (const palavra of palavras) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra
    if (atual && ctx.measureText(tentativa).width > larguraMax) {
      linhas.push(atual)
      atual = palavra
    } else {
      atual = tentativa
    }
  }
  if (atual) linhas.push(atual)
  return linhas
}

// desenha o extrato num canvas e devolve um PNG — usado pro envio por WhatsApp,
// já que o link wa.me não permite anexar arquivo automaticamente
export async function gerarImagemExtrato(params: {
  config: ConfigLoja
  nome: string
  pagamentos: PagamentoHistorico[]
  saldoRestante: number
}): Promise<Blob> {
  const { config, nome, pagamentos, saldoRestante } = params

  const escala = 2
  const largura = 640
  const margem = 24
  const larguraConteudo = largura - margem * 2
  const larguraColunaValor = 150
  const alturaPorLinhaProduto = 16
  const alturaBasePagamento = 46

  const medindo = document.createElement('canvas').getContext('2d')!
  medindo.font = '12px Arial'

  const linhasPorPagamento = pagamentos.map((p) => {
    const produto = p.produto
      ? `${p.produto}${p.itemValorTotal !== null ? ` (valor: R$ ${p.itemValorTotal.toFixed(2)})` : ''}`
      : null
    const linhasProduto = produto
      ? quebrarLinhas(medindo, produto, larguraConteudo - larguraColunaValor)
      : []
    return { p, linhasProduto }
  })

  const alturaHeader = 150
  const alturaPagamentos = linhasPorPagamento.reduce(
    (acc, l) => acc + alturaBasePagamento + l.linhasProduto.length * alturaPorLinhaProduto,
    0,
  )
  const alturaRodape = 130
  const altura = alturaHeader + alturaPagamentos + alturaRodape

  const canvas = document.createElement('canvas')
  canvas.width = largura * escala
  canvas.height = altura * escala
  const ctx = canvas.getContext('2d')!
  ctx.scale(escala, escala)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, largura, altura)

  let y = 36
  ctx.textAlign = 'left'
  ctx.fillStyle = '#111827'
  ctx.font = 'bold 20px Arial'
  ctx.fillText(config.nome_loja, margem, y)

  y += 22
  ctx.fillStyle = '#6b7280'
  ctx.font = '13px Arial'
  ctx.fillText('Extrato de Pagamentos — Venda a Prazo', margem, y)

  if (config.telefone_loja) {
    y += 18
    ctx.fillText(`Tel: ${config.telefone_loja}`, margem, y)
  }

  y += 30
  ctx.fillStyle = '#111827'
  ctx.font = 'bold 15px Arial'
  ctx.fillText(`Cliente: ${nome}`, margem, y)

  y += 16
  ctx.strokeStyle = '#e5e7eb'
  ctx.beginPath()
  ctx.moveTo(margem, y)
  ctx.lineTo(largura - margem, y)
  ctx.stroke()

  y += 24

  for (const { p, linhasProduto } of linhasPorPagamento) {
    const dataLabel = `${format(new Date(p.dataHora), 'dd/MM/yyyy')} · ${FORMA_LABEL[p.formaRecebimento] ?? p.formaRecebimento}`
    ctx.font = '13px Arial'
    ctx.fillStyle = '#6b7280'
    ctx.textAlign = 'left'
    ctx.fillText(dataLabel, margem, y)

    ctx.font = 'bold 14px Arial'
    ctx.fillStyle = '#111827'
    ctx.textAlign = 'right'
    ctx.fillText(`R$ ${p.valorPago.toFixed(2)}`, largura - margem, y)

    let yLinha = y
    for (const linha of linhasProduto) {
      yLinha += alturaPorLinhaProduto
      ctx.font = '12px Arial'
      ctx.fillStyle = '#9ca3af'
      ctx.textAlign = 'left'
      ctx.fillText(linha, margem, yLinha)
    }

    if (p.itemRestante !== null) {
      ctx.font = '12px Arial'
      ctx.fillStyle = '#9ca3af'
      ctx.textAlign = 'right'
      ctx.fillText(`Restante: R$ ${p.itemRestante.toFixed(2)}`, largura - margem, y + alturaPorLinhaProduto)
    }

    y += alturaBasePagamento + linhasProduto.length * alturaPorLinhaProduto
    ctx.strokeStyle = '#f3f4f6'
    ctx.beginPath()
    ctx.moveTo(margem, y - 14)
    ctx.lineTo(largura - margem, y - 14)
    ctx.stroke()
  }

  ctx.textAlign = 'left'
  y += 4
  const totalPago = pagamentos.reduce((acc, p) => acc + p.valorPago, 0)
  ctx.font = 'bold 14px Arial'
  ctx.fillStyle = '#111827'
  ctx.fillText(`Total pago: R$ ${totalPago.toFixed(2)}`, margem, y)

  y += 26
  ctx.font = 'bold 16px Arial'
  ctx.fillStyle = saldoRestante > 0 ? '#b91c1c' : '#15803d'
  ctx.fillText(
    saldoRestante > 0
      ? `Saldo restante em aberto: R$ ${saldoRestante.toFixed(2)}`
      : 'Conta a prazo totalmente quitada 🎉',
    margem,
    y,
  )

  y += 40
  ctx.textAlign = 'center'
  ctx.font = 'italic bold 15px Arial'
  ctx.fillStyle = '#16a34a'
  ctx.fillText('Obrigado pela confiança! 💚', largura / 2, y)

  y += 26
  ctx.font = '10px Arial'
  ctx.fillStyle = '#9ca3af'
  ctx.fillText(`Documento gerado eletronicamente pelo sistema ${config.nome_loja}`, largura / 2, y)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Não foi possível gerar a imagem'))
    }, 'image/png')
  })
}
