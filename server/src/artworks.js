import { Router } from 'express'
import { db } from './db.js'
import { requireUser } from './auth.js'

export const artworks = Router()

artworks.param('id', (req, res, next, id) => {
  if (!/^[1-9]\d{0,9}$/.test(id) || Number(id) > 4294967295) {
    return res.status(404).json({ message: '작품을 찾을 수 없습니다.' })
  }
  next()
})

function artworkData(body) {
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const description = typeof body?.description === 'string' ? body.description.trim() : null
  const pixels = body?.pixel_data
  if (!title || title.length > 100 || typeof body?.is_public !== 'boolean'
      || (body.description !== undefined && (description === null || description.length > 1000))
      || !Array.isArray(pixels) || pixels.length !== 256
      || !pixels.every(pixel => pixel === null || typeof pixel === 'string' && /^#[0-9a-f]{6}$/i.test(pixel))) {
    return null
  }
  return { title, description, pixels: JSON.stringify(pixels), isPublic: body.is_public }
}

artworks.get('/artworks', async (req, res) => {
  const [rows] = await db.execute(`
    SELECT a.id, a.title, a.pixel_data, u.nickname
    FROM artworks a JOIN users u ON a.user_id = u.id
    WHERE a.is_public = TRUE
    ORDER BY a.created_at DESC, a.id DESC
  `)
  res.json(rows)
})

artworks.get('/me/artworks', requireUser, async (req, res) => {
  const [rows] = await db.execute(`
    SELECT id, title, description, pixel_data, is_public
    FROM artworks WHERE user_id = ?
    ORDER BY updated_at DESC, id DESC
  `, [req.user.id])
  res.json(rows)
})

artworks.get('/artworks/:id', async (req, res) => {
  const viewer = req.user?.id ?? null
  const [rows] = await db.execute(`
    SELECT a.id, a.title, a.description, a.pixel_data, a.is_public, u.nickname,
      (a.user_id = ?) AS can_edit
    FROM artworks a JOIN users u ON a.user_id = u.id
    WHERE a.id = ? AND (a.is_public = TRUE OR a.user_id = ?)
  `, [viewer, req.params.id, viewer])

  res.set('Cache-Control', 'private, no-store')
  if (!rows.length) return res.status(404).json({ message: '작품을 찾을 수 없습니다.' })
  res.json({ ...rows[0], can_edit: Boolean(rows[0].can_edit) })
})

artworks.post('/artworks', requireUser, async (req, res) => {
  const data = artworkData(req.body)
  if (!data) return res.status(400).json({ message: '제목, 작품 설명, 공개 여부와 픽셀 데이터를 확인해 주세요.' })
  const { title, description, pixels, isPublic } = data

  const [result] = await db.execute(
    'INSERT INTO artworks (title, description, pixel_data, is_public, user_id) VALUES (?, ?, ?, ?, ?)',
    [title, description ?? '', pixels, isPublic, req.user.id],
  )
  res.status(201).json({ id: result.insertId })
})

artworks.patch('/artworks/:id', requireUser, async (req, res) => {
  const data = artworkData(req.body)
  if (!data) return res.status(400).json({ message: '제목, 작품 설명, 공개 여부와 픽셀 데이터를 확인해 주세요.' })
  const { title, description, pixels, isPublic } = data

  const [result] = await db.execute(
    'UPDATE artworks SET title = ?, description = COALESCE(?, description), pixel_data = ?, is_public = ? WHERE id = ? AND user_id = ?',
    [title, description, pixels, isPublic, req.params.id, req.user.id],
  )
  if (!result.affectedRows) return res.status(404).json({ message: '작품을 찾을 수 없습니다.' })
  res.status(204).end()
})

artworks.delete('/artworks/:id', requireUser, async (req, res) => {
  const [result] = await db.execute(
    'DELETE FROM artworks WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
  )
  if (!result.affectedRows) return res.status(404).json({ message: '작품을 찾을 수 없습니다.' })
  res.status(204).end()
})
