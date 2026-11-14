import { useEffect, useState } from 'react'
import { api } from '../api'
import { PixelPreview } from '../components/PixelGrid'
import { StudioIcon } from '../components/StudioGraphics'

export default function Works({ mine = false, onEdit, onNew, onOpen }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    api(mine ? '/me/artworks' : '/artworks')
      .then(data => { if (active) setItems(data) })
      .catch(failure => { if (active) setError(failure.message) })
    return () => { active = false }
  }, [mine, attempt])

  async function remove(art) {
    if (!window.confirm(`‘${art.title}’ 작품을 삭제할까요?`)) return
    setRemoving(art.id)
    setError('')
    try {
      await api(`/artworks/${art.id}`, { method: 'DELETE' })
      setItems(previous => previous.filter(item => item.id !== art.id))
    } catch (failure) {
      setError(failure.message)
    } finally {
      setRemoving(null)
    }
  }

  const WorkTitle = mine ? 'h3' : 'h2'
  return (
    <section className={mine ? 'collection mine-collection' : 'collection public-collection'} aria-labelledby="collection-title">
      <div className="collection-heading">
        <div className="collection-label">
          {mine ? <h2 id="collection-title">내 작품</h2> : <h1 id="collection-title">공개 갤러리</h1>}
          {items && <span className="collection-count">{items.length}개</span>}
        </div>
        <button className="primary" onClick={onNew}><StudioIcon name={mine ? 'plus' : 'pencil'} />{mine ? '새 작품' : '픽셀 아트 그리기'}</button>
      </div>
      {error && <div className={items ? 'notice error' : 'collection-state'}>
        <p className="error" role="alert">{error}</p>
        {!items && <button onClick={() => { setError(''); setAttempt(attempt + 1) }}>다시 불러오기</button>}
      </div>}
      {!error && !items && <p role="status" className="collection-state muted">작품을 불러오는 중…</p>}
      {items?.length === 0 && <div className="collection-state">
        <span className="empty-icon"><StudioIcon name="gallery" /></span>
        <p>{mine ? '저장한 작품이 없어요.' : '아직 공개된 작품이 없어요.'}</p>
      </div>}
      {Boolean(items?.length) && (
        <ul className="works-grid">
          {items.map(art => (
            <li key={art.id} className="work-card">
              <a className="work-link" href={`/artworks/${art.id}`} aria-labelledby={`work-title-${art.id}`}
                onClick={event => onOpen(event, art.id, mine ? 'profile' : 'gallery')}>
                <div className="work-image"><PixelPreview pixels={art.pixel_data} /></div>
                <div className="work-info">
                  <WorkTitle className="work-title" id={`work-title-${art.id}`}>{art.title}</WorkTitle>
                  <p className="work-meta"><StudioIcon name={mine ? (art.is_public ? 'globe' : 'lock') : 'user'} />
                    {mine ? (art.is_public ? '공개' : '비공개') : art.nickname}</p>
                </div>
              </a>
              {mine && <div className="tool-row work-actions">
                <button onClick={() => onEdit(art)} disabled={removing !== null}><StudioIcon name="pencil" />수정</button>
                <button className="danger" onClick={() => remove(art)} disabled={removing !== null}><StudioIcon name="trash" />
                  {removing === art.id ? '삭제 중…' : '삭제'}
                </button>
              </div>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
