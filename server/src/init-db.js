import { readFile } from 'node:fs/promises'
import mysql from 'mysql2/promise'
import { dbConfig } from './db.js'

const { database, ...connectionOptions } = dbConfig
if (!database) throw new Error('server/.env에 DB_NAME을 지정하세요.')

const connection = await mysql.createConnection({
  ...connectionOptions,
  multipleStatements: true,
})

try {
  await connection.query('CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4', [database])
  await connection.changeUser({ database })
  const schema = await readFile(new URL('../sql/schema.sql', import.meta.url), 'utf8')
  await connection.query(schema)
  const [columns] = await connection.query("SHOW COLUMNS FROM artworks LIKE 'description'")
  if (columns.length === 0) {
    try {
      await connection.query("ALTER TABLE artworks ADD COLUMN description VARCHAR(1000) NOT NULL DEFAULT '' AFTER title")
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') throw error
    }
  }
  console.log('Pixel Studio 테이블 준비 완료')
} finally {
  await connection.end()
}
