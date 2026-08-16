import { useState } from 'react'
import toast from 'react-hot-toast'
import { useProdutos } from '../features/produtos/hooks'
import { buscarProdutoPorCodigoBarras, precoEfetivo, MARCAS, type Produto } from '../features/produtos/api'
import { BarcodeScannerModal } from './BarcodeScannerModal'

export function ProdutoGridPicker({ onSelect }: { onSelect: (produto: Produto) => void }) {
  const [busca, setBusca] = useState('')
  const [marcaAtiva, setMarcaAtiva] = useState<'Todos' | (typeof MARCAS)[number]>('Todos')
  const [scannerOpen, setScannerOpen] = useState(false)
  const { data: produtos } = useProdutos(busca)

  const produtosFiltrados = (produtos ?? []).filter(
    (p) => marcaAtiva === 'Todos' || p.marca === marcaAtiva,
  )

  async function handleDetected(codigo: string) {
    setScannerOpen(false)
    const produto = await buscarProdutoPorCodigoBarras(codigo)
    if (produto) {
      onSelect(produto)
    } else {
      toast.error('Nenhum produto encontrado com esse código')
    }
  }

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto..."
          className="flex-1 rounded-xl border border-neutral-300 px-4 text-base focus:border-neutral-900 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="rounded-xl border border-neutral-300 px-4 text-2xl"
          aria-label="Escanear código de barras"
        >
          📷
        </button>
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {(['Todos', ...MARCAS] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMarcaAtiva(m)}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
              marcaAtiva === m
                ? 'bg-[var(--cor-primaria)] text-white'
                : 'bg-white text-neutral-600 ring-1 ring-neutral-200'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {produtosFiltrados.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-white p-3 text-center ring-1 ring-neutral-200 active:bg-neutral-50"
          >
            {p.foto_url ? (
              <img
                src={p.foto_url}
                alt={p.nome}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-2xl">
                🧴
              </div>
            )}
            <p className="line-clamp-2 text-sm font-semibold text-neutral-900">{p.nome}</p>
            <p className="text-base font-bold text-[var(--cor-primaria)]">
              R$ {precoEfetivo(p).toFixed(2)}
            </p>
            {p.estoque_atual <= p.estoque_minimo && (
              <p className="text-xs font-medium text-red-600">Últimas unidades</p>
            )}
          </button>
        ))}
        {produtosFiltrados.length === 0 && (
          <p className="col-span-2 py-6 text-center text-sm text-neutral-400">
            Nenhum produto encontrado.
          </p>
        )}
      </div>

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleDetected}
      />
    </div>
  )
}
