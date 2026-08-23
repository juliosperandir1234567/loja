import { useMutation, useQueryClient } from '@tanstack/react-query'
import { finalizarVenda, cancelarVenda } from './api'

export function useFinalizarVenda() {
  return useMutation({ mutationFn: finalizarVenda })
}

export function useCancelarVenda() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelarVenda,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] })
    },
  })
}
