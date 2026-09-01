import { supabase } from '../../lib/supabaseClient'
import type { Database, FormaPagamento, FormaRecebimento } from '../../types/database.types'

export type Venda = Database['public']['Tables']['vendas']['Row']

export interface ItemCarrinho {
  produtoId: string
  quantidade: number
}

export interface FinalizarVendaParams {
  itens: ItemCarrinho[]
  formaPagamento: FormaPagamento
  clienteId?: string | null
  assinaturaDataUrl: string
  desconto?: number
  valorEntrada?: number
  combinacao?: string | null
  formaRecebimentoEntrada?: FormaRecebimento | null
}

function dataUrlParaBlob(dataUrl: string) {
  const [meta, base64] = dataUrl.split(',')
  const mime = meta.match(/:(.*?);/)?.[1] ?? 'image/png'
  const bytes = atob(base64)
  const array = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) array[i] = bytes.charCodeAt(i)
  return new Blob([array], { type: mime })
}

export async function finalizarVenda(params: FinalizarVendaParams): Promise<Venda> {
  const vendaId = crypto.randomUUID()
  const path = `${vendaId}.png`
  const blob = dataUrlParaBlob(params.assinaturaDataUrl)

  const { error: uploadError } = await supabase.storage
    .from('assinaturas')
    .upload(path, blob, { contentType: 'image/png' })
  if (uploadError) throw uploadError

  const { data, error } = await supabase.rpc('finalizar_venda', {
    p_venda_id: vendaId,
    p_itens: params.itens.map((i) => ({ produto_id: i.produtoId, quantidade: i.quantidade })),
    p_forma_pagamento: params.formaPagamento,
    p_cliente_id: params.clienteId ?? null,
    p_assinatura_url: path,
    p_desconto: params.desconto ?? 0,
    p_valor_entrada: params.valorEntrada ?? 0,
    p_combinacao: params.combinacao ?? null,
    p_forma_recebimento_entrada: params.formaRecebimentoEntrada ?? null,
  })
  if (error) throw error
  return data
}

export async function cancelarVenda(vendaId: string) {
  const { data, error } = await supabase.rpc('cancelar_venda', { p_venda_id: vendaId })
  if (error) throw error
  return data
}

export async function buscarVendaComItens(vendaId: string) {
  const { data: venda, error: vendaError } = await supabase
    .from('vendas')
    .select('*, cliente:clientes(nome, telefone)')
    .eq('id', vendaId)
    .single()
  if (vendaError) throw vendaError

  const { data: itens, error: itensError } = await supabase
    .from('itens_venda')
    .select('*, produto:produtos(nome)')
    .eq('venda_id', vendaId)
  if (itensError) throw itensError

  return { venda, itens: itens ?? [] }
}
