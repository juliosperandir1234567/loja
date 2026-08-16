import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'

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

export function useRegistrarPagamentoItens() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.registrarPagamentoItens,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiados-abertos'] })
      queryClient.invalidateQueries({ queryKey: ['fiado-itens-pendentes'] })
    },
  })
}
