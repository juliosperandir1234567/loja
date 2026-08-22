import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { AppShell } from '../../components/layout/AppShell'
import { useProdutos, useAtualizarPrecoEmMassa } from './hooks'
import { precoEfetivo } from './api'

export function PrecosEmMassaPage() {
  const [busca, setBusca] = useState('')
  const { data: produtos, isLoading } = useProdutos(busca)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [novoCusto, setNovoCusto] = useState('')
  const [novaRevista, setNovaRevista] = useState('')
  const [novaPromocao, setNovaPromocao] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const atualizarPrecoEmMassa = useAtualizarPrecoEmMassa()

  const grupos = useMemo(() => {
    const mapa = new Map<string, typeof produtos>()
    for (const p of produtos ?? []) {
      const chave = `${p.marca} · ${p.nome}`
      if (!mapa.has(chave)) mapa.set(chave, [])
      mapa.get(chave)!.push(p)
    }
    return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [produtos])

  function alternar(id: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  function alternarGrupo(itensDoGrupo: { id: string }[]) {
    const idsDoGrupo = itensDoGrupo.map((p) => p.id)
    const todosSelecionados = idsDoGrupo.every((id) => selecionados.has(id))
    setSelecionados((atual) => {
      const novo = new Set(atual)
      idsDoGrupo.forEach((id) => (todosSelecionados ? novo.delete(id) : novo.add(id)))
      return novo
    })
  }

  const valorCusto = Number(novoCusto.replace(',', '.'))
  const valorRevista = Number(novaRevista.replace(',', '.'))
  const valorPromocao = Number(novaPromocao.replace(',', '.'))

  const custoValido = novoCusto !== '' && valorCusto >= 0
  const revistaValida = novaRevista !== '' && valorRevista > 0
  const promocaoValida = novaPromocao !== '' && valorPromocao > 0

  const promocaoMaiorQueRevista =
    promocaoValida && revistaValida && valorPromocao >= valorRevista

  const algumCampoPreenchido = custoValido || revistaValida || promocaoValida
  const podeAplicar = algumCampoPreenchido && !promocaoMaiorQueRevista

  async function aplicar() {
    if (!podeAplicar || selecionados.size === 0) return
    try {
      const precos: { preco_custo?: number; preco_venda?: number; preco_promocional?: number } = {}
      if (custoValido) precos.preco_custo = valorCusto
      if (revistaValida) precos.preco_venda = valorRevista
      if (promocaoValida) precos.preco_promocional = valorPromocao

      await atualizarPrecoEmMassa.mutateAsync({ ids: [...selecionados], precos })
      toast.success(`Preço atualizado em ${selecionados.size} produto(s)`)
      setSelecionados(new Set())
      setNovoCusto('')
      setNovaRevista('')
      setNovaPromocao('')
      setConfirmando(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar preços')
    }
  }

  return (
    <AppShell title="Preços em massa">
      <div className="flex flex-col gap-4 p-4 pb-28">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar linha por nome..."
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
        />

        {isLoading && <p className="text-neutral-400">Carregando...</p>}

        <div className="flex flex-col gap-3">
          {grupos.map(([chave, itens]) => {
            const lista = itens ?? []
            const idsDoGrupo = lista.map((p) => p.id)
            const todosSelecionados = idsDoGrupo.length > 0 && idsDoGrupo.every((id) => selecionados.has(id))
            const estoqueTotal = lista.reduce((acc, p) => acc + p.estoque_atual, 0)

            return (
              <div key={chave} className="rounded-xl bg-white ring-1 ring-neutral-200">
                <label className="flex items-center justify-between gap-2 border-b border-neutral-100 p-3">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={todosSelecionados}
                      onChange={() => alternarGrupo(lista)}
                      className="h-4 w-4"
                    />
                    <span className="font-medium text-neutral-900">{chave}</span>
                  </span>
                  <span className="text-sm text-neutral-500">{estoqueTotal} em estoque</span>
                </label>

                <ul className="flex flex-col divide-y divide-neutral-100">
                  {lista.map((p) => (
                    <li key={p.id}>
                      <label className="flex items-center justify-between gap-2 px-3 py-2.5">
                        <span className="flex min-w-0 items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selecionados.has(p.id)}
                            onChange={() => alternar(p.id)}
                            className="h-4 w-4 shrink-0"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm text-neutral-900">
                              {p.fragrancia_linha || '(sem variante)'}
                              {p.tamanho ? ` · ${p.tamanho}` : ''}
                            </span>
                            <span
                              className={`text-xs ${
                                p.estoque_atual <= p.estoque_minimo ? 'font-medium text-red-600' : 'text-neutral-400'
                              }`}
                            >
                              {p.estoque_atual} em estoque
                            </span>
                          </span>
                        </span>
                        <span className="shrink-0 text-right text-sm">
                          <span className="block font-medium text-neutral-900">
                            R$ {precoEfetivo(p).toFixed(2)}
                          </span>
                          <span className="text-xs text-neutral-400">
                            custo R$ {Number(p.preco_custo).toFixed(2)}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}

          {!isLoading && grupos.length === 0 && (
            <p className="mt-8 text-center text-neutral-400">Nenhum produto encontrado.</p>
          )}
        </div>
      </div>

      {selecionados.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 flex flex-col gap-1.5 border-t border-neutral-200 bg-white p-2.5 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min={0}
              value={novoCusto}
              onChange={(e) => {
                setNovoCusto(e.target.value)
                setConfirmando(false)
              }}
              placeholder="Custo"
              className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-2 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
            <input
              type="number"
              step="0.01"
              min={0}
              value={novaRevista}
              onChange={(e) => {
                setNovaRevista(e.target.value)
                setConfirmando(false)
              }}
              placeholder="Revista"
              className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-2 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
            <input
              type="number"
              step="0.01"
              min={0}
              value={novaPromocao}
              onChange={(e) => {
                setNovaPromocao(e.target.value)
                setConfirmando(false)
              }}
              placeholder="Promoção"
              className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-2 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
            <button
              onClick={() => (confirmando ? aplicar() : setConfirmando(true))}
              disabled={!podeAplicar || atualizarPrecoEmMassa.isPending}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                confirmando ? 'bg-red-600' : 'bg-[var(--cor-primaria)]'
              }`}
            >
              {atualizarPrecoEmMassa.isPending ? '...' : confirmando ? 'Confirmar?' : 'Aplicar'}
            </button>
          </div>
          <p className="text-xs text-neutral-500">
            {selecionados.size} selecionado(s) · em branco não altera
          </p>
          {promocaoMaiorQueRevista && (
            <p className="text-xs text-red-600">A promoção deve ser menor que o preço Revista</p>
          )}
        </div>
      )}
    </AppShell>
  )
}
