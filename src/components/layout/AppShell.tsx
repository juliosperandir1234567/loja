import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider'
import { useAniversariantesDaSemana } from '../../features/fiado/hooks'
import { useConfiguracoes } from '../../features/configuracoes/hooks'

interface NavItem {
  to: string
  label: string
  icone: string
}

const ADMIN_NAV: NavItem[] = [
  { to: '/', label: 'Painel', icone: '📊' },
  { to: '/pdv', label: 'Vender', icone: '🛒' },
  { to: '/produtos', label: 'Produtos', icone: '🏷️' },
  { to: '/estoque', label: 'Estoque', icone: '📦' },
  { to: '/fiado', label: 'A prazo', icone: '📒' },
  { to: '/mais', label: 'Mais', icone: '⚙️' },
]

const VENDEDOR_NAV: NavItem[] = [
  { to: '/pdv', label: 'Vender', icone: '🛒' },
  { to: '/fiado', label: 'A prazo', icone: '📒' },
]

function AniversarioBanner() {
  const navigate = useNavigate()
  const { data: aniversariantes } = useAniversariantesDaSemana()

  if (!aniversariantes || aniversariantes.length === 0) return null

  const nomes = aniversariantes.map((c) => c.nome).join(', ')

  return (
    <button
      onClick={() => navigate('/fiado')}
      className="w-full overflow-hidden bg-pink-600 px-4 py-2 text-left text-sm font-medium text-white"
    >
      🎂 Aniversário essa semana: {nomes}
    </button>
  )
}

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const { usuario, signOut } = useAuth()
  const { data: config } = useConfiguracoes()
  const nav = usuario?.role === 'admin' ? ADMIN_NAV : VENDEDOR_NAV

  return (
    <div className="flex min-h-dvh flex-col">
      <AniversarioBanner />

      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-4">
        <div className="flex items-center gap-2">
          {config?.logo_url && (
            <img
              src={config.logo_url}
              alt={config.nome_loja}
              className="h-9 w-9 rounded object-contain"
            />
          )}
          <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
        </div>
        <button onClick={signOut} className="min-h-0 px-2 text-base font-medium text-neutral-500">
          Sair
        </button>
      </header>

      <main className="flex-1 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-neutral-200 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex min-h-0 flex-1 flex-col items-center gap-0.5 py-2.5 text-center text-xs font-medium ${
                isActive ? 'text-[var(--cor-primaria)]' : 'text-neutral-500'
              }`
            }
          >
            <span className="text-2xl leading-none">{item.icone}</span>
            <span className="font-semibold">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
