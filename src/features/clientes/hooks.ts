import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { ClienteInsert, ClienteUpdate } from './api'

export function useClientes(busca?: string) {
  return useQuery({
    queryKey: ['clientes', busca ?? ''],
    queryFn: () => api.listarClientes(busca),
  })
}

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['clientes', 'detalhe', id],
    queryFn: () => api.buscarClientePorId(id!),
    enabled: !!id,
  })
}

export function useCriarCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cliente: ClienteInsert) => api.criarCliente(cliente),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  })
}

export function useAtualizarCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, cliente }: { id: string; cliente: ClienteUpdate }) =>
      api.atualizarCliente(id, cliente),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  })
}

export function useDeletarCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deletarCliente(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  })
}
