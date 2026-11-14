import express from 'express'
import cookieParser from 'cookie-parser'
import { auth, identify } from './auth.js'
import { artworks } from './artworks.js'
import { db } from './db.js'

if (!process.env.JWT_SECRET) throw new Error('server/.env에 JWT_SECRET을 지정하세요.')

const app = express()
app.use('/api', express.json({ limit: '16kb' }), cookieParser(), identify, auth, artworks)
app.use('/api', (req, res) => res.status(404).json({ message: '요청 경로를 찾을 수 없습니다.' }))
app.use('/api', (error, req, res, next) => {
  if (res.headersSent) return next(error)
  if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'JSON 형식을 확인해 주세요.' })
  if (error.type === 'entity.too.large') return res.status(413).json({ message: '요청 데이터가 너무 큽니다.' })
  console.error(error.code || error.name)
  res.status(500).json({ message: '서버에서 요청을 처리하지 못했습니다.' })
})

try {
  await db.query('SELECT 1')
} catch (error) {
  console.error('MySQL 연결 실패:', error.code || error.name)
  process.exit(1)
}

const port = Number(process.env.PORT || 5000)
app.listen(port, '127.0.0.1', () => console.log(`Pixel Studio API: http://127.0.0.1:${port}`))
