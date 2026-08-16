import { useAniversariantesDaSemana } from './hooks'
import { useConfiguracoes } from '../configuracoes/hooks'
import { abrirWhatsApp, montarMensagemTemplate } from '../../utils/whatsapp'

export function AniversariantesWidget() {
  const { data: aniversariantes, isLoading } = useAniversariantesDaSemana()
  const { data: config } = useConfiguracoes()

  function enviarMensagem(nome: string, telefone: string) {
    const template =
      config?.mensagem_aniversario_template ??
      'Olá {{nome}}! A equipe do Espaço Sperandir deseja um feliz aniversário! 🎉'
    abrirWhatsApp(telefone, montarMensagemTemplate(template, nome))
  }

  if (isLoading || !aniversariantes || aniversariantes.length === 0) return null

  return (
    <div className="rounded-xl bg-pink-50 p-3 ring-1 ring-pink-200">
      <h2 className="mb-2 text-sm font-medium text-pink-900">
        🎂 Aniversariantes da semana
      </h2>
      <ul className="flex flex-col gap-2">
        {aniversariantes.map((c) => (
          <li key={c.id} className="flex items-center justify-between">
            <span className="text-sm text-pink-900">{c.nome}</span>
            <button
              onClick={() => enviarMensagem(c.nome, c.telefone)}
              className="rounded-lg bg-pink-600 px-3 py-1.5 text-xs font-medium text-white"
            >
              Enviar mensagem
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
