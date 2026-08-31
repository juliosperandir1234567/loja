import { supabase } from '../../lib/supabaseClient'
import type { Database, Marca, TipoProduto } from '../../types/database.types'

export type Produto = Database['public']['Tables']['produtos']['Row']
export type ProdutoInsert = Database['public']['Tables']['produtos']['Insert']
export type ProdutoUpdate = Database['public']['Tables']['produtos']['Update']

export interface FiltroProdutos {
  nome?: string
  fragrancia?: string
  tipo?: string
  marca?: string
  formato?: string
  codigoBarras?: string
}

export async function listarProdutos(filtros: FiltroProdutos = {}) {
  let query = supabase.from('produtos').select('*').eq('ativo', true).order('nome')
  if (filtros.nome) query = query.ilike('nome', `%${filtros.nome}%`)
  if (filtros.fragrancia) query = query.ilike('fragrancia_linha', `%${filtros.fragrancia}%`)
  if (filtros.tipo) query = query.eq('tipo', filtros.tipo as TipoProduto)
  if (filtros.marca) query = query.eq('marca', filtros.marca as Marca)
  if (filtros.formato) query = query.eq('formato', filtros.formato)
  if (filtros.codigoBarras) query = query.eq('codigo_barras', filtros.codigoBarras)
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

export async function criarProdutoComEstoqueInicial(
  produto: ProdutoInsert,
  estoqueInicial: number,
) {
  const { data, error } = await supabase.rpc('criar_produto_com_estoque_inicial', {
    p_nome: produto.nome,
    p_marca: produto.marca,
    p_preco_venda: produto.preco_venda,
    p_estoque_inicial: estoqueInicial,
    p_fragrancia_linha: produto.fragrancia_linha ?? null,
    p_codigo_barras: produto.codigo_barras ?? null,
    p_preco_custo: produto.preco_custo ?? 0,
    p_preco_promocional: produto.preco_promocional ?? null,
    p_estoque_minimo: produto.estoque_minimo,
    p_foto_url: produto.foto_url ?? null,
    p_tamanho: produto.tamanho ?? null,
    p_tipo: produto.tipo ?? null,
    p_formato: produto.formato ?? null,
  })
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

export async function atualizarPrecoEmMassa(
  ids: string[],
  precos: { preco_custo?: number; preco_venda?: number; preco_promocional?: number | null },
) {
  const { error } = await supabase.from('produtos').update(precos).in('id', ids)
  if (error) throw error
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

export const FORMATOS = [
  'Deo Colônia',
  'Rollon',
  'Desodorante',
  'Body Splash',
  'Hidratante',
  'Refil Hidratante',
  'Sabonete',
]

export function precoEfetivo(produto: Pick<Produto, 'preco_venda' | 'preco_promocional'>) {
  return produto.preco_promocional ?? produto.preco_venda
}

export function nomeCompleto(produto: Pick<Produto, 'nome' | 'fragrancia_linha' | 'formato'>) {
  const base = produto.fragrancia_linha ? `${produto.nome} - ${produto.fragrancia_linha}` : produto.nome
  return produto.formato ? `${base} (${produto.formato})` : base
}
