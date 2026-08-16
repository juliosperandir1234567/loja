import { AppShell } from './layout/AppShell'

export function EmBreve({ titulo }: { titulo: string }) {
  return (
    <AppShell title={titulo}>
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
        <p className="text-neutral-400">Essa tela ainda será construída em uma próxima fase.</p>
      </div>
    </AppShell>
  )
}
