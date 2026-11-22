import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig, type Plugin } from 'vite'
import { WebSocketServer } from 'ws'
import { attachSignalingHandler } from './server/signalingHandler.mjs'

const signalingPlugin = (): Plugin => ({
  name: 'nanomeeter-signaling',
  configureServer(server) {
    const wss = new WebSocketServer({ noServer: true })
    attachSignalingHandler(wss)

    server.httpServer?.on('upgrade', (req, socket, head) => {
      const { pathname } = new URL(req.url ?? '', 'http://localhost')
      if (pathname === '/ws') {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req)
        })
      }
    })
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl(), signalingPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
