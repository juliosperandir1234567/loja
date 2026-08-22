import { useState } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { useProdutos } from '../produtos/hooks'
import { precoEfetivo, nomeCompleto } from '../produtos/api'

export function EtiquetasPage() {
  const [busca, setBusca] = useState('')
  const { data: produtos } = useProdutos(busca)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())

  function alternar(id: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  const produtosSelecionados = (produtos ?? []).filter((p) => selecionados.has(p.id))

  return (
    <AppShell title="Etiquetas">
      <div className="flex flex-col gap-4 p-4">
        <div className="no-print flex flex-col gap-3">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto por nome..."
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:outline-none"
          />

          <ul className="flex flex-col gap-1">
            {produtos?.map((p) => (
              <li key={p.id}>
                <label className="flex items-center justify-between rounded-lg bg-white p-2.5 ring-1 ring-neutral-200">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selecionados.has(p.id)}
                      onChange={() => alternar(p.id)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{nomeCompleto(p)}</span>
                  </span>
                  <span className="text-sm text-neutral-500">
                    R$ {precoEfetivo(p).toFixed(2)}
                  </span>
                </label>
              </li>
            ))}
          </ul>

          {produtosSelecionados.length > 0 && (
            <button
              onClick={() => window.print()}
              className="rounded-lg bg-[var(--cor-primaria)] px-4 py-3 text-sm font-medium text-white"
            >
              Imprimir {produtosSelecionados.length} etiqueta(s)
            </button>
          )}
        </div>

        {produtosSelecionados.length > 0 && (
          <div className="print-area grid grid-cols-2 gap-3 sm:grid-cols-3">
            {produtosSelecionados.map((p) => (
              <div
                key={p.id}
                className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-400 p-4 text-center"
              >
                <p className="mb-2 text-sm font-medium text-neutral-900">{nomeCompleto(p)}</p>
                {p.preco_promocional ? (
                  <>
                    <p className="text-xs text-neutral-500 line-through">
                      De: R$ {Number(p.preco_venda).toFixed(2)}
                    </p>
                    <p className="text-lg font-bold text-red-600">
                      Por: R$ {Number(p.preco_promocional).toFixed(2)}
                    </p>
                  </>
                ) : (
                  <p className="text-lg font-bold text-neutral-900">
                    R$ {Number(p.preco_venda).toFixed(2)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
