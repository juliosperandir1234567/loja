import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

interface BarcodeScannerModalProps {
  open: boolean
  onClose: () => void
  onDetected: (codigo: string) => void
}

const READER_ID = 'barcode-scanner-reader'

// restringe aos formatos usados em produtos de mercado/perfumaria — evita que o
// scanner gaste ciclos tentando decodificar QR/DataMatrix/PDF417 em todo frame,
// o que deixava a leitura de código de barras (EAN/UPC) mais lenta e imprecisa
const FORMATOS_SUPORTADOS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.QR_CODE,
]

export function BarcodeScannerModal({ open, onClose, onDetected }: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [cameraError, setCameraError] = useState(false)
  const [manualCodigo, setManualCodigo] = useState('')

  useEffect(() => {
    if (!open) return

    setCameraError(false)
    const scanner = new Html5Qrcode(READER_ID, {
      formatsToSupport: FORMATOS_SUPORTADOS,
      // usa o decodificador nativo do celular quando disponível (Android/Chrome
      // principalmente) — muito mais rápido e preciso pra código de barras do
      // que o decodificador em JS que a biblioteca usa como fallback
      useBarCodeDetectorIfSupported: true,
      verbose: false,
    })
    scannerRef.current = scanner
    let cancelled = false

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          // caixa larga e baixa: código de barras (EAN/UPC) é bem mais largo que alto
          qrbox: { width: 300, height: 140 },
          videoConstraints: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        (decodedText) => {
          if (cancelled) return
          cancelled = true
          onDetected(decodedText.trim())
        },
        () => {
          // erro de leitura por frame, ignorado — não indica falha de câmera
        },
      )
      .catch(() => {
        if (!cancelled) setCameraError(true)
      })

    return () => {
      cancelled = true
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {})
      scannerRef.current = null
    }
  }, [open, onDetected])

  if (!open) return null

  function handleManualSubmit() {
    const codigo = manualCodigo.trim()
    if (codigo) onDetected(codigo)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4">
      <div className="flex items-center justify-between text-white">
        <h2 className="text-base font-medium">Escanear código de barras</h2>
        <button onClick={onClose} className="rounded-full bg-white/10 px-3 py-1.5 text-sm">
          Fechar
        </button>
      </div>

      {!cameraError && (
        <>
          <div className="mt-4 overflow-hidden rounded-xl">
            <div id={READER_ID} className="w-full" />
          </div>
          <p className="mt-2 text-center text-sm text-white/70">
            Aproxime bem o código de barras, com boa luz, até encher a caixa
          </p>
        </>
      )}

      <div className="mt-6 rounded-xl bg-white p-4">
        {cameraError && (
          <p className="mb-3 text-sm text-red-600">
            Não foi possível acessar a câmera. Digite o código manualmente abaixo.
          </p>
        )}
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Ou digite o código manualmente
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={manualCodigo}
            onChange={(e) => setManualCodigo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
            placeholder="Código de barras"
            autoFocus={cameraError}
          />
          <button
            onClick={handleManualSubmit}
            className="rounded-lg bg-[var(--cor-primaria)] px-4 py-2.5 text-sm font-medium text-white"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
