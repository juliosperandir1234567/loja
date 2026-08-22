import { supabase } from '../../lib/supabaseClient'

export interface ProdutoExterno {
  nome?: string
  marca?: string
  fragranciaLinha?: string
  tipo?: string
  tamanho?: string
  imagemUrl?: string
}

const REGEX_TAMANHO = /(\d+(?:[.,]\d+)?)\s?(ml|l|g|kg)\b/i

function extrairTamanho(texto?: string | null) {
  if (!texto) return undefined
  const m = texto.match(REGEX_TAMANHO)
  return m ? `${m[1]}${m[2].toLowerCase()}` : undefined
}

function mapMarca(bruto?: string | null): string | undefined {
  if (!bruto) return undefined
  const n = bruto.toLowerCase()
  if (n.includes('natura')) return 'Natura'
  if (n.includes('boticário') || n.includes('boticario')) return 'Boticário'
  return undefined
}

// catálogo próprio da loja (levantado manualmente para Natura/Boticário) —
// checado primeiro por ser grátis, instantâneo e sem limite de consultas
async function buscarNoCatalogoLocal(codigo: string): Promise<ProdutoExterno | null> {
  const { data, error } = await supabase
    .from('catalogo_produtos')
    .select('*')
    .eq('ean', codigo)
    .maybeSingle()
  if (error || !data) return null
  return {
    nome: data.nome,
    marca: mapMarca(data.marca) ?? data.marca,
    fragranciaLinha: data.fragrancia_linha ?? undefined,
    tipo: data.tipo ?? undefined,
    tamanho: data.tamanho ?? undefined,
  }
}

// Cosmos (Bluesoft) tem a melhor cobertura de produtos brasileiros, mas exige
// cadastro gratuito em cosmos.bluesoft.com.br para gerar um token
async function buscarNoCosmos(codigo: string): Promise<ProdutoExterno | null> {
  const token = import.meta.env.VITE_COSMOS_TOKEN
  if (!token) return null
  try {
    const resp = await fetch(`https://api.cosmos.bluesoft.com.br/gtins/${codigo}.json`, {
      headers: { 'X-Cosmos-Token': token },
    })
    if (!resp.ok) return null
    const data = await resp.json()
    if (!data?.description) return null
    return {
      nome: data.description,
      marca: mapMarca(data.brand?.name),
      tamanho: extrairTamanho(data.description),
      imagemUrl: data.thumbnail ?? undefined,
    }
  } catch {
    return null
  }
}

// Open Food/Beauty Facts: gratuitas e sem necessidade de token, mas com
// cobertura fraca para marcas brasileiras (Natura/Boticário)
async function buscarNaBaseAberta(
  base: 'openbeautyfacts' | 'openfoodfacts',
  codigo: string,
): Promise<ProdutoExterno | null> {
  try {
    const resp = await fetch(`https://world.${base}.org/api/v2/product/${codigo}.json`)
    if (!resp.ok) return null
    const data = await resp.json()
    if (data.status !== 1 || !data.product) return null
    const p = data.product
    return {
      nome: p.product_name || undefined,
      marca: mapMarca(p.brands),
      tamanho: p.quantity || extrairTamanho(p.product_name),
      imagemUrl: p.image_front_url || p.image_url || undefined,
    }
  } catch {
    return null
  }
}

export interface CatalogoItem {
  marca: string
  nome: string
  fragrancia_linha: string | null
  tipo: string | null
  tamanho: string | null
}

// carrega o catálogo inteiro (nome/fragrância/tipo/tamanho) para alimentar as
// sugestões de fragrância ao digitar o nome do produto no cadastro
export async function listarCatalogoProdutos(): Promise<CatalogoItem[]> {
  const { data, error } = await supabase
    .from('catalogo_produtos')
    .select('marca, nome, fragrancia_linha, tipo, tamanho')
  if (error) throw error
  return data
}

export async function buscarProdutoExternoPorEAN(codigo: string): Promise<ProdutoExterno | null> {
  const local = await buscarNoCatalogoLocal(codigo)
  if (local) return local

  const cosmos = await buscarNoCosmos(codigo)
  if (cosmos) return cosmos

  const beauty = await buscarNaBaseAberta('openbeautyfacts', codigo)
  if (beauty) return beauty

  return buscarNaBaseAberta('openfoodfacts', codigo)
}
