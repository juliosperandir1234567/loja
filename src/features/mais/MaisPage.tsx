import { Link } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'

const ITENS = [
  { to: '/clientes', label: 'Clientes', descricao: 'Cadastro completo de clientes' },
  { to: '/boletos', label: 'Boletos a pagar', descricao: 'Contas a pagar aos fornecedores' },
  { to: '/usuarios', label: 'Usuários', descricao: 'Cadastro de vendedores' },
  { to: '/etiquetas', label: 'Etiquetas', descricao: 'Imprimir preço dos produtos' },
  { to: '/configuracoes', label: 'Configurações', descricao: 'Loja, mensagens e aparência' },
]

export function MaisPage() {
  return (
    <AppShell title="Mais">
      <div className="flex flex-col gap-2 p-4">
        {ITENS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-xl bg-white p-4 ring-1 ring-neutral-200"
          >
            <p className="font-medium text-neutral-900">{item.label}</p>
            <p className="text-sm text-neutral-500">{item.descricao}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}
