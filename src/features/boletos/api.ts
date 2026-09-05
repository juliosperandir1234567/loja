import { supabase } from '../../lib/supabaseClient'
import type { Database, FormaRecebimentoBoleto } from '../../types/database.types'

export type BoletoCompra = Database['public']['Tables']['boletos_compra']['Row']
export type BoletoCompraInsert = Database['public']['Tables']['boletos_compra']['Insert']

export async function listarBoletos() {
  const { data, error } = await supabase
    .from('boletos_compra')
    .select('*')
    .order('vencimento', { ascending: true })
  if (error) throw error
  return data
}

export async function criarBoleto(boleto: BoletoCompraInsert) {
  const { data, error } = await supabase.from('boletos_compra').insert(boleto).select().single()
  if (error) throw error
  return data
}

// Divide o valor total da compra em N parcelas mensais (a partir do vencimento
// da 1ª parcela), ajustando centavos de arredondamento na última parcela.
export async function criarBoletoParcelado(params: {
  fornecedor: string
  descricao: string | null
  valorTotal: number
  parcelas: number
  primeiroVencimento: string
}) {
  const { fornecedor, descricao, valorTotal, parcelas, primeiroVencimento } = params
  const valorParcela = Math.floor((valorTotal / parcelas) * 100) / 100
  const somaParcelas = valorParcela * (parcelas - 1)
  const valorUltimaParcela = Math.round((valorTotal - somaParcelas) * 100) / 100

  const linhas: BoletoCompraInsert[] = Array.from({ length: parcelas }, (_, i) => {
    const vencimento = new Date(`${primeiroVencimento}T00:00:00`)
    vencimento.setMonth(vencimento.getMonth() + i)
    const valor = i === parcelas - 1 ? valorUltimaParcela : valorParcela
    const prefixo = parcelas > 1 ? `Parcela ${i + 1}/${parcelas} de R$ ${valorTotal.toFixed(2)}` : null
    const descricaoFinal = [descricao, prefixo].filter(Boolean).join(' — ') || null
    return {
      fornecedor,
      descricao: descricaoFinal,
      valor,
      vencimento: vencimento.toISOString().slice(0, 10),
    }
  })

  const { data, error } = await supabase.from('boletos_compra').insert(linhas).select()
  if (error) throw error
  return data
}

export async function atualizarVencimentoBoleto(id: string, vencimento: string) {
  const { data, error } = await supabase
    .from('boletos_compra')
    .update({ vencimento })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletarBoletos(ids: string[]) {
  const { error } = await supabase.from('boletos_compra').delete().in('id', ids)
  if (error) throw error
}

export async function marcarBoletoComoPago(id: string, formaPagamento: FormaRecebimentoBoleto) {
  const { data, error } = await supabase.rpc('marcar_boleto_pago', {
    p_boleto_id: id,
    p_forma_pagamento: formaPagamento,
  })
  if (error) throw error
  return data
}
