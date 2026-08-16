function escaparCampo(valor: unknown): string {
  const texto = valor === null || valor === undefined ? '' : String(valor)
  if (/[";\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`
  }
  return texto
}

export function baixarCsv(nomeArquivo: string, cabecalho: string[], linhas: unknown[][]) {
  const conteudo = [cabecalho, ...linhas]
    .map((linha) => linha.map(escaparCampo).join(';'))
    .join('\r\n')

  // BOM pra acentuação abrir certo no Excel
  const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
