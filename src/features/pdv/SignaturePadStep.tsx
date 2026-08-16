import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'

export function SignaturePadStep({
  onConfirm,
  onVoltar,
  enviando,
}: {
  onConfirm: (dataUrl: string) => void
  onVoltar: () => void
  enviando: boolean
}) {
  const sigRef = useRef<SignatureCanvas>(null)
  const [vazio, setVazio] = useState(true)

  function limpar() {
    sigRef.current?.clear()
    setVazio(true)
  }

  function confirmar() {
    if (!sigRef.current || sigRef.current.isEmpty()) return
    const dataUrl = sigRef.current.getCanvas().toDataURL('image/png')
    onConfirm(dataUrl)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-sm text-neutral-600">
        Peça para o cliente assinar abaixo para confirmar a compra.
      </p>

      <div className="overflow-hidden rounded-xl border border-neutral-300 bg-white">
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{ className: 'w-full h-48 touch-none' }}
          onEnd={() => setVazio(sigRef.current?.isEmpty() ?? true)}
        />
      </div>

      <button onClick={limpar} className="self-start text-sm text-neutral-500 underline">
        Limpar assinatura
      </button>

      <div className="flex gap-2">
        <button
          onClick={onVoltar}
          className="flex-1 rounded-lg border border-neutral-300 py-3 text-sm font-medium"
        >
          Voltar
        </button>
        <button
          onClick={confirmar}
          disabled={vazio || enviando}
          className="flex-1 rounded-lg bg-[var(--cor-primaria)] py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {enviando ? 'Finalizando...' : 'Confirmar venda'}
        </button>
      </div>
    </div>
  )
}
