import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { AppShell } from '../../components/layout/AppShell'
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal'
import { useAuth } from '../auth/AuthProvider'
import { useCliente, useCriarCliente, useAtualizarCliente, useDeletarCliente } from './hooks'
import { buscarClientePorTelefone } from './api'

const schema = z.object({
  nome: z.string().min(1, 'Informe o nome'),
  telefone: z.string().min(1, 'Informe o telefone'),
  cpf: z.string().optional(),
  data_aniversario: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function ClienteFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { data: clienteExistente } = useCliente(id)
  const criarCliente = useCriarCliente()
  const atualizarCliente = useAtualizarCliente()
  const deletarCliente = useDeletarCliente()
  const [duplicado, setDuplicado] = useState<{ id: string; nome: string } | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: clienteExistente
      ? {
          nome: clienteExistente.nome,
          telefone: clienteExistente.telefone,
          cpf: clienteExistente.cpf ?? '',
          data_aniversario: clienteExistente.data_aniversario ?? '',
        }
      : undefined,
  })

  async function onSubmit(values: FormValues) {
    setDuplicado(null)
    try {
      if (isEdit) {
        await atualizarCliente.mutateAsync({ id: id!, cliente: values })
      } else {
        const existente = await buscarClientePorTelefone(values.telefone)
        if (existente) {
          setDuplicado({ id: existente.id, nome: existente.nome })
          return
        }
        await criarCliente.mutateAsync(values)
      }
      toast.success(isEdit ? 'Cliente atualizado' : 'Cliente cadastrado')
      navigate('/clientes')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar cliente')
    }
  }

  async function handleExcluir() {
    await deletarCliente.mutateAsync(id!)
    toast.success('Cliente excluído')
    navigate('/clientes')
  }

  return (
    <AppShell title={isEdit ? 'Editar cliente' : 'Novo cliente'}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
        {duplicado && (
          <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
            <p className="mb-2">Já existe um cliente com esse telefone: {duplicado.nome}</p>
            <button
              type="button"
              onClick={() => navigate(`/clientes/${duplicado.id}/editar`)}
              className="rounded-lg bg-amber-800 px-3 py-1.5 text-white"
            >
              Editar cliente existente
            </button>
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
          <span className="mb-1 block text-sm font-medium text-neutral-700">Telefone</span>
          <input
            {...register('telefone')}
            placeholder="(11) 91234-5678"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
          />
          {errors.telefone && (
            <p className="mt-1 text-sm text-red-600">{errors.telefone.message}</p>
          )}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">CPF (opcional)</span>
          <input
            {...register('cpf')}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">
            Data de nascimento (opcional)
          </span>
          <input
            type="date"
            {...register('data_aniversario')}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-lg bg-[var(--cor-primaria)] px-4 py-3 text-base font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar cliente'}
        </button>

        {isEdit && usuario?.role === 'admin' && (
          <button
            type="button"
            onClick={() => setConfirmandoExclusao(true)}
            className="rounded-lg border border-red-300 py-3 text-sm font-medium text-red-700"
          >
            Excluir cliente
          </button>
        )}
      </form>

      {confirmandoExclusao && (
        <ConfirmDeleteModal
          titulo="Excluir cliente"
          descricao={`Isso vai excluir "${clienteExistente?.nome}" definitivamente. Essa ação não pode ser desfeita.`}
          onConfirm={handleExcluir}
          onClose={() => setConfirmandoExclusao(false)}
        />
      )}
    </AppShell>
  )
}
