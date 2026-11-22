import { createServer as createHttpServer } from 'http'
import { createServer as createHttpsServer } from 'https'
import { readFileSync } from 'fs'
import { readFile, stat } from 'fs/promises'
import { extname, join, normalize } from 'path'
import { fileURLToPath } from 'url'
import { WebSocketServer } from 'ws'
import { attachSignalingHandler } from './signalingHandler.mjs'

const PORT = process.env.PORT || 3000
const DIST = fileURLToPath(new URL('../dist', import.meta.url))

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
}

async function serveStatic(req, res) {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    let filePath = normalize(join(DIST, urlPath))
    if (!filePath.startsWith(DIST)) {
      res.writeHead(403).end()
      return
    }
    let fileStat = await stat(filePath).catch(() => null)
    if (!fileStat || fileStat.isDirectory()) {
      filePath = join(DIST, 'index.html')
      fileStat = await stat(filePath).catch(() => null)
    }
    if (!fileStat) {
      res.writeHead(404).end('not found')
      return
    }
    const body = await readFile(filePath)
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(500).end()
  }
}

const tlsKey = process.env.NANOMEETER_TLS_KEY || process.env.MEETU_TLS_KEY
const tlsCert = process.env.NANOMEETER_TLS_CERT || process.env.MEETU_TLS_CERT

const server =
  tlsKey && tlsCert
    ? createHttpsServer(
        {
          key: readFileSync(tlsKey),
          cert: readFileSync(tlsCert),
        },
        serveStatic,
      )
    : createHttpServer(serveStatic)

const wss = new WebSocketServer({ server, path: '/ws' })
attachSignalingHandler(wss)

server.listen(PORT, () => {
  console.log(`nanomeeter signaling server on http://localhost:${PORT}`)
})
