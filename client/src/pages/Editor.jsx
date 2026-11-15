import { useCallback, useEffect, useState } from 'react'
import { emptyPixels, SIZE } from '../pixels'
import PixelGrid from '../components/PixelGrid'
import { StudioIcon } from '../components/StudioGraphics'

const defaultColor = '#24352f'
const palette = [
  ['빨강', '#db5b58'], ['주황', '#e97832'], ['노랑', '#efae47'], ['초록', '#3d9566'],
  ['파랑', '#397ac4'], ['남색', '#303a80'], ['보라', '#704be6'], ['분홍', '#e98ab3'],
  ['갈색', '#835336'], ['먹색', defaultColor], ['흰색', '#ffffff'],
]

const tools = [
  ['pencil', '연필'], ['eraser', '지우개'], ['fill', '채우기'], ['eyedropper', '스포이트'],
]
const historyLimit = 100
const pixelColor = color => color?.toLowerCase() ?? null

function fillRegion(pixels, start, color) {
  const target = pixelColor(pixels[start])
  if (target === color) return pixels

  const next = [...pixels]
  const pending = []

  function visit(index) {
    if (pixelColor(next[index]) !== target) return
    next[index] = color
    pending.push(index)
  }

  visit(start)
  while (pending.length) {
    const index = pending.pop()
    const column = index % SIZE
    if (column > 0) visit(index - 1)
    if (column < SIZE - 1) visit(index + 1)
    if (index >= SIZE) visit(index - SIZE)
    if (index < pixels.length - SIZE) visit(index + SIZE)
  }
  return next
}

function recordPixels(draft, pixels, stroke = null) {
  if (pixels === draft.pixel_data) return draft
  const { past, stroke: previousStroke } = draft.history
  return {
    ...draft, pixel_data: pixels,
    history: {
      past: stroke && stroke === previousStroke ? past : [...past.slice(1 - historyLimit), draft.pixel_data],
      future: [],
      stroke,
    },
  }
}

function stepHistory(draft, direction) {
  const { past, future } = draft.history
  const undoing = direction === 'undo'
  const pixels = (undoing ? past : future).at(-1)
  if (!pixels) return draft

  return {
    ...draft, pixel_data: pixels,
    history: {
      past: undoing ? past.slice(0, -1) : [...past, draft.pixel_data],
      future: undoing ? [...future, draft.pixel_data] : future.slice(0, -1),
      stroke: null,
    },
  }
}

export default function Editor({ draft, setDraft, busy, onPublish }) {
  const [color, setColor] = useState(defaultColor)
  const [tool, setTool] = useState('pencil')
  const [mirror, setMirror] = useState(false)
  const drawing = tool === 'pencil' || tool === 'eraser'
  const { past, future } = draft.history

  const changeHistory = useCallback(direction => {
    if (!busy) setDraft(previous => stepHistory(previous, direction))
  }, [busy, setDraft])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.defaultPrevented || event.isComposing || event.altKey || !(event.ctrlKey || event.metaKey)) return
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || event.target.closest('input, textarea, select'))) return

      const key = event.key.toLowerCase()
      if (key !== 'z' && key !== 'y') return
      event.preventDefault()
      changeHistory(key === 'y' || event.shiftKey ? 'redo' : 'undo')
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [changeHistory])

  function selectColor(value) {
    setColor(value)
    if (tool !== 'fill') setTool('pencil')
  }

  function paint(indexes, stroke) {
    if (busy) return
    if (tool === 'eyedropper') {
      const picked = pixelColor(draft.pixel_data[indexes[0]])
      if (picked !== null) selectColor(picked)
      return
    }

    setDraft(previous => {
      const pixels = previous.pixel_data
      if (tool === 'fill') return recordPixels(previous, fillRegion(pixels, indexes[0], color))

      const next = [...pixels]
      const paintColor = tool === 'eraser' ? null : color
      let changed = false

      function paintPixel(index) {
        if (pixelColor(next[index]) === paintColor) return
        next[index] = paintColor
        changed = true
      }

      for (const index of indexes) {
        paintPixel(index)
        if (mirror) {
          const column = index % SIZE
          paintPixel(index - column + SIZE - 1 - column)
        }
      }
      return changed ? recordPixels(previous, next, stroke) : previous
    })
  }

  function clearCanvas() {
    if (!window.confirm('캔버스에 그린 내용을 모두 지울까요?')) return
    setDraft(previous => recordPixels(previous, emptyPixels()))
  }

  return (
    <div className="editor-workspace">
      <header className="page-heading editor-heading">
        <h1>{draft.id ? '작품 수정' : '픽셀 에디터'}</h1>
        <button className="primary" onClick={onPublish} disabled={busy}>{draft.id ? '수정 내용 확인' : '게시 준비'}</button>
      </header>
      <section className="editor-workbench" aria-label="캔버스와 도구">
        <div className="editor-tools">
          <div className="editor-tool-group" role="group" aria-labelledby="editor-tool-label">
            <h2 id="editor-tool-label" className="editor-group-label">도구</h2>
            <div className="editor-tool-list">
              {tools.map(([name, label]) => (
                <button key={name} type="button" disabled={busy} aria-pressed={tool === name} onClick={() => setTool(name)}>
                  <StudioIcon name={name} />{label}
                </button>
              ))}
              <button type="button" disabled={busy} aria-pressed={mirror}
                aria-label="좌우 대칭" title="연필과 지우개를 좌우 대칭으로 사용" onClick={() => setMirror(!mirror)}>
                <StudioIcon name="mirror" />대칭
              </button>
            </div>
          </div>
          <div className="editor-palette" role="group" aria-labelledby="editor-palette-label">
            <h2 id="editor-palette-label" className="editor-group-label">색상</h2>
            <div className="swatches">
              {palette.map(([name, value]) => (
                <button key={value} type="button" className="swatch" aria-label={`${name} (${value})`} title={name}
                  disabled={busy} aria-pressed={tool !== 'eraser' && color === value} style={{ '--swatch': value }}
                  onClick={() => selectColor(value)} />
              ))}
              <label className="color-picker" style={{ '--swatch': color }} title="직접 색상 선택">
                <StudioIcon name="plus" />
                <input type="color" value={color} disabled={busy}
                  aria-label="직접 색상 선택" onChange={event => selectColor(event.target.value)} />
              </label>
            </div>
          </div>
        </div>
        <div className="editor-history">
          <div className="editor-history-actions" role="group" aria-label="편집 내역">
            <button type="button" disabled={busy || past.length === 0}
              title="실행 취소 (Ctrl/⌘ + Z)" aria-keyshortcuts="Control+Z Meta+Z"
              onClick={() => changeHistory('undo')}><StudioIcon name="undo" />실행 취소</button>
            <button type="button" disabled={busy || future.length === 0}
              title="다시 실행 (Ctrl/⌘ + Shift + Z)" aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y"
              onClick={() => changeHistory('redo')}><StudioIcon name="redo" />다시 실행</button>
          </div>
          <button className="danger" type="button" disabled={busy || !draft.pixel_data.some(Boolean)} onClick={clearCanvas}>
            <StudioIcon name="trash" />전체 지우기
          </button>
        </div>
        <div className="canvas-stage">
          <PixelGrid pixels={draft.pixel_data} onPaint={paint} drag={drawing} mirror={mirror && drawing} busy={busy} />
        </div>
      </section>
    </div>
  )
}
