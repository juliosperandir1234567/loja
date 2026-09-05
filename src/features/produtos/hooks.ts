import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { ProdutoInsert, ProdutoUpdate, FiltroProdutos } from './api'
import { listarCatalogoProdutos } from './ean'

export function useCatalogoProdutos(enabled: boolean) {
  return useQuery({
    queryKey: ['catalogo-produtos'],
    queryFn: listarCatalogoProdutos,
    enabled,
    staleTime: Infinity,
  })
}

export function useProdutos(filtros: FiltroProdutos = {}, enabled = true) {
  return useQuery({
    queryKey: ['produtos', filtros],
    queryFn: () => api.listarProdutos(filtros),
    enabled,
  })
}

export function useProdutosAvulsos() {
  return useQuery({
    queryKey: ['produtos-avulsos'],
    queryFn: api.listarProdutosAvulsos,
    staleTime: Infinity,
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
    mutationFn: ({
      ids,
      precos,
    }: {
      ids: string[]
      precos: { preco_custo?: number; preco_venda?: number; preco_promocional?: number | null }
    }) => api.atualizarPrecoEmMassa(ids, precos),
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
