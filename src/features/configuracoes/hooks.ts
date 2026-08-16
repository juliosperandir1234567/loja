import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { ConfiguracoesUpdate } from './api'

export function useConfiguracoes() {
  return useQuery({
    queryKey: ['configuracoes'],
    queryFn: api.buscarConfiguracoes,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAtualizarConfiguracoes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (config: ConfiguracoesUpdate) => api.atualizarConfiguracoes(config),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['configuracoes'] }),
  })
}
