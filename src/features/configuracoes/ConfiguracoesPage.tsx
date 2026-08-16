import { useState } from 'react'
import toast from 'react-hot-toast'
import { AppShell } from '../../components/layout/AppShell'
import { useConfiguracoes, useAtualizarConfiguracoes } from './hooks'
import { uploadImagemConfig } from './api'

export function ConfiguracoesPage() {
  const { data: config } = useConfiguracoes()
  const atualizar = useAtualizarConfiguracoes()
  const [enviandoLogo, setEnviandoLogo] = useState(false)
  const [enviandoFundo, setEnviandoFundo] = useState(false)

  if (!config) return null

  async function salvarCampo(campo: string, valor: string) {
    try {
      await atualizar.mutateAsync({ [campo]: valor })
      toast.success('Configuração salva')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  async function handleUpload(campo: 'logo' | 'fundo', file: File) {
    const setEnviando = campo === 'logo' ? setEnviandoLogo : setEnviandoFundo
    setEnviando(true)
    try {
      const url = await uploadImagemConfig(campo, file)
      await atualizar.mutateAsync(campo === 'logo' ? { logo_url: url } : { imagem_fundo_url: url })
      toast.success('Imagem atualizada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar imagem')
    } finally {
      setEnviando(false)
    }
  }

  async function handleRemover(campo: 'logo' | 'fundo') {
    try {
      await atualizar.mutateAsync(campo === 'logo' ? { logo_url: null } : { imagem_fundo_url: null })
      toast.success('Imagem removida')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover imagem')
    }
  }

  return (
    <AppShell title="Configurações">
      <div className="flex flex-col gap-6 p-4">
        <section className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-neutral-200">
          <h2 className="text-sm font-semibold text-neutral-700">Dados da loja</h2>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">Nome da loja</span>
            <input
              defaultValue={config.nome_loja}
              onBlur={(e) => salvarCampo('nome_loja', e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">Endereço</span>
            <input
              defaultValue={config.endereco ?? ''}
              onBlur={(e) => salvarCampo('endereco', e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">Telefone</span>
            <input
              defaultValue={config.telefone_loja ?? ''}
              onBlur={(e) => salvarCampo('telefone_loja', e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:outline-none"
            />
          </label>
        </section>

        <section className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-neutral-200">
          <h2 className="text-sm font-semibold text-neutral-700">Mensagem de aniversário</h2>
          <p className="text-xs text-neutral-400">
            Use {'{{nome}}'} para o nome do cliente. Enviada pronta pelo WhatsApp.
          </p>
          <textarea
            defaultValue={config.mensagem_aniversario_template}
            onBlur={(e) => salvarCampo('mensagem_aniversario_template', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:outline-none"
          />
        </section>

        <section className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-neutral-200">
          <h2 className="text-sm font-semibold text-neutral-700">Aparência</h2>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">Cor principal</span>
            <input
              type="color"
              defaultValue={config.cor_primaria}
              onChange={(e) => salvarCampo('cor_primaria', e.target.value)}
              className="h-11 w-20 rounded-lg border border-neutral-300"
            />
          </label>

          <div>
            <span className="mb-1 block text-sm font-medium text-neutral-700">
              Logo (aparece no PDF de fiado)
            </span>
            {config.logo_url && (
              <div className="mb-2 flex items-center gap-2">
                <img src={config.logo_url} alt="Logo" className="h-16 rounded-lg object-contain" />
                <button
                  type="button"
                  onClick={() => handleRemover('logo')}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700"
                >
                  Remover
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              disabled={enviandoLogo}
              onChange={(e) => e.target.files?.[0] && handleUpload('logo', e.target.files[0])}
              className="w-full text-sm"
            />
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium text-neutral-700">
              Imagem de fundo do sistema
            </span>
            {config.imagem_fundo_url && (
              <div className="mb-2 flex flex-col gap-2">
                <img
                  src={config.imagem_fundo_url}
                  alt="Fundo"
                  className="h-16 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemover('fundo')}
                  className="self-start rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700"
                >
                  Remover
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              disabled={enviandoFundo}
              onChange={(e) => e.target.files?.[0] && handleUpload('fundo', e.target.files[0])}
              className="w-full text-sm"
            />
          </div>
        </section>
      </div>
    </AppShell>
  )
}
