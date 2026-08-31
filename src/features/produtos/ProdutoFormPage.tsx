import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { AppShell } from '../../components/layout/AppShell'
import { BarcodeScannerModal } from '../../components/BarcodeScannerModal'
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal'
import { useProduto, useCriarProduto, useAtualizarProduto, useDeletarProduto, useCatalogoProdutos } from './hooks'
import { buscarProdutoPorCodigoBarras, uploadFotoProduto, MARCAS, FORMATOS } from './api'
import { buscarProdutoExternoPorEAN } from './ean'

const schema = z
  .object({
    nome: z.string().min(1, 'Informe o nome do produto'),
    marca: z.enum(['Natura', 'Boticário']),
    fragrancia_linha: z.string().optional(),
    tipo: z.enum(['Masculino', 'Feminino', 'Unissex']).optional().or(z.literal('')),
    tamanho: z.string().optional(),
    formato: z.string().optional(),
    codigo_barras: z.string().optional(),
    preco_custo: z.coerce.number().min(0),
    preco_venda: z.coerce.number().min(0.01, 'Informe o preço revista'),
    preco_promocional: z.coerce.number().min(0).optional().or(z.literal('')),
    estoque_minimo: z.coerce.number().int().min(0),
    estoque_atual: z.coerce.number().int().min(0),
  })
  .transform((v) => ({
    ...v,
    preco_promocional: v.preco_promocional === '' ? null : (v.preco_promocional ?? null),
    tipo: v.tipo === '' ? null : (v.tipo ?? null),
    formato: v.formato === '' ? null : (v.formato ?? null),
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
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!fotoFile) {
      setFotoPreview(null)
      return
    }
    const url = URL.createObjectURL(fotoFile)
    setFotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [fotoFile])
  const [enviando, setEnviando] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [buscandoExterno, setBuscandoExterno] = useState(false)
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [mostrarSugestoesNome, setMostrarSugestoesNome] = useState(false)
  const { data: catalogo } = useCatalogoProdutos(!isEdit)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { estoque_atual: 0, marca: MARCAS[0] },
    values: produtoExistente
      ? {
          nome: produtoExistente.nome,
          marca: produtoExistente.marca,
          fragrancia_linha: produtoExistente.fragrancia_linha ?? '',
          tipo: produtoExistente.tipo ?? '',
          tamanho: produtoExistente.tamanho ?? '',
          formato: produtoExistente.formato ?? '',
          codigo_barras: produtoExistente.codigo_barras ?? '',
          preco_custo: produtoExistente.preco_custo,
          preco_venda: produtoExistente.preco_venda,
          preco_promocional: produtoExistente.preco_promocional ?? '',
          estoque_minimo: produtoExistente.estoque_minimo,
          estoque_atual: produtoExistente.estoque_atual,
        }
      : undefined,
  })

  const processarCodigoBarras = useCallback(
    async (codigo: string) => {
      if (isEdit || !codigo) return

      const existente = await buscarProdutoPorCodigoBarras(codigo)
      if (existente) {
        setDuplicado({ id: existente.id, nome: existente.nome })
        return
      }
      setDuplicado(null)

      setBuscandoExterno(true)
      try {
        const dados = await buscarProdutoExternoPorEAN(codigo)
        if (!dados) return
        if (dados.nome && !getValues('nome')) setValue('nome', dados.nome)
        if (dados.marca) setValue('marca', dados.marca as 'Natura' | 'Boticário')
        if (dados.fragranciaLinha && !getValues('fragrancia_linha')) {
          setValue('fragrancia_linha', dados.fragranciaLinha)
        }
        if (dados.tipo && !getValues('tipo')) {
          setValue('tipo', dados.tipo as 'Masculino' | 'Feminino' | 'Unissex')
        }
        if (dados.tamanho && !getValues('tamanho')) setValue('tamanho', dados.tamanho)
        if (dados.formato && !getValues('formato')) setValue('formato', dados.formato)
        if (dados.nome || dados.marca || dados.fragranciaLinha || dados.tipo || dados.tamanho || dados.formato) {
          toast.success('Dados do produto encontrados e preenchidos automaticamente')
        }
      } finally {
        setBuscandoExterno(false)
      }
    },
    [isEdit, setValue, getValues],
  )

  const handleDetected = useCallback(
    (codigo: string) => {
      setScannerOpen(false)
      setValue('codigo_barras', codigo)
      processarCodigoBarras(codigo)
    },
    [setValue, processarCodigoBarras],
  )

  const nomeAtual = watch('nome')
  const marcaAtual = watch('marca')

  const sugestoesFragrancia = useMemo(() => {
    if (!catalogo || isEdit) return []
    const nomeNorm = nomeAtual?.trim().toLowerCase()
    if (!nomeNorm || nomeNorm.length < 2) return []

    const doMesmoNome = catalogo.filter((c) => c.marca === marcaAtual && c.nome.toLowerCase() === nomeNorm)
    const candidatos =
      doMesmoNome.length > 0
        ? doMesmoNome
        : catalogo.filter((c) => c.marca === marcaAtual && c.nome.toLowerCase().includes(nomeNorm))

    const vistos = new Set<string>()
    const unicos: typeof candidatos = []
    for (const c of candidatos) {
      const chave = `${c.fragrancia_linha ?? ''}|${c.tipo ?? ''}|${c.tamanho ?? ''}|${c.formato ?? ''}`
      if (vistos.has(chave)) continue
      vistos.add(chave)
      unicos.push(c)
    }
    return unicos.slice(0, 30)
  }, [catalogo, isEdit, nomeAtual, marcaAtual])

  const sugestoesNome = useMemo(() => {
    if (!catalogo || isEdit) return []
    const nomeNorm = nomeAtual?.trim().toLowerCase()
    if (!nomeNorm || nomeNorm.length < 2) return []

    const vistos = new Set<string>()
    const unicos: string[] = []
    for (const c of catalogo) {
      if (c.marca !== marcaAtual || !c.nome.toLowerCase().includes(nomeNorm)) continue
      if (vistos.has(c.nome)) continue
      vistos.add(c.nome)
      unicos.push(c.nome)
      if (c.nome.toLowerCase() === nomeNorm) return []
    }
    return unicos.slice(0, 20)
  }, [catalogo, isEdit, nomeAtual, marcaAtual])

  const formatoAtual = watch('formato')
  const fragranciaAtual = watch('fragrancia_linha')

  // tamanho depende do formato (ex: Deo Colônia 100ml x Body Spray 200ml da
  // mesma fragrância), então sempre que o formato muda buscamos de novo na base
  useEffect(() => {
    if (!catalogo || isEdit) return
    const nomeNorm = nomeAtual?.trim().toLowerCase()
    const formatoNorm = formatoAtual?.trim().toLowerCase()
    if (!nomeNorm || !formatoNorm) return
    const fragNorm = fragranciaAtual?.trim().toLowerCase()

    const doMesmaFragrancia = fragNorm
      ? catalogo.find(
          (c) =>
            c.marca === marcaAtual &&
            c.nome.toLowerCase() === nomeNorm &&
            (c.formato ?? '').toLowerCase() === formatoNorm &&
            (c.fragrancia_linha ?? '').toLowerCase() === fragNorm,
        )
      : undefined

    const match =
      doMesmaFragrancia ??
      catalogo.find(
        (c) =>
          c.marca === marcaAtual &&
          c.nome.toLowerCase() === nomeNorm &&
          (c.formato ?? '').toLowerCase() === formatoNorm,
      )

    if (match?.tamanho) setValue('tamanho', match.tamanho)
  }, [catalogo, isEdit, nomeAtual, marcaAtual, formatoAtual, fragranciaAtual, setValue])

  async function onSubmit(values: FormValues) {
    setEnviando(true)
    try {
      let produtoId = id
      const { estoque_atual: estoqueInicial, ...dadosProduto } = values

      if (isEdit) {
        await atualizarProduto.mutateAsync({ id: id!, produto: dadosProduto })
      } else {
        const criado = await criarProduto.mutateAsync({ produto: dadosProduto, estoqueInicial })
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
          <div className="relative">
            <input
              {...register('nome')}
              autoComplete="off"
              onFocus={() => setMostrarSugestoesNome(true)}
              onBlur={() => setTimeout(() => setMostrarSugestoesNome(false), 150)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
            />
            {mostrarSugestoesNome && sugestoesNome.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
                {sugestoesNome.map((n) => (
                  <li key={n}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setValue('nome', n)
                        setMostrarSugestoesNome(false)
                        setMostrarSugestoes(true)
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
                    >
                      {n}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">Formato</span>
          <input
            {...register('formato')}
            list="formatos-sugeridos"
            placeholder="Ex: Deo Colônia, Rollon, Desodorante"
            autoComplete="off"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
          />
          <datalist id="formatos-sugeridos">
            {FORMATOS.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-neutral-500">
            Use quando a mesma fragrância existe em mais de uma apresentação (ex: Deo Colônia, Rollon,
            Desodorante).
          </p>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">Fragrância/linha</span>
          <div className="relative">
            <input
              {...register('fragrancia_linha')}
              placeholder="Ex: Kaiak, Essencial, Malbec"
              onFocus={() => setMostrarSugestoes(true)}
              onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)}
              autoComplete="off"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
            />
            {mostrarSugestoes && sugestoesFragrancia.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
                {sugestoesFragrancia.map((s, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setValue('fragrancia_linha', s.fragrancia_linha ?? '')
                        if (s.tipo) setValue('tipo', s.tipo as 'Masculino' | 'Feminino' | 'Unissex')
                        if (s.tamanho) setValue('tamanho', s.tamanho)
                        setValue('formato', s.formato ?? '')
                        setMostrarSugestoes(false)
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
                    >
                      {s.fragrancia_linha || '(sem variante)'}
                      <span className="text-neutral-400">
                        {s.formato ? ` · ${s.formato}` : ''}
                        {s.tipo ? ` · ${s.tipo}` : ''}
                        {s.tamanho ? ` · ${s.tamanho}` : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">Tamanho</span>
          <input
            {...register('tamanho')}
            placeholder="Ex: 400ml, 75g"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
          />
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
          <span className="mb-1 block text-sm font-medium text-neutral-700">Tipo</span>
          <select
            {...register('tipo')}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
          >
            <option value="">Não informado</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
            <option value="Unissex">Unissex</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">Código de barras</span>
          <div className="flex gap-2">
            <input
              {...register('codigo_barras')}
              value={watch('codigo_barras') ?? ''}
              onChange={(e) => setValue('codigo_barras', e.target.value)}
              onBlur={(e) => processarCodigoBarras(e.target.value.trim())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  processarCodigoBarras(e.currentTarget.value.trim())
                }
              }}
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
          {buscandoExterno && (
            <p className="mt-1 text-sm text-neutral-500">Buscando dados do produto...</p>
          )}
        </label>

        {!isEdit && !duplicado && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">Estoque atual</span>
            <input
              type="number"
              min={0}
              {...register('estoque_atual')}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Quantidade que já existe fisicamente na loja. Será registrada como estoque inicial.
            </p>
            {errors.estoque_atual && (
              <p className="mt-1 text-sm text-red-600">{errors.estoque_atual.message}</p>
            )}
          </label>
        )}

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
            <span className="mb-1 block text-sm font-medium text-neutral-700">Preço Revista</span>
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

        <div>
          <span className="mb-1 block text-sm font-medium text-neutral-700">Foto (opcional)</span>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 py-6 text-sm text-neutral-600 hover:border-neutral-400">
            {fotoPreview ? (
              <img
                src={fotoPreview}
                alt="Pré-visualização da foto do produto"
                className="h-20 w-20 rounded-lg object-cover"
              />
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7 text-neutral-400"
              >
                <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            )}
            <span>{fotoFile ? fotoFile.name : 'Tirar foto ou escolher imagem'}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setFotoFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
        </div>

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
