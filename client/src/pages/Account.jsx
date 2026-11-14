import { useState } from 'react'
import { api } from '../api'
import { StudioIcon } from '../components/StudioGraphics'
import RequiredField from '../components/RequiredField'
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
      <form className="panel form-stack auth-form" noValidate onSubmit={submit} onInput={clearFieldError}>
        <header className="page-heading"><h1 id="auth-title">{title}</h1><p>{register ? '계정을 만들어 작품을 저장하고 공유하세요.' : '로그인해서 작품을 저장하고 관리하세요.'}</p></header>
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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { invalidField, validate, clearFieldError } = useRequiredFields()

  async function update(event) {
    event.preventDefault()
    if (busy) return
    setError('')
    if (!validate(event.currentTarget)) return
    const nickname = new FormData(event.currentTarget).get('nickname')
    setBusy(true)
    try {
      onUpdated(await api('/me', { method: 'PATCH', body: { nickname } }))
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
    <section className="panel profile" aria-labelledby="profile-title">
      <div className="profile-heading"><span className="account-avatar"><StudioIcon name="user" /></span><h2 id="profile-title">프로필</h2></div>
      <form className="form-stack" noValidate onSubmit={update} onInput={clearFieldError}>
        <div className="profile-username"><span>아이디</span><strong>{user.username}</strong></div>
        <RequiredField label="닉네임" name="nickname" defaultValue={user.nickname} maxLength={30}
          invalid={invalidField === 'nickname'} message="닉네임을 입력해 주세요." />
        {error && <p className="error" role="alert">{error}</p>}
        <button disabled={busy}>닉네임 저장</button>
      </form>
      <div className="profile-footer"><button className="text-button danger" type="button" onClick={remove} disabled={busy}>회원 탈퇴</button></div>
    </section>
  )
}
