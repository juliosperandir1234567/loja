import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { AppShell } from '../../components/layout/AppShell'
import { BarcodeScannerModal } from '../../components/BarcodeScannerModal'
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal'
import { useProduto, useCriarProduto, useAtualizarProduto, useDeletarProduto } from './hooks'
import { buscarProdutoPorCodigoBarras, uploadFotoProduto, MARCAS } from './api'

const schema = z
  .object({
    nome: z.string().min(1, 'Informe o nome do produto'),
    marca: z.enum(['Natura', 'Boticário']),
    fragrancia_linha: z.string().optional(),
    codigo_barras: z.string().optional(),
    preco_custo: z.coerce.number().min(0),
    preco_venda: z.coerce.number().min(0.01, 'Informe o preço de venda'),
    preco_promocional: z.coerce.number().min(0).optional().or(z.literal('')),
    estoque_minimo: z.coerce.number().int().min(0),
  })
  .transform((v) => ({
    ...v,
    preco_promocional: v.preco_promocional === '' ? null : (v.preco_promocional ?? null),
  }))
  .refine(
    (v) => v.preco_promocional === null || v.preco_promocional < v.preco_venda,
    { message: 'O preço de promoção deve ser menor que o preço de venda', path: ['preco_promocional'] },
  )

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export function ProdutoFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { data: produtoExistente } = useProduto(id)
  const criarProduto = useCriarProduto()
  const atualizarProduto = useAtualizarProduto()
  const deletarProduto = useDeletarProduto()
  const [scannerOpen, setScannerOpen] = useState(false)
  const [duplicado, setDuplicado] = useState<{ id: string; nome: string } | null>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    values: produtoExistente
      ? {
          nome: produtoExistente.nome,
          marca: produtoExistente.marca,
          fragrancia_linha: produtoExistente.fragrancia_linha ?? '',
          codigo_barras: produtoExistente.codigo_barras ?? '',
          preco_custo: produtoExistente.preco_custo,
          preco_venda: produtoExistente.preco_venda,
          preco_promocional: produtoExistente.preco_promocional ?? '',
          estoque_minimo: produtoExistente.estoque_minimo,
        }
      : undefined,
  })

  async function handleDetected(codigo: string) {
    setScannerOpen(false)
    setValue('codigo_barras', codigo)

    if (!isEdit) {
      const existente = await buscarProdutoPorCodigoBarras(codigo)
      if (existente) setDuplicado({ id: existente.id, nome: existente.nome })
    }
  }

  async function onSubmit(values: FormValues) {
    setEnviando(true)
    try {
      let produtoId = id

      if (isEdit) {
        await atualizarProduto.mutateAsync({ id: id!, produto: values })
      } else {
        const criado = await criarProduto.mutateAsync(values)
        produtoId = criado.id
      }

      if (fotoFile && produtoId) {
        const url = await uploadFotoProduto(produtoId, fotoFile)
        await atualizarProduto.mutateAsync({ id: produtoId, produto: { foto_url: url } })
      }

      toast.success(isEdit ? 'Produto atualizado' : 'Produto cadastrado')
      reset()
      navigate('/produtos')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar produto')
    } finally {
      setEnviando(false)
    }
  }

  async function handleExcluir() {
    await deletarProduto.mutateAsync(id!)
    toast.success('Produto excluído')
    navigate('/produtos')
  }

  return (
    <AppShell title={isEdit ? 'Editar produto' : 'Novo produto'}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
        {duplicado && (
          <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
            <p className="mb-2">Já existe um produto com esse código: {duplicado.nome}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate(`/produtos/${duplicado.id}/editar`)}
                className="rounded-lg bg-amber-800 px-3 py-1.5 text-white"
              >
                Editar produto existente
              </button>
              <button
                type="button"
                onClick={() => navigate(`/estoque/entrada?produto=${duplicado.id}`)}
                className="rounded-lg border border-amber-800 px-3 py-1.5 text-amber-800"
              >
                Lançar entrada de estoque
              </button>
            </div>
          </div>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">Nome</span>
          <input
            {...register('nome')}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
          />
          {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">Marca</span>
          <select
            {...register('marca')}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
          >
            {MARCAS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">Fragrância/linha</span>
          <input
            {...register('fragrancia_linha')}
            placeholder="Ex: Kaiak, Essencial, Malbec"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">Código de barras</span>
          <div className="flex gap-2">
            <input
              {...register('codigo_barras')}
              value={watch('codigo_barras') ?? ''}
              onChange={(e) => setValue('codigo_barras', e.target.value)}
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
        </label>

        <div className="flex gap-3">
          <label className="block flex-1">
            <span className="mb-1 block text-sm font-medium text-neutral-700">Preço de custo</span>
            <input
              type="number"
              step="0.01"
              {...register('preco_custo')}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
            />
          </label>
          <label className="block flex-1">
            <span className="mb-1 block text-sm font-medium text-neutral-700">Preço de venda</span>
            <input
              type="number"
              step="0.01"
              {...register('preco_venda')}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
            />
            {errors.preco_venda && (
              <p className="mt-1 text-sm text-red-600">{errors.preco_venda.message}</p>
            )}
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">
            Preço de promoção (opcional)
          </span>
          <input
            type="number"
            step="0.01"
            {...register('preco_promocional')}
            placeholder="Deixe em branco se não tiver promoção"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
          />
          {errors.preco_promocional && (
            <p className="mt-1 text-sm text-red-600">{errors.preco_promocional.message}</p>
          )}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">Estoque mínimo (alerta)</span>
          <input
            type="number"
            {...register('estoque_minimo')}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">Foto (opcional)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFotoFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={enviando}
          className="mt-2 rounded-lg bg-[var(--cor-primaria)] px-4 py-3 text-base font-medium text-white disabled:opacity-50"
        >
          {enviando ? 'Salvando...' : 'Salvar produto'}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={() => setConfirmandoExclusao(true)}
            className="rounded-lg border border-red-300 py-3 text-sm font-medium text-red-700"
          >
            Excluir produto
          </button>
        )}
      </form>

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleDetected}
      />

      {confirmandoExclusao && (
        <ConfirmDeleteModal
          titulo="Excluir produto"
          descricao={`Isso vai excluir "${produtoExistente?.nome}" definitivamente. Essa ação não pode ser desfeita.`}
          onConfirm={handleExcluir}
          onClose={() => setConfirmandoExclusao(false)}
        />
      )}
    </AppShell>
  )
}
