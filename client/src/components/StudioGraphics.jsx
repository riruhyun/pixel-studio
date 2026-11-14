const icons = {
  gallery: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="9" r="1.5" /><path d="m3 16 4-4 4 4 4-5 6 6" /></>,
  pencil: <><path d="m13.5 6.5 4 4M4 20l4.5-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20Z" /></>,
  user: <><circle cx="12" cy="8" r="3" /><path d="M5 20v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" /></>,
  login: <><path d="M12 4h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6M4 12h11m-4-4 4 4-4 4" /></>,
  logout: <><path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5m-1-8h10m-4-4 4 4-4 4" /></>,
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  eraser: <><path d="m7 20-4-4a2 2 0 0 1 0-3l9-9a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-8 8H7Zm0-11 8 8m-4 3h10" /></>,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
  globe: <><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4a13 13 0 0 1 0 16 13 13 0 0 1 0-16Z" /></>,
  save: <><path d="M5 4h12l3 3v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" /><path d="M8 4v5h8V4M8 20v-7h8v7" /></>,
  trash: <><path d="M4 7h16m-14 0 1 13h10l1-13M9 7V4h6v3m-5 4v5m4-5v5" /></>,
}

export function StudioIcon({ name }) {
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>
}

