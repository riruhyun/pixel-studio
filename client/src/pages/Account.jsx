import { useState } from 'react'
import { api } from '../api'
import RequiredField from '../components/RequiredField'
import { StudioIcon } from '../components/StudioGraphics'
import { useRequiredFields } from '../useRequiredFields'

export function AuthForm({ register, onLogin, onRegistered, onSwitch }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { invalidField, validate, clearFieldError } = useRequiredFields()

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setError('')
    if (!validate(event.currentTarget)) return
    const body = Object.fromEntries(new FormData(event.currentTarget))
    setBusy(true)
    try {
      const data = await api(register ? '/auth/register' : '/auth/login', { method: 'POST', body })
      if (register) onRegistered(data.message)
      else onLogin(data)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  const title = register ? '회원가입' : '로그인'
  return (
    <section className="auth-layout" aria-labelledby="auth-title">
      <form className="form-stack auth-form" noValidate onSubmit={submit} onInput={clearFieldError}>
        <h1 id="auth-title">{title}</h1>
        <RequiredField label="아이디" name="username" autoComplete="username" maxLength={30}
          invalid={invalidField === 'username'} message="아이디를 입력해 주세요." />
        {register && <RequiredField label="닉네임" name="nickname" autoComplete="nickname" maxLength={30}
          invalid={invalidField === 'nickname'} message="닉네임을 입력해 주세요." />}
        <RequiredField label="비밀번호" name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'}
          invalid={invalidField === 'password'} message="비밀번호를 입력해 주세요." />
        {register && <p className="muted">아이디는 영문·숫자·밑줄 3~30자입니다.</p>}
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? '처리 중…' : title}</button>
        <div className="auth-switch">
          <span>{register ? '이미 계정이 있나요?' : 'Pixel Studio가 처음인가요?'}</span>
          <button className="text-button" type="button" disabled={busy} onClick={onSwitch}>{register ? '로그인' : '회원가입'}</button>
        </div>
      </form>
    </section>
  )
}

export function Profile({ user, onUpdated, onDeleted }) {
  const [editingNickname, setEditingNickname] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { invalidField, validate, clearFieldError } = useRequiredFields()

  async function update(event) {
    event.preventDefault()
    if (busy) return
    setError('')
    if (!editingNickname) {
      setEditingNickname(true)
      return
    }
    if (!validate(event.currentTarget)) return
    const nickname = new FormData(event.currentTarget).get('nickname')
    setBusy(true)
    try {
      onUpdated(await api('/me', { method: 'PATCH', body: { nickname } }))
      setEditingNickname(false)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!window.confirm('탈퇴하면 계정과 저장한 모든 작품이 삭제됩니다. 탈퇴할까요?')) return
    setBusy(true)
    setError('')
    try {
      await api('/me', { method: 'DELETE' })
      onDeleted()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="profile" aria-labelledby="profile-title">
      <h1 id="profile-title">프로필</h1>
      <dl className="profile-metadata">
        <div><dt>아이디</dt><dd>{user.username}</dd></div>
        <div>
          <dt id="profile-nickname-label">닉네임</dt>
          <dd>
            <form className="form-stack profile-nickname-row" noValidate onSubmit={update} onInput={clearFieldError}>
              {editingNickname
                ? <RequiredField name="nickname" autoComplete="nickname" defaultValue={user.nickname}
                    autoFocus aria-labelledby="profile-nickname-label" maxLength={30}
                    invalid={invalidField === 'nickname'} message="닉네임을 입력해 주세요." />
                : <span>{user.nickname}</span>}
              <button className={editingNickname ? 'primary' : undefined} disabled={busy}>
                {editingNickname ? '변경하기' : '닉네임 수정'}
              </button>
            </form>
          </dd>
        </div>
        {Number.isFinite(Date.parse(user.created_date)) && <div>
          <dt>가입일</dt><dd><time dateTime={user.created_date}>{user.created_date}</time></dd>
        </div>}
      </dl>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="profile-footer">
        <button className="text-button danger" type="button" onClick={remove} disabled={busy}>
          <StudioIcon name="userMinus" /> 회원 탈퇴
        </button>
      </div>
    </section>
  )
}
