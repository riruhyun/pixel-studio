import { useState } from 'react'
import ArtworkFigure from '../components/ArtworkFigure'
import { StudioIcon } from '../components/StudioGraphics'
import RequiredField from '../components/RequiredField'
import { useRequiredFields } from '../useRequiredFields'

const descriptionLimit = 1000

export default function Publish({ draft, setDraft, user, ready, busy, onBack, onLogin, onSave }) {
  const [error, setError] = useState('')
  const { invalidField, validate, clearFieldError } = useRequiredFields()

  async function submit(event) {
    event.preventDefault()
    if (busy || !ready) return
    setError('')
    if (!validate(event.currentTarget)) return
    if (!user) return onLogin()
    try {
      await onSave()
    } catch (failure) {
      setError(failure.message)
    }
  }

  const action = draft.id ? '변경사항 저장' : draft.is_public ? '갤러리에 게시' : '비공개로 저장'

  return (
    <>
      <header className="page-heading editor-heading">
        <h1>{draft.id ? '수정 내용 확인' : '작품 게시'}</h1>
        <button type="button" onClick={onBack} disabled={busy}><StudioIcon name="pencil" />계속 그리기</button>
      </header>
      <div className="artwork-layout">
        <ArtworkFigure pixels={draft.pixel_data} title={draft.title.trim() || '제목 없음'} author={user?.nickname} />
        <form className="form-stack artwork-form" aria-label="작품 정보" noValidate onSubmit={submit} onInput={clearFieldError}>
          <RequiredField label="제목" name="title" value={draft.title} maxLength={100} disabled={busy}
            invalid={invalidField === 'title'} message="작품 제목을 입력해 주세요."
            onChange={event => { const title = event.target.value; setDraft(previous => ({ ...previous, title })) }} />
          <label htmlFor="artwork-description">
            <span className="field-caption">작품 설명 <span className="muted">선택</span></span>
            <textarea id="artwork-description"
              value={draft.description} rows={5} maxLength={descriptionLimit} disabled={busy} aria-describedby="description-count"
              onChange={event => { const description = event.target.value; setDraft(previous => ({ ...previous, description })) }} />
            <small className="field-count" id="description-count">{draft.description.length} / {descriptionLimit}자</small>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={draft.is_public} disabled={busy}
              aria-labelledby="visibility-label" aria-describedby="visibility-help"
              onChange={event => { const is_public = event.target.checked; setDraft(previous => ({ ...previous, is_public })) }} />
            <span><span id="visibility-label">갤러리에 공개</span>
              <small id="visibility-help">{draft.is_public ? '갤러리와 작품 링크로 누구나 볼 수 있어요.' : '마이페이지에서 나만 볼 수 있어요.'}</small>
            </span>
          </label>
          {ready && !user && <p className="muted">로그인하면 입력한 내용이 유지돼요.</p>}
          {error && <p role="alert" className="error">{error}</p>}
          <button className="primary" disabled={!ready || busy}><StudioIcon name={user && draft.is_public ? 'globe' : 'save'} />
            {busy ? '저장 중…' : user ? action : '로그인하고 계속'}
          </button>
        </form>
      </div>
    </>
  )
}
