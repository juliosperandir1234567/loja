import { supabase } from '../../lib/supabaseClient'

export async function registrarMovimentacao(params: {
  produtoId: string
  tipo: 'entrada' | 'saida_manual' | 'ajuste'
  quantidade: number
  motivo?: string
  fornecedor?: string
}) {
  const { data, error } = await supabase.rpc('registrar_movimentacao_estoque', {
    p_produto_id: params.produtoId,
    p_tipo: params.tipo,
    p_quantidade: params.quantidade,
    p_motivo: params.motivo ?? null,
    p_fornecedor: params.fornecedor ?? null,
  })
  if (error) throw error
  return data
}

export async function listarHistoricoProduto(produtoId: string) {
  const { data, error } = await supabase
    .from('movimentacoes_estoque')
    .select('*, responsavel:usuarios(nome)')
    .eq('produto_id', produtoId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data
}

export async function listarProdutosEstoqueBaixo() {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('ativo', true)
    .order('estoque_atual')
  if (error) throw error
  return (data ?? []).filter((p) => p.estoque_atual <= p.estoque_minimo)
}
