import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { BoletoCompraInsert } from './api'
import type { FormaRecebimentoBoleto } from '../../types/database.types'

export function useBoletos() {
  return useQuery({
    queryKey: ['boletos-compra'],
    queryFn: api.listarBoletos,
  })
}

export function useCriarBoleto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (boleto: BoletoCompraInsert) => api.criarBoleto(boleto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boletos-compra'] }),
  })
}

export function useCriarBoletoParcelado() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.criarBoletoParcelado,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boletos-compra'] }),
  })
}

export function useAtualizarVencimentoBoleto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, vencimento }: { id: string; vencimento: string }) =>
      api.atualizarVencimentoBoleto(id, vencimento),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boletos-compra'] }),
  })
}

export function useDeletarBoletos() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => api.deletarBoletos(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boletos-compra'] }),
  })
}

export function useMarcarBoletoComoPago() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formaPagamento }: { id: string; formaPagamento: FormaRecebimentoBoleto }) =>
      api.marcarBoletoComoPago(id, formaPagamento),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boletos-compra'] })
      queryClient.invalidateQueries({ queryKey: ['saldo-caixa'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
