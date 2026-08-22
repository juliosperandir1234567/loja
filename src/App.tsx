import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoginPage } from './features/auth/LoginPage'
import { HomePage } from './features/auth/HomePage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { ProdutosListPage } from './features/produtos/ProdutosListPage'
import { ProdutoFormPage } from './features/produtos/ProdutoFormPage'
import { PrecosEmMassaPage } from './features/produtos/PrecosEmMassaPage'
import { EstoqueHomePage } from './features/estoque/EstoqueHomePage'
import { EntradaEstoquePage } from './features/estoque/EntradaEstoquePage'
import { SaidaManualPage } from './features/estoque/SaidaManualPage'
import { AjusteEstoquePage } from './features/estoque/AjusteEstoquePage'
import { HistoricoProdutoPage } from './features/estoque/HistoricoProdutoPage'
import { PdvPage } from './features/pdv/PdvPage'
import { FiadosAbertosPage } from './features/fiado/FiadosAbertosPage'
import { ClienteFiadoDetailPage } from './features/fiado/ClienteFiadoDetailPage'
import { ClientesListPage } from './features/clientes/ClientesListPage'
import { ClienteFormPage } from './features/clientes/ClienteFormPage'
import { ConfiguracoesPage } from './features/configuracoes/ConfiguracoesPage'
import { MaisPage } from './features/mais/MaisPage'
import { BoletosPage } from './features/boletos/BoletosPage'
import { UsuariosListPage } from './features/usuarios/UsuariosListPage'
import { EtiquetasPage } from './features/etiquetas/EtiquetasPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute allow={['admin', 'vendedor']}>
              <HomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/produtos"
          element={
            <ProtectedRoute allow={['admin']}>
              <ProdutosListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/produtos/novo"
          element={
            <ProtectedRoute allow={['admin']}>
              <ProdutoFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/produtos/precos"
          element={
            <ProtectedRoute allow={['admin']}>
              <PrecosEmMassaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/produtos/:id/editar"
          element={
            <ProtectedRoute allow={['admin']}>
              <ProdutoFormPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/estoque"
          element={
            <ProtectedRoute allow={['admin']}>
              <EstoqueHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estoque/entrada"
          element={
            <ProtectedRoute allow={['admin']}>
              <EntradaEstoquePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estoque/saida"
          element={
            <ProtectedRoute allow={['admin']}>
              <SaidaManualPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estoque/ajuste"
          element={
            <ProtectedRoute allow={['admin']}>
              <AjusteEstoquePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estoque/historico/:id"
          element={
            <ProtectedRoute allow={['admin']}>
              <HistoricoProdutoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pdv"
          element={
            <ProtectedRoute allow={['admin', 'vendedor']}>
              <PdvPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fiado"
          element={
            <ProtectedRoute allow={['admin', 'vendedor']}>
              <FiadosAbertosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fiado/cliente/:id"
          element={
            <ProtectedRoute allow={['admin', 'vendedor']}>
              <ClienteFiadoDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <ProtectedRoute allow={['admin', 'vendedor']}>
              <ClientesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes/novo"
          element={
            <ProtectedRoute allow={['admin', 'vendedor']}>
              <ClienteFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes/:id/editar"
          element={
            <ProtectedRoute allow={['admin', 'vendedor']}>
              <ClienteFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes"
          element={
            <ProtectedRoute allow={['admin']}>
              <ConfiguracoesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mais"
          element={
            <ProtectedRoute allow={['admin']}>
              <MaisPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/boletos"
          element={
            <ProtectedRoute allow={['admin']}>
              <BoletosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute allow={['admin']}>
              <UsuariosListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/etiquetas"
          element={
            <ProtectedRoute allow={['admin']}>
              <EtiquetasPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
