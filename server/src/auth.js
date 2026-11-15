import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Router } from 'express'
import { db } from './db.js'

export const auth = Router()
const profileColumns = "id, username, nickname, DATE_FORMAT(created_at, '%Y-%m-%d') AS created_date"
const cookieName = 'pixel_session'
const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}
const clean = value => typeof value === 'string' ? value.trim() : ''
const validPassword = password => typeof password === 'string' && password.length > 0
const deriveKey = promisify(scrypt)
const scryptOptions = { N: 2 ** 15, r: 8, p: 3, maxmem: 48 * 1024 * 1024 }

async function hashPassword(password) {
  const salt = randomBytes(16)
  const key = await deriveKey(password, salt, 32, scryptOptions)
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`
}

async function verifyPassword(password, hash) {
  if (/^\$2[ab]\$/.test(hash)) {
    // bcrypt ignores bytes after the first 72 in legacy hashes.
    return Buffer.byteLength(password, 'utf8') <= 72 && bcrypt.compare(password, hash)
  }

  const match = /^scrypt\$([0-9a-f]{32})\$([0-9a-f]{64})$/.exec(hash)
  if (!match) return false
  const [, salt, storedKey] = match
  const key = await deriveKey(password, Buffer.from(salt, 'hex'), 32, scryptOptions)
  return timingSafeEqual(key, Buffer.from(storedKey, 'hex'))
}

export async function identify(req, res, next) {
  const token = req.cookies[cookieName]
  if (!token) return next()

  let session
  try {
    session = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
  } catch {
    res.clearCookie(cookieName, cookieOptions)
    return next()
  }

  const [users] = await db.execute(`SELECT ${profileColumns} FROM users WHERE id = ?`, [session.id])
  req.user = users[0]
  if (!req.user) res.clearCookie(cookieName, cookieOptions)
  next()
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ message: '로그인이 필요합니다.' })
  next()
}

auth.post('/auth/register', async (req, res) => {
  const username = clean(req.body?.username)
  const nickname = clean(req.body?.nickname)
  const password = req.body?.password

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username) || !nickname || nickname.length > 30) {
    return res.status(400).json({ message: '아이디는 영문·숫자·밑줄 3~30자, 닉네임은 1~30자여야 합니다.' })
  }
  if (!validPassword(password)) return res.status(400).json({ message: '비밀번호를 입력해 주세요.' })

  const hash = await hashPassword(password)
  try {
    await db.execute('INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)', [username, hash, nickname])
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: '이미 사용 중인 아이디입니다.' })
    throw error
  }
  res.status(201).json({ message: '가입했습니다. 로그인해 주세요.' })
})

auth.post('/auth/login', async (req, res) => {
  const username = clean(req.body?.username)
  const password = req.body?.password
  const [users] = await db.execute(`SELECT ${profileColumns}, password FROM users WHERE username = ?`, [username])
  const user = users[0]

  if (!user || !validPassword(password) || !await verifyPassword(password, user.password)) {
    return res.status(401).json({ message: '아이디 또는 비밀번호를 확인해 주세요.' })
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '8h' })
  res.cookie(cookieName, token, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 })
  res.json({ id: user.id, username: user.username, nickname: user.nickname, created_date: user.created_date })
})

auth.post('/auth/logout', (req, res) => {
  res.clearCookie(cookieName, cookieOptions).status(204).end()
})

auth.get('/me', (req, res) => res.json(req.user ?? null))

auth.patch('/me', requireUser, async (req, res) => {
  const nickname = clean(req.body?.nickname)
  if (!nickname || nickname.length > 30) return res.status(400).json({ message: '닉네임은 1~30자로 입력해 주세요.' })

  await db.execute('UPDATE users SET nickname = ? WHERE id = ?', [nickname, req.user.id])
  res.json({ ...req.user, nickname })
})

auth.delete('/me', requireUser, async (req, res) => {
  await db.execute('DELETE FROM users WHERE id = ?', [req.user.id])
  res.clearCookie(cookieName, cookieOptions).status(204).end()
})
