import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'

export function useHistoricoProduto(produtoId: string | undefined) {
  return useQuery({
    queryKey: ['movimentacoes', produtoId],
    queryFn: () => api.listarHistoricoProduto(produtoId!),
    enabled: !!produtoId,
  })
}

export function useProdutosEstoqueBaixo() {
  return useQuery({
    queryKey: ['produtos', 'estoque-baixo'],
    queryFn: api.listarProdutosEstoqueBaixo,
  })
}

export function useRegistrarMovimentacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.registrarMovimentacao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] })
    },
  })
}
