import { useEffect, useState } from 'react'
import { api } from '../api'
import ArtworkFigure from '../components/ArtworkFigure'
import { StudioIcon } from '../components/StudioGraphics'

export default function Artwork({ id, fromProfile, onBack, onEdit, onDeleted }) {
  const [art, setArt] = useState(null)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState(false)
  const [copyMessage, setCopyMessage] = useState('')
  const [showTransparency, setShowTransparency] = useState(false)

  useEffect(() => {
    let active = true
    api(`/artworks/${id}`)
      .then(data => { if (active) setArt(data) })
      .catch(failure => { if (active) setError(failure.message) })
    return () => { active = false }
  }, [id])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyMessage('작품 링크를 복사했어요.')
    } catch {
      setCopyMessage('주소창에서 작품 링크를 복사해 주세요.')
    }
  }

  const backPage = fromProfile || (art && !art.is_public) ? 'profile' : 'gallery'
  const hasCreatedDate = Number.isFinite(Date.parse(art?.created_date))
  const visibility = art?.is_public ? '공개 작품' : '비공개 작품'

  async function remove() {
    if (!window.confirm(`‘${art.title}’ 작품을 삭제할까요?`)) return
    setRemoving(true)
    setError('')
    try {
      await api(`/artworks/${id}`, { method: 'DELETE' })
      onDeleted(backPage)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <article className="artwork-page" aria-label="작품 상세">
      <div className="artwork-navigation">
        <button className="text-button" onClick={() => onBack(backPage)}><StudioIcon name="arrow" />
          {backPage === 'profile' ? '내 작품으로' : '갤러리로'}
        </button>
        {art && <button className="artwork-grid-toggle" type="button" aria-label="투명 격자" title="투명 격자"
          aria-pressed={showTransparency} onClick={() => setShowTransparency(previous => !previous)}>
          <StudioIcon name="checkerboard" />
        </button>}
      </div>
      {error && !art && <p className="collection-state error" role="alert">{error}</p>}
      {!error && !art && <p className="collection-state muted" role="status">작품을 불러오는 중…</p>}
      {art && <>
        <ArtworkFigure pixels={art.pixel_data} title={art.title} showTransparency={showTransparency}>
          <div className="artwork-title-row">
            <h1>
              {art.title}
              <span className="artwork-visibility" role="img" aria-label={visibility} title={visibility}>
                <StudioIcon name={art.is_public ? 'globe' : 'lock'} />
              </span>
            </h1>
            {art.can_edit && <div className="artwork-actions">
              <button className="artwork-edit" type="button" aria-label="작품 수정" onClick={() => onEdit(art)} disabled={removing}>
                <StudioIcon name="pencil" />수정
              </button>
              <button className="danger" type="button" onClick={remove} disabled={removing}>
                <StudioIcon name="trash" />
                {removing ? '삭제 중…' : '삭제'}
              </button>
            </div>}
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          {art.description && <p className="artwork-description">{art.description}</p>}
          <dl className="artwork-metadata">
            <div><dt>작가:</dt><dd>{art.nickname}</dd></div>
            {hasCreatedDate && <div><dt>날짜:</dt><dd><time dateTime={art.created_date}>{art.created_date}</time></dd></div>}
          </dl>
        </ArtworkFigure>
        {art.is_public && <div className="artwork-share">
          <button className="text-button" type="button" onClick={copyLink}>링크 복사</button>
          {copyMessage && <p className="muted" role="status">{copyMessage}</p>}
        </div>}
      </>}
    </article>
  )
}
