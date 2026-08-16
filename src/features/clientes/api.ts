import { supabase } from '../../lib/supabaseClient'
import type { Database } from '../../types/database.types'

export type Cliente = Database['public']['Tables']['clientes']['Row']
export type ClienteInsert = Database['public']['Tables']['clientes']['Insert']
export type ClienteUpdate = Database['public']['Tables']['clientes']['Update']

export async function listarClientes(busca?: string) {
  let query = supabase.from('clientes').select('*').order('nome')
  if (busca) query = query.ilike('nome', `%${busca}%`)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function buscarClientePorId(id: string) {
  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function buscarClientePorTelefone(telefone: string) {
  const digitos = telefone.replace(/\D/g, '')
  if (!digitos) return null
  const { data, error } = await supabase.from('clientes').select('*')
  if (error) throw error
  return (data ?? []).find((c) => c.telefone.replace(/\D/g, '') === digitos) ?? null
}

export async function criarCliente(cliente: ClienteInsert) {
  const { data, error } = await supabase.from('clientes').insert(cliente).select().single()
  if (error) throw error
  return data
}

export async function atualizarCliente(id: string, cliente: ClienteUpdate) {
  const { data, error } = await supabase
    .from('clientes')
    .update(cliente)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletarCliente(id: string) {
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      throw new Error('Não é possível excluir: esse cliente já tem vendas ou pagamentos registrados.')
    }
    throw error
  }
}
