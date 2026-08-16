import { supabase } from '../../lib/supabaseClient'
import type { Database, Marca } from '../../types/database.types'

export type Produto = Database['public']['Tables']['produtos']['Row']
export type ProdutoInsert = Database['public']['Tables']['produtos']['Insert']
export type ProdutoUpdate = Database['public']['Tables']['produtos']['Update']

export async function listarProdutos(busca?: string) {
  let query = supabase.from('produtos').select('*').eq('ativo', true).order('nome')
  if (busca) query = query.ilike('nome', `%${busca}%`)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function buscarProdutoPorId(id: string) {
  const { data, error } = await supabase.from('produtos').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function buscarProdutoPorCodigoBarras(codigoBarras: string) {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('codigo_barras', codigoBarras)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function criarProduto(produto: ProdutoInsert) {
  const { data, error } = await supabase.from('produtos').insert(produto).select().single()
  if (error) throw error
  return data
}

export async function atualizarProduto(id: string, produto: ProdutoUpdate) {
  const { data, error } = await supabase
    .from('produtos')
    .update(produto)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletarProduto(id: string) {
  const { error } = await supabase.from('produtos').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      throw new Error(
        'Não é possível excluir: esse produto já tem vendas ou movimentações de estoque registradas.',
      )
    }
    throw error
  }
}

export async function uploadFotoProduto(produtoId: string, file: File) {
  const ext = file.name.split('.').pop()
  const path = `${produtoId}.${ext}`
  const { error } = await supabase.storage
    .from('produtos-fotos')
    .upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('produtos-fotos').getPublicUrl(path)
  return data.publicUrl
}

export const MARCAS: Marca[] = ['Natura', 'Boticário']

export function precoEfetivo(produto: Pick<Produto, 'preco_venda' | 'preco_promocional'>) {
  return produto.preco_promocional ?? produto.preco_venda
}
