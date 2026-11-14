import { useEffect, useState } from 'react'
import { api } from './api'
import { emptyPixels, normalizePixels } from './pixels'
import Editor from './pages/Editor'
import { AuthForm, Profile } from './pages/Account'
import Works from './pages/Works'
import Publish from './pages/Publish'
import Artwork from './pages/Artwork'
import { StudioIcon } from './components/StudioGraphics'

const newDraft = () => ({ title: '', description: '', pixel_data: emptyPixels(), is_public: false })
const pages = new Map([
  ['/', 'gallery'], ['/editor', 'editor'], ['/publish', 'publish'],
  ['/profile', 'profile'], ['/login', 'login'], ['/register', 'register'],
])

function currentRoute() {
  const path = window.location.pathname
  const artwork = /^\/artworks\/([1-9]\d{0,9})\/?$/.exec(path)
  if (artwork) return { page: 'artwork', id: artwork[1], from: window.history.state?.from }
  return { page: pages.get(path.replace(/\/$/, '') || '/') ?? 'gallery' }
}

export default function App() {
  const [route, setRoute] = useState(currentRoute)
  const { page } = route
  const [user, setUser] = useState(null)
  const [draft, setDraft] = useState(newDraft)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    api('/me').then(data => { if (active) setUser(data) })
      .catch(failure => { if (active) setError(failure.message) })
      .finally(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    function onBackOrForward() {
      setRoute(currentRoute())
      setMessage('')
      setError('')
    }
    window.addEventListener('popstate', onBackOrForward)
    return () => window.removeEventListener('popstate', onBackOrForward)
  }, [])

  function goTo(path, notice = '', state = null, replace = false) {
    if (replace) window.history.replaceState(state, '', path)
    else if (window.location.pathname !== path) window.history.pushState(state, '', path)
    setRoute(currentRoute())
    setMessage(notice)
    setError('')
    window.scrollTo(0, 0)
  }

  function navigate(next, notice = '') {
    goTo(next === 'gallery' ? '/' : `/${next}`, notice)
  }

  function openEditor(art) {
    setDraft(art ? {
      id: art.id, title: art.title, description: art.description ?? '',
      pixel_data: normalizePixels(art.pixel_data), is_public: Boolean(art.is_public),
    } : newDraft())
    navigate('editor')
  }

  function openArtwork(event, id, from) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    goTo(`/artworks/${id}`, '', { from })
  }

  async function saveArtwork() {
    setSaving(true)
    const { id, title, description, pixel_data, is_public } = draft
    try {
      const result = await api(id ? `/artworks/${id}` : '/artworks', {
        method: id ? 'PATCH' : 'POST',
        body: { title, description, pixel_data, is_public },
      })
      setDraft(previous => previous === draft ? newDraft() : previous)
      if (currentRoute().page === 'publish') {
        const notice = id ? '변경사항을 저장했습니다.' : is_public ? '작품을 갤러리에 게시했습니다.' : '작품을 비공개로 저장했습니다.'
        goTo(`/artworks/${id ?? result.id}`, notice, { from: is_public ? 'gallery' : 'profile' }, true)
      }
    } finally {
      setSaving(false)
    }
  }

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' })
      setUser(null)
      setDraft(newDraft())
      navigate('gallery', '로그아웃했습니다.')
    } catch (failure) {
      setError(failure.message)
    }
  }

  return (
    <div className="studio-layout">
      <header className="site-header">
        <div className="site-header-inner">
          <button className="brand" type="button" onClick={() => navigate('gallery')}>
            <span className="brand-mark" aria-hidden="true" />Pixel Studio
          </button>
          <nav aria-label="주 메뉴">
            <button aria-current={page === 'gallery' || (page === 'artwork' && route.from !== 'profile') ? 'page' : undefined} onClick={() => navigate('gallery')}>
              <StudioIcon name="gallery" />갤러리
            </button>
            <button aria-current={page === 'editor' || page === 'publish' ? 'page' : undefined} onClick={() => navigate('editor')}>
              <StudioIcon name="pencil" />에디터
            </button>
            {user && <button aria-current={page === 'profile' || (page === 'artwork' && route.from === 'profile') ? 'page' : undefined} onClick={() => navigate('profile')}>
              <StudioIcon name="user" />마이페이지
            </button>}
          </nav>
          {ready && <div className="header-account">
            {user ? <>
              <div className="header-identity"><strong>{user.nickname}</strong></div>
              <button onClick={logout}><StudioIcon name="logout" />로그아웃</button>
            </> : <button aria-current={page === 'login' || page === 'register' ? 'page' : undefined}
              onClick={() => navigate('login')}><StudioIcon name="login" />로그인</button>}
          </div>}
        </div>
      </header>
      <main className="site-main">
        {message && <p className="notice" role="status">{message}</p>}
        {error && <p className="error notice" role="alert">{error}</p>}
        {page === 'gallery' && <Works onNew={() => navigate('editor')} onOpen={openArtwork} />}
        {page === 'editor' && <Editor draft={draft} setDraft={setDraft} busy={saving}
          onPublish={() => goTo('/publish', '', { from: 'editor' })} />}
        {page === 'publish' && <Publish draft={draft} setDraft={setDraft} user={user} ready={ready} busy={saving}
          onBack={() => window.history.state?.from === 'editor' ? window.history.back() : goTo('/editor', '', null, true)}
          onLogin={() => goTo('/login', '', { ...window.history.state, returnToPublish: true }, true)}
          onSave={saveArtwork} />}
        {page === 'artwork' && <Artwork key={route.id} id={route.id} fromProfile={route.from === 'profile' && Boolean(user)}
          onBack={navigate} onEdit={openEditor} />}
        {(page === 'login' || page === 'register') && <AuthForm key={page} register={page === 'register'}
          onSwitch={() => goTo(page === 'login' ? '/register' : '/login', '', window.history.state, true)}
          onRegistered={notice => goTo('/login', notice, window.history.state, true)}
          onLogin={account => {
            setUser(account)
            const { returnToPublish, from } = window.history.state ?? {}
            goTo(returnToPublish ? '/publish' : '/', '', returnToPublish ? { from } : null, true)
          }} />}
        {page === 'profile' && user && <>
          <div className="page-heading"><h1>마이페이지</h1><p>프로필을 수정하고 저장한 작품을 관리하세요.</p></div>
          <div className="profile-layout">
            <Works mine onEdit={openEditor} onNew={() => openEditor()} onOpen={openArtwork} />
            <Profile user={user} onUpdated={account => { setUser(account); setMessage('닉네임을 저장했습니다.') }}
              onDeleted={() => { setUser(null); setDraft(newDraft()); navigate('gallery', '회원 탈퇴가 완료됐습니다.') }} />
          </div>
        </>}
        {page === 'profile' && !user && ready && <section className="collection-state">
          <h1>마이페이지</h1><p className="muted">로그인하면 내 작품과 프로필을 볼 수 있어요.</p>
          <button className="primary" onClick={() => navigate('login')}>로그인</button>
        </section>}
      </main>
    </div>
  )
}
