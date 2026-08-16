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
