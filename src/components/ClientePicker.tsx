import { useState } from 'react'
import toast from 'react-hot-toast'
import { useClientes, useCriarCliente } from '../features/clientes/hooks'
import { buscarClientePorTelefone, type Cliente } from '../features/clientes/api'

export function ClientePicker({ onSelect }: { onSelect: (cliente: Cliente) => void }) {
  const [busca, setBusca] = useState('')
  const [criandoNovo, setCriandoNovo] = useState(false)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cpf, setCpf] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const { data: clientes } = useClientes(busca)
  const criarCliente = useCriarCliente()

  async function handleCriar() {
    if (!nome.trim() || !telefone.trim()) {
      toast.error('Informe nome e telefone')
      return
    }
    try {
      const existente = await buscarClientePorTelefone(telefone)
      if (existente) {
        toast.success(`Já existe um cliente com esse telefone: ${existente.nome}. Selecionado.`)
        onSelect(existente)
        return
      }
      const cliente = await criarCliente.mutateAsync({
        nome,
        telefone,
        cpf: cpf || null,
        data_aniversario: dataNascimento || null,
      })
      onSelect(cliente)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar cliente')
    }
  }

  if (criandoNovo) {
    return (
      <div className="flex flex-col gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">Nome</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">Telefone</span>
          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(11) 91234-5678"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">CPF (opcional)</span>
          <input
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">
            Data de nascimento (opcional)
          </span>
          <input
            type="date"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
          />
        </label>
        <div className="flex gap-2">
          <button
            onClick={handleCriar}
            disabled={criarCliente.isPending}
            className="flex-1 rounded-lg bg-[var(--cor-primaria)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Cadastrar e selecionar
          </button>
          <button
            onClick={() => setCriandoNovo(false)}
            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cliente por nome..."
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setCriandoNovo(true)}
          className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium"
        >
          + Novo
        </button>
      </div>

      {busca && (
        <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
          {clientes?.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c)}
                className="w-full rounded-lg bg-white px-3 py-2 text-left ring-1 ring-neutral-200"
              >
                <span className="font-medium">{c.nome}</span>{' '}
                <span className="text-sm text-neutral-500">{c.telefone}</span>
              </button>
            </li>
          ))}
          {clientes?.length === 0 && (
            <p className="px-1 py-2 text-sm text-neutral-400">Nenhum cliente encontrado.</p>
          )}
        </ul>
      )}
    </div>
  )
}
