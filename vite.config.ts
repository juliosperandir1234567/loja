import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  // câmera (getUserMedia) só é liberada pelo navegador em https ou localhost —
  // sem isso, acessar pelo IP da rede (celular) sempre falha ao abrir a câmera
  plugins: [react(), tailwindcss(), basicSsl()],
  server: {
    host: true,
  },
})
