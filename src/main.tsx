import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './features/auth/AuthProvider'
import { ConfigProvider } from './features/configuracoes/ConfigProvider'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConfigProvider>
          <App />
          <Toaster position="top-center" />
        </ConfigProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
