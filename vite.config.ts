import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

// 自定义插件：代理 LLM API 请求，解决 HTTPS 页面无法直接访问 HTTP API 的问题
function llmProxyPlugin(): PluginOption {
  return {
    name: 'llm-proxy',
    configureServer(server) {
      server.middlewares.use('/api/llm-proxy', async (req, res) => {
        // 从 URL 中提取目标地址: /api/llm-proxy/<encoded-url>
        const encoded = (req.url ?? '').slice(1) // 去掉开头的 /
        if (!encoded) {
          res.writeHead(400)
          res.end('Missing target URL')
          return
        }

        let targetUrl: URL
        try {
          targetUrl = new URL(decodeURIComponent(encoded))
        } catch {
          res.writeHead(400)
          res.end('Invalid target URL')
          return
        }

        // 读取请求体
        const chunks: Buffer[] = []
        for await (const chunk of req) {
          chunks.push(chunk as Buffer)
        }
        const body = Buffer.concat(chunks)

        // 转发请求到目标
        try {
          const proxyRes = await fetch(targetUrl.toString(), {
            method: req.method ?? 'POST',
            headers: {
              'Content-Type': req.headers['content-type'] ?? 'application/json',
              Authorization: req.headers['authorization'] ?? '',
            },
            body,
          })

          res.writeHead(proxyRes.status, {
            'Content-Type': proxyRes.headers.get('content-type') ?? 'application/json',
          })
          const responseBody = await proxyRes.arrayBuffer()
          res.end(Buffer.from(responseBody))
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          res.writeHead(502)
          res.end(`Proxy error: ${msg}`)
        }
      })
    },
  }
}

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  plugins: [
    llmProxyPlugin(),
    basicSsl(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Piano Buddy - 你的练琴伙伴',
        short_name: 'Piano Buddy',
        description: '帮你坚持每天练琴的 AI 伙伴',
        theme_color: '#1e293b',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
