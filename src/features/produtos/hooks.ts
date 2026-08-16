import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { ProdutoInsert, ProdutoUpdate } from './api'

export function useProdutos(busca?: string) {
  return useQuery({
    queryKey: ['produtos', busca ?? ''],
    queryFn: () => api.listarProdutos(busca),
  })
}

export function useProduto(id: string | undefined) {
  return useQuery({
    queryKey: ['produtos', 'detalhe', id],
    queryFn: () => api.buscarProdutoPorId(id!),
    enabled: !!id,
  })
}

export function useCriarProduto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (produto: ProdutoInsert) => api.criarProduto(produto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] }),
  })
}

export function useAtualizarProduto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, produto }: { id: string; produto: ProdutoUpdate }) =>
      api.atualizarProduto(id, produto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] }),
  })
}

export function useDeletarProduto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deletarProduto(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] }),
  })
}
