import { supabase } from '../../lib/supabaseClient'
import type { FormaRecebimento } from '../../types/database.types'

export async function listarFiadosAbertos() {
  const { data, error } = await supabase
    .from('saldo_fiado_cliente')
    .select('*')
    .gt('saldo_devedor', 0)
    .order('nome')
  if (error) throw error
  return data
}

export async function buscarSaldoCliente(clienteId: string) {
  const { data, error } = await supabase
    .from('saldo_fiado_cliente')
    .select('*')
    .eq('cliente_id', clienteId)
    .maybeSingle()
  if (error) throw error
  return data?.saldo_devedor ?? 0
}

export async function listarItensFiadoPendenteCliente(clienteId: string) {
  const { data, error } = await supabase
    .from('vw_itens_fiado_pendente')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('venda_criado_em', { ascending: true })
  if (error) throw error
  return data
}

export async function listarPagamentosCliente(clienteId: string) {
  const { data, error } = await supabase
    .from('vw_pagamentos_fiado_cliente')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('criado_em', { ascending: true })
  if (error) throw error
  return data
}

export async function listarHistoricoVendasCliente(clienteId: string) {
  const { data, error } = await supabase
    .from('vw_historico_vendas_cliente')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data
}

export async function registrarPagamentoItens(
  pagamentos: { itemId: string; valor: number }[],
  formaRecebimento: FormaRecebimento,
) {
  const { data, error } = await supabase.rpc('registrar_pagamento_fiado_itens', {
    p_pagamentos: pagamentos.map((p) => ({ item_id: p.itemId, valor: p.valor })),
    p_forma_recebimento: formaRecebimento,
  })
  if (error) throw error
  return data
}

export async function listarAniversariantesDaSemana() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .not('data_aniversario', 'is', null)
  if (error) throw error

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  return (data ?? []).filter((c) => {
    if (!c.data_aniversario) return false
    const [, mes, dia] = c.data_aniversario.split('-').map(Number)
    // próximos 7 dias a partir de hoje (inclusive), não a semana de calendário —
    // evita perder aniversários próximos quando hoje já é sexta/sábado
    for (let i = 0; i < 7; i++) {
      const d = new Date(hoje)
      d.setDate(hoje.getDate() + i)
      if (d.getMonth() + 1 === mes && d.getDate() === dia) return true
    }
    return false
  })
}
