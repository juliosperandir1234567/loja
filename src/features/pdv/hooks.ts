import { useMutation } from '@tanstack/react-query'
import { finalizarVenda } from './api'

export function useFinalizarVenda() {
  return useMutation({ mutationFn: finalizarVenda })
}
