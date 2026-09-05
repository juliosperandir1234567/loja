import type { Produto } from '../produtos/api'
import { precoEfetivo } from '../produtos/api'

export interface CarrinhoItem {
  produto: Produto
  quantidade: number
  precoAvulso?: number
  observacao?: string
}

export interface KitInfo {
  produtoIds: string[]
  valorFinal: number
}

// preço a considerar pra esse item — o digitado na hora, quando é item
// avulso (sem produto real), ou o preço efetivo do catálogo
export function valorItemCarrinho(item: CarrinhoItem) {
  return item.precoAvulso ?? precoEfetivo(item.produto)
}
