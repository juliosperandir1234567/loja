import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'

export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: api.listarUsuarios,
  })
}

export function useCriarVendedor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.criarVendedor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  })
}

export function useAtualizarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: { nome?: string; ativo?: boolean } }) =>
      api.atualizarUsuario(id, params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  })
}
