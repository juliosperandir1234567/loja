import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { ProdutoInsert, ProdutoUpdate } from './api'
import { listarCatalogoProdutos } from './ean'

export function useCatalogoProdutos(enabled: boolean) {
  return useQuery({
    queryKey: ['catalogo-produtos'],
    queryFn: listarCatalogoProdutos,
    enabled,
    staleTime: Infinity,
  })
}

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
    mutationFn: ({ produto, estoqueInicial }: { produto: ProdutoInsert; estoqueInicial: number }) =>
      api.criarProdutoComEstoqueInicial(produto, estoqueInicial),
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

export function useAtualizarPrecoEmMassa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, precoVenda }: { ids: string[]; precoVenda: number }) =>
      api.atualizarPrecoEmMassa(ids, precoVenda),
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
