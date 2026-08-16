import { useEffect, type ReactNode } from 'react'
import { useConfiguracoes } from './hooks'

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { data: config } = useConfiguracoes()

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--cor-primaria', config?.cor_primaria || '#171717')
    root.style.setProperty(
      '--imagem-fundo',
      config?.imagem_fundo_url ? `url(${config.imagem_fundo_url})` : 'none',
    )
  }, [config?.cor_primaria, config?.imagem_fundo_url])

  return children
}
