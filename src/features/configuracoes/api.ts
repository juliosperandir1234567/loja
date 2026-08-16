import { supabase } from '../../lib/supabaseClient'
import type { Database } from '../../types/database.types'

export type Configuracoes = Database['public']['Tables']['configuracoes_sistema']['Row']
export type ConfiguracoesUpdate = Database['public']['Tables']['configuracoes_sistema']['Update']

export async function buscarConfiguracoes() {
  const { data, error } = await supabase
    .from('configuracoes_sistema')
    .select('*')
    .eq('id', 1)
    .single()
  if (error) throw error
  return data
}

export async function atualizarConfiguracoes(config: ConfiguracoesUpdate) {
  const { data, error } = await supabase
    .from('configuracoes_sistema')
    .update(config)
    .eq('id', 1)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function uploadImagemConfig(campo: 'logo' | 'fundo', file: File) {
  const ext = file.name.split('.').pop()
  const path = `${campo}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('configuracoes').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('configuracoes').getPublicUrl(path)
  return data.publicUrl
}
