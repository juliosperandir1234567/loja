import { supabase } from '../../lib/supabaseClient'
import type { Database } from '../../types/database.types'

export type Usuario = Database['public']['Tables']['usuarios']['Row']

export async function listarUsuarios() {
  const { data, error } = await supabase.from('usuarios').select('*').order('nome')
  if (error) throw error
  return data
}

export async function criarVendedor(params: { nome: string; email: string; senha: string }) {
  const { data, error } = await supabase.functions.invoke<{ usuario: Usuario; error?: string }>(
    'create-vendedor',
    { body: params },
  )
  if (error) {
    const context = (error as { context?: Response }).context
    let mensagem: string | null = null
    if (context) {
      try {
        const body = await context.clone().json()
        mensagem = body?.error ?? null
      } catch {
        // corpo não era JSON válido, segue com o erro genérico
      }
    }
    throw new Error(mensagem ?? error.message)
  }
  if (data?.error) throw new Error(data.error)
  return data!.usuario
}

export async function atualizarUsuario(id: string, params: { nome?: string; ativo?: boolean }) {
  const { data, error } = await supabase
    .from('usuarios')
    .update(params)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
