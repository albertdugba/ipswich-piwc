import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import handler from './dist/server/server.js'

const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '0.0.0.0'

const server = createServer(async (req, res) => {
  try {
    const url = `http://${req.headers.host ?? `${host}:${port}`}${req.url}`
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD'

    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: hasBody ? Readable.toWeb(req) : undefined,
      duplex: hasBody ? 'half' : undefined,
    })

    const response = await handler.fetch(request)

    const headers = Object.fromEntries(response.headers)
    const setCookies = response.headers.getSetCookie?.() ?? []
    if (setCookies.length) headers['set-cookie'] = setCookies
    res.writeHead(response.status, headers)

    if (response.body) {
      Readable.fromWeb(response.body).pipe(res)
    } else {
      res.end()
    }
  } catch (error) {
    console.error('Request failed:', error)
    res.statusCode = 500
    res.end('Internal Server Error')
  }
})

server.listen(port, host, () => {
  console.log(`Ipswich PIWC listening on http://${host}:${port}`)
})
