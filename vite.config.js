import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { getFaucetInfo, claimFromBank, createQuickWallet, getWalletBalance } from './src/faucet-api.js'

function faucetApiPlugin() {
  return {
    name: 'faucet-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, `http://${req.headers.host}`)

        if (url.pathname === '/api/faucet/info' && req.method === 'GET') {
          try {
            const info = await getFaucetInfo()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(info))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }

        if (url.pathname === '/api/faucet/claim' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}')
              const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
              const result = await claimFromBank(parsed.address, parsed.amount, parsed.token || 'THRU', ip)
              res.setHeader('Content-Type', 'application/json')
              if (!result.success) res.statusCode = 400
              res.end(JSON.stringify(result))
            } catch (e) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: e.message }))
            }
          })
          return
        }

        if (url.pathname === '/api/wallet/balance' && req.method === 'GET') {
          try {
            const addr = url.searchParams.get('address') || 'default'
            const result = await getWalletBalance(addr)
            res.setHeader('Content-Type', 'application/json')
            if (!result.success) res.statusCode = 400
            res.end(JSON.stringify(result))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }

        if (url.pathname === '/api/faucet/generate-wallet' && req.method === 'POST') {
          try {
            const w = await createQuickWallet()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(w))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }

        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), faucetApiPlugin()],
})
