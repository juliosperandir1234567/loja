import { format } from 'date-fns'
import type { Venda } from './api'
import type { CarrinhoItem, KitInfo } from './PdvPage'
import type { Cliente } from '../clientes/api'
import { precoEfetivo, nomeCompleto } from '../produtos/api'

const FORMA_LABEL: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao: 'Cartão',
  fiado: 'A prazo',
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

// desenha o comprovante de venda num canvas e devolve um PNG — usado pro envio
// por WhatsApp, já que o link wa.me não permite anexar arquivo automaticamente.
// Quando a venda é a prazo, mostra o saldo anterior e o total geral devido do cliente.
export async function gerarImagemComprovante(params: {
  nomeLoja: string
  venda: Venda
  itens: CarrinhoItem[]
  kitInfo: KitInfo | null
  cliente: Cliente | null
  saldoAnterior: number
}): Promise<Blob> {
  const { nomeLoja, venda, itens, kitInfo, cliente, saldoAnterior } = params
  const kitIds = new Set(kitInfo?.produtoIds ?? [])
  const entrada = Number(venda.valor_entrada)
  const restanteDestaCompra = Number(venda.valor_total) - entrada
  const totalGeralDevido = saldoAnterior + restanteDestaCompra
  const ehFiado = venda.forma_pagamento === 'fiado' && !!cliente

  const escala = 2
  const largura = 640
  const margem = 24
  const larguraConteudo = largura - margem * 2
  const alturaLinhaItem = 18
  const alturaLinhaTexto = 20

  const medindo = document.createElement('canvas').getContext('2d')!

  const itensParaDesenhar = itens.map((i) => {
    medindo.font = '13px Arial'
    const nome = kitIds.has(i.produto.id) ? `${nomeCompleto(i.produto)} (kit)` : nomeCompleto(i.produto)
    const valorTexto = `R$ ${(i.quantidade * precoEfetivo(i.produto)).toFixed(2)}`
    const larguraValor = medindo.measureText(valorTexto).width
    const linhas = quebrarLinhas(medindo, `${i.quantidade}x ${nome}`, larguraConteudo - larguraValor - 12)
    return { linhas, valorTexto }
  })

  const alturaItens = itensParaDesenhar.reduce((acc, i) => acc + i.linhas.length * alturaLinhaItem, 0)

  let linhasExtras = 0
  if (Number(venda.desconto) > 0) linhasExtras++
  if (kitInfo) linhasExtras++
  if (entrada > 0) linhasExtras += 2
  if (venda.combinacao) linhasExtras++
  if (venda.status === 'pendente') linhasExtras++
  if (ehFiado) linhasExtras += 3

  const alturaHeader = 130
  const alturaCliente = ehFiado ? 60 : 0
  const alturaTotais = 40 + linhasExtras * alturaLinhaTexto
  const alturaRodape = 90
  const altura = alturaHeader + alturaCliente + alturaItens + alturaTotais + alturaRodape

  const canvas = document.createElement('canvas')
  canvas.width = largura * escala
  canvas.height = altura * escala
  const ctx = canvas.getContext('2d')!
  ctx.scale(escala, escala)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, largura, altura)

  let y = 36
  ctx.textAlign = 'center'
  ctx.fillStyle = '#111827'
  ctx.font = 'bold 20px Arial'
  ctx.fillText(nomeLoja, largura / 2, y)

  y += 22
  ctx.fillStyle = '#6b7280'
  ctx.font = '13px Arial'
  ctx.fillText('Comprovante de venda', largura / 2, y)

  y += 20
  ctx.textAlign = 'left'
  ctx.strokeStyle = '#e5e7eb'
  ctx.beginPath()
  ctx.moveTo(margem, y)
  ctx.lineTo(largura - margem, y)
  ctx.stroke()
  y += 22

  if (ehFiado && cliente) {
    ctx.font = 'bold 14px Arial'
    ctx.fillStyle = '#111827'
    ctx.fillText(`Cliente: ${cliente.nome}`, margem, y)
    y += 18
    ctx.font = '13px Arial'
    ctx.fillStyle = '#6b7280'
    ctx.fillText(`Telefone: ${cliente.telefone}`, margem, y)
    y += 24
  }

  for (const item of itensParaDesenhar) {
    ctx.font = '13px Arial'
    ctx.fillStyle = '#374151'
    ctx.textAlign = 'left'
    ctx.fillText(item.linhas[0], margem, y)
    ctx.textAlign = 'right'
    ctx.fillText(item.valorTexto, largura - margem, y)
    for (let i = 1; i < item.linhas.length; i++) {
      y += alturaLinhaItem
      ctx.textAlign = 'left'
      ctx.fillText(item.linhas[i], margem, y)
    }
    y += alturaLinhaItem
  }

  y += 4
  ctx.strokeStyle = '#e5e7eb'
  ctx.beginPath()
  ctx.moveTo(margem, y)
  ctx.lineTo(largura - margem, y)
  ctx.stroke()
  y += alturaLinhaTexto

  function linha(rotulo: string, valor: string, opts?: { bold?: boolean; cor?: string }) {
    ctx.textAlign = 'left'
    ctx.font = opts?.bold ? 'bold 14px Arial' : '13px Arial'
    ctx.fillStyle = opts?.cor ?? '#111827'
    ctx.fillText(rotulo, margem, y)
    ctx.textAlign = 'right'
    ctx.fillText(valor, largura - margem, y)
    y += alturaLinhaTexto
  }

  if (Number(venda.desconto) > 0) {
    linha('Desconto', `− R$ ${Number(venda.desconto).toFixed(2)}`)
  }
  if (kitInfo) {
    linha(`Kit (${kitInfo.produtoIds.length} itens)`, `R$ ${kitInfo.valorFinal.toFixed(2)}`)
  }
  linha('Total', `R$ ${Number(venda.valor_total).toFixed(2)}`, { bold: true })
  if (entrada > 0) {
    linha('Entrada', `R$ ${entrada.toFixed(2)}`)
    linha('Fica a prazo (desta compra)', `R$ ${restanteDestaCompra.toFixed(2)}`, { bold: true })
  }

  ctx.textAlign = 'left'
  ctx.font = '12px Arial'
  ctx.fillStyle = '#9ca3af'
  ctx.fillText(
    `${FORMA_LABEL[venda.forma_pagamento] ?? venda.forma_pagamento} · ${format(new Date(venda.criado_em), 'dd/MM/yyyy HH:mm')}`,
    margem,
    y,
  )
  y += alturaLinhaTexto

  if (venda.combinacao) {
    ctx.fillText(`Combinado: ${venda.combinacao}`, margem, y)
    y += alturaLinhaTexto
  }

  if (venda.status === 'pendente') {
    ctx.font = 'bold 12px Arial'
    ctx.fillStyle = '#d97706'
    ctx.fillText('Status: pendente', margem, y)
    y += alturaLinhaTexto
  }

  if (ehFiado) {
    y += 6
    ctx.strokeStyle = '#e5e7eb'
    ctx.beginPath()
    ctx.moveTo(margem, y - 12)
    ctx.lineTo(largura - margem, y - 12)
    ctx.stroke()
    linha('Saldo em aberto anterior', `R$ ${saldoAnterior.toFixed(2)}`)
    linha('TOTAL GERAL DEVIDO', `R$ ${totalGeralDevido.toFixed(2)}`, { bold: true, cor: '#b91c1c' })
  }

  y += 20
  ctx.textAlign = 'center'
  ctx.font = 'italic bold 15px Arial'
  ctx.fillStyle = '#16a34a'
  ctx.fillText('Obrigado pela confiança! 💚', largura / 2, y)

  y += 26
  ctx.font = '10px Arial'
  ctx.fillStyle = '#9ca3af'
  ctx.fillText(`Documento gerado eletronicamente pelo sistema ${nomeLoja}`, largura / 2, y)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Não foi possível gerar a imagem'))
    }, 'image/png')
  })
}
