import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { FormaRecebimento } from '../../types/database.types'

export function useFiadosAbertos() {
  return useQuery({
    queryKey: ['fiados-abertos'],
    queryFn: api.listarFiadosAbertos,
  })
}

export function useAniversariantesDaSemana() {
  return useQuery({
    queryKey: ['aniversariantes-semana'],
    queryFn: api.listarAniversariantesDaSemana,
  })
}

export function useItensFiadoPendenteCliente(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['fiado-itens-pendentes', clienteId],
    queryFn: () => api.listarItensFiadoPendenteCliente(clienteId!),
    enabled: !!clienteId,
  })
}

export function useHistoricoVendasCliente(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['historico-vendas-cliente', clienteId],
    queryFn: () => api.listarHistoricoVendasCliente(clienteId!),
    enabled: !!clienteId,
  })
}

export function usePagamentosCliente(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['pagamentos-cliente', clienteId],
    queryFn: () => api.listarPagamentosCliente(clienteId!),
    enabled: !!clienteId,
  })
}

export function useRegistrarPagamentoItens() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      pagamentos: { itemId: string; valor: number }[]
      formaRecebimento: FormaRecebimento
    }) => api.registrarPagamentoItens(params.pagamentos, params.formaRecebimento),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiados-abertos'] })
      queryClient.invalidateQueries({ queryKey: ['fiado-itens-pendentes'] })
      queryClient.invalidateQueries({ queryKey: ['historico-vendas-cliente'] })
      queryClient.invalidateQueries({ queryKey: ['pagamentos-cliente'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['saldo-caixa'] })
    },
  })
}
