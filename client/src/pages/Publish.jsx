import { useState } from 'react'
import { PixelPreview } from '../components/PixelGrid'
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
        <div><h1>{draft.id ? '수정 내용 확인' : '작품 게시'}</h1>
          <p>전시될 모습을 확인하고 작품을 소개해 보세요.</p></div>
        <button type="button" onClick={onBack} disabled={busy}><StudioIcon name="pencil" />계속 그리기</button>
      </header>
      <div className="artwork-layout">
        <section className="panel canvas-panel" aria-labelledby="preview-title">
          <div className="canvas-caption"><h2 id="preview-title">전시 미리보기</h2><span>16 × 16</span></div>
          <div className="display-stage"><PixelPreview pixels={draft.pixel_data} label="작품의 전시 미리보기" /></div>
        </section>
        <form className="panel form-stack artwork-form" noValidate onSubmit={submit} onInput={clearFieldError}>
          <h2>작품 정보</h2>
          <RequiredField label="제목" name="title" value={draft.title} maxLength={100} disabled={busy}
            invalid={invalidField === 'title'} message="작품 제목을 입력해 주세요."
            onChange={event => { const title = event.target.value; setDraft(previous => ({ ...previous, title })) }} />
          <label htmlFor="artwork-description">
            <span className="field-caption">작품 설명 <span className="muted">선택</span></span>
            <textarea id="artwork-description" placeholder="무엇을 그렸는지, 어떤 이야기가 담겼는지 알려주세요."
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
