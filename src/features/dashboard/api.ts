import { supabase } from '../../lib/supabaseClient'
import type { Periodo } from './periodo'

export async function listarVendasPeriodo({ desde, ate }: Periodo) {
  const { data, error } = await supabase
    .from('vw_vendas_admin')
    .select('*')
    .neq('status', 'cancelada')
    .gte('criado_em', desde.toISOString())
    .lte('criado_em', ate.toISOString())
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data
}

export async function listarItensPeriodo({ desde, ate }: Periodo) {
  const { data, error } = await supabase
    .from('vw_itens_venda_admin')
    .select('*')
    .neq('status', 'cancelada')
    .gte('criado_em', desde.toISOString())
    .lte('criado_em', ate.toISOString())
  if (error) throw error
  return data
}

export async function listarVendasAno(ano: number) {
  const desde = new Date(ano, 0, 1)
  const ate = new Date(ano, 11, 31, 23, 59, 59)
  const { data, error } = await supabase
    .from('vw_vendas_admin')
    .select('*')
    .neq('status', 'cancelada')
    .gte('criado_em', desde.toISOString())
    .lte('criado_em', ate.toISOString())
  if (error) throw error
  return data
}

export async function listarPagamentosFiadoPeriodo({ desde, ate }: Periodo) {
  const { data, error } = await supabase
    .from('vw_pagamentos_fiado_admin')
    .select('*')
    .gte('criado_em', desde.toISOString())
    .lte('criado_em', ate.toISOString())
  if (error) throw error
  return data
}

// todos os itens de vendas a prazo ainda pendentes, sem filtro de data —
// usado pra calcular "a prazo em aberto" por marca no painel
export async function listarItensFiadoPendenteTodos() {
  const { data, error } = await supabase
    .from('vw_itens_venda_admin')
    .select('*')
    .eq('status', 'pendente')
    .eq('forma_pagamento', 'fiado')
  if (error) throw error
  return data
}

export async function listarEstoqueParaResumo() {
  const { data, error } = await supabase
    .from('produtos')
    .select('marca, estoque_atual, preco_custo, preco_venda, preco_promocional')
    .eq('ativo', true)
    .eq('avulso', false)
  if (error) throw error
  return data
}

export async function listarItensAno(ano: number) {
  const desde = new Date(ano, 0, 1)
  const ate = new Date(ano, 11, 31, 23, 59, 59)
  const { data, error } = await supabase
    .from('vw_itens_venda_admin')
    .select('*')
    .neq('status', 'cancelada')
    .gte('criado_em', desde.toISOString())
    .lte('criado_em', ate.toISOString())
  if (error) throw error
  return data
}
