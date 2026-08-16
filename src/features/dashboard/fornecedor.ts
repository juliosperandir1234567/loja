export const MARCAS_FIXAS = ['Natura', 'Boticário']

// faixa Unicode dos acentos combinantes (0300-036F), removida após normalize('NFD')
const INICIO_DIACRITICO = 0x0300
const FIM_DIACRITICO = 0x036f

// normaliza acentos/maiúsculas pra evitar "Natura" e "natura" virarem fornecedores diferentes
function normalizarChave(s: string) {
  return Array.from(s.normalize('NFD'))
    .filter((ch) => {
      const codigo = ch.codePointAt(0) ?? 0
      return codigo < INICIO_DIACRITICO || codigo > FIM_DIACRITICO
    })
    .join('')
    .toLowerCase()
    .trim()
}

const CANONICO_POR_CHAVE = new Map(MARCAS_FIXAS.map((m) => [normalizarChave(m), m]))

export function fornecedorCanonico(nome: string) {
  return CANONICO_POR_CHAVE.get(normalizarChave(nome)) ?? nome.trim()
}
