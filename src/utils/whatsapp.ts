export function montarLinkWhatsApp(telefone: string, mensagem: string) {
  const digitos = telefone.replace(/\D/g, '')
  const comDdi = digitos.startsWith('55') ? digitos : `55${digitos}`
  return `https://wa.me/${comDdi}?text=${encodeURIComponent(mensagem)}`
}

export function abrirWhatsApp(telefone: string, mensagem: string) {
  window.open(montarLinkWhatsApp(telefone, mensagem), '_blank')
}

export function montarMensagemTemplate(template: string, nome: string) {
  return template.replace(/\{\{\s*nome\s*\}\}/g, nome)
}

// wa.me não deixa anexar arquivo automaticamente — no celular, abre direto o menu
// de compartilhar com a imagem já anexada; sem suporte (ex: desktop), baixa a
// imagem e abre o WhatsApp com uma mensagem pra anexar manualmente
export async function compartilharImagemOuBaixarEAbrirWhatsApp(params: {
  blob: Blob
  nomeArquivo: string
  telefone: string
  legenda: string
}) {
  const { blob, nomeArquivo, telefone, legenda } = params
  const arquivo = new File([blob], nomeArquivo, { type: 'image/png' })

  if (navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], text: legenda })
      return
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  link.click()
  URL.revokeObjectURL(url)

  abrirWhatsApp(telefone, legenda)
}
