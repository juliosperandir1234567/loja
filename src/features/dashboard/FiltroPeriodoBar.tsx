import type { TipoPeriodo } from './periodo'

const OPCOES: { valor: TipoPeriodo; label: string }[] = [
  { valor: 'hoje', label: 'Hoje' },
  { valor: 'semana', label: 'Semana' },
  { valor: 'mes', label: 'Mês' },
  { valor: 'personalizado', label: 'Personalizado' },
]

export function FiltroPeriodoBar({
  tipo,
  onChange,
  personalizadoDesde,
  personalizadoAte,
  onChangePersonalizado,
}: {
  tipo: TipoPeriodo
  onChange: (tipo: TipoPeriodo) => void
  personalizadoDesde: string
  personalizadoAte: string
  onChangePersonalizado: (desde: string, ate: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 overflow-x-auto">
        {OPCOES.map((op) => (
          <button
            key={op.valor}
            onClick={() => onChange(op.valor)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
              tipo === op.valor
                ? 'bg-[var(--cor-primaria)] text-white'
                : 'bg-white text-neutral-600 ring-1 ring-neutral-200'
            }`}
          >
            {op.label}
          </button>
        ))}
      </div>

      {tipo === 'personalizado' && (
        <div className="flex gap-2">
          <input
            type="date"
            value={personalizadoDesde}
            onChange={(e) => onChangePersonalizado(e.target.value, personalizadoAte)}
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none"
          />
          <input
            type="date"
            value={personalizadoAte}
            onChange={(e) => onChangePersonalizado(personalizadoDesde, e.target.value)}
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}
