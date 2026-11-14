import { useEffect, useState } from 'react'
import { api } from '../api'
import { PixelPreview } from '../components/PixelGrid'
import { StudioIcon } from '../components/StudioGraphics'

export default function Artwork({ id, fromProfile, onBack, onEdit }) {
  const [art, setArt] = useState(null)
  const [error, setError] = useState('')
  const [copyMessage, setCopyMessage] = useState('')

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

  return (
    <article aria-label="작품 상세">
      <div className="artwork-navigation">
        <button className="text-button" onClick={() => onBack(backPage)}><StudioIcon name="arrow" />
          {backPage === 'profile' ? '내 작품으로' : '갤러리로'}
        </button>
      </div>
      {error && <p className="collection-state error" role="alert">{error}</p>}
      {!error && !art && <p className="collection-state muted" role="status">작품을 불러오는 중…</p>}
      {art && <div className="artwork-layout">
        <div className="panel display-stage artwork-display"><PixelPreview pixels={art.pixel_data} label={`${art.title} 픽셀 아트`} /></div>
        <section className="artwork-details" aria-labelledby="artwork-title">
          <h1 id="artwork-title">{art.title}</h1>
          <div className="artwork-byline">
            <p><StudioIcon name="user" />{art.nickname}</p>
            {art.can_edit && <p><StudioIcon name={art.is_public ? 'globe' : 'lock'} />{art.is_public ? '공개' : '비공개'}</p>}
          </div>
          {art.description && <div className="artwork-description"><h2>작품 소개</h2><p>{art.description}</p></div>}
          {(art.is_public || art.can_edit) && <div className="artwork-actions">
            {art.is_public && <button onClick={copyLink}>링크 복사</button>}
            {art.can_edit && <button onClick={() => onEdit(art)}><StudioIcon name="pencil" />작품 수정</button>}
          </div>}
          {copyMessage && <p className="muted" role="status">{copyMessage}</p>}
        </section>
      </div>}
    </article>
  )
}
