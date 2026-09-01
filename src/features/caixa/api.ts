import { supabase } from '../../lib/supabaseClient'
import type { Database, Marca } from '../../types/database.types'

export type SaldoCaixa = Database['public']['Tables']['saldo_caixa']['Row']

export async function listarSaldoCaixa() {
  const { data, error } = await supabase.from('saldo_caixa').select('*').order('fornecedor')
  if (error) throw error
  return data
}

export async function atualizarSaldoCaixa(params: {
  fornecedor: Marca
  saldoCaixa: number
  saldoConta: number
}) {
  const { data, error } = await supabase
    .from('saldo_caixa')
    .update({ saldo_caixa: params.saldoCaixa, saldo_conta: params.saldoConta })
    .eq('fornecedor', params.fornecedor)
    .select()
    .single()
  if (error) throw error
  return data
}
