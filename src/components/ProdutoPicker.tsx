import { useState } from 'react'
import { useProdutos } from '../features/produtos/hooks'
import { buscarProdutoPorCodigoBarras, nomeCompleto, type Produto } from '../features/produtos/api'
import { BarcodeScannerModal } from './BarcodeScannerModal'
import toast from 'react-hot-toast'

export function ProdutoPicker({ onSelect }: { onSelect: (produto: Produto) => void }) {
  const [busca, setBusca] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const { data: produtos } = useProdutos({ nome: busca })

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
          placeholder="Buscar produto por nome..."
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium"
        >
          Escanear
        </button>
      </div>

      {busca && (
        <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
          {produtos?.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p)}
                className="w-full rounded-lg bg-white px-3 py-2 text-left ring-1 ring-neutral-200"
              >
                <span className="font-medium">{nomeCompleto(p)}</span>{' '}
                <span className="text-sm text-neutral-500">
                  ({p.marca}) · {p.estoque_atual} em estoque
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleDetected}
      />
    </div>
  )
}
