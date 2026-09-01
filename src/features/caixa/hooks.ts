import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'

export function useSaldoCaixa() {
  return useQuery({
    queryKey: ['saldo-caixa'],
    queryFn: api.listarSaldoCaixa,
  })
}

export function useAtualizarSaldoCaixa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.atualizarSaldoCaixa,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saldo-caixa'] }),
  })
}
