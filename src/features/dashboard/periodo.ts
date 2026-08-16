import { startOfDay, endOfDay, startOfWeek, startOfMonth } from 'date-fns'

export type TipoPeriodo = 'hoje' | 'semana' | 'mes' | 'personalizado'

export interface Periodo {
  desde: Date
  ate: Date
}

export function calcularPeriodo(tipo: TipoPeriodo, personalizado?: Periodo): Periodo {
  const agora = new Date()
  switch (tipo) {
    case 'hoje':
      return { desde: startOfDay(agora), ate: endOfDay(agora) }
    case 'semana':
      return { desde: startOfWeek(agora, { weekStartsOn: 0 }), ate: endOfDay(agora) }
    case 'mes':
      return { desde: startOfMonth(agora), ate: endOfDay(agora) }
    case 'personalizado':
      return personalizado ?? { desde: startOfDay(agora), ate: endOfDay(agora) }
  }
}

// período imediatamente anterior, com a mesma duração — usado para "comparação com período anterior"
export function calcularPeriodoAnterior(periodo: Periodo): Periodo {
  const duracaoMs = periodo.ate.getTime() - periodo.desde.getTime()
  return {
    desde: new Date(periodo.desde.getTime() - duracaoMs),
    ate: new Date(periodo.desde.getTime() - 1),
  }
}
