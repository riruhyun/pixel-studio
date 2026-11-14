import { useState } from 'react'
import { emptyPixels } from '../pixels'
import PixelGrid from '../components/PixelGrid'
import { StudioIcon } from '../components/StudioGraphics'

const palette = [
  ['먹색', '#24352f'], ['흰색', '#ffffff'], ['보라', '#704be6'],
  ['빨강', '#db5b58'], ['노랑', '#efae47'], ['초록', '#3d9566'], ['파랑', '#397ac4'],
]

export default function Editor({ draft, setDraft, busy, onPublish }) {
  const [color, setColor] = useState(palette[0][1])
  const [erasing, setErasing] = useState(false)

  function paint(indexes) {
    if (busy) return
    setDraft(previous => {
      const pixel_data = [...previous.pixel_data]
      for (const index of indexes) pixel_data[index] = erasing ? null : color
      return { ...previous, pixel_data }
    })
  }

  function clearCanvas() {
    if (!window.confirm('캔버스에 그린 내용을 모두 지울까요?')) return
    setDraft(previous => ({ ...previous, pixel_data: emptyPixels() }))
  }

  return (
    <>
      <header className="page-heading editor-heading">
        <div><h1>{draft.id ? '작품 수정' : '픽셀 에디터'}</h1>
          <p>팔레트에서 색을 골라 16×16 캔버스에 그려보세요.</p></div>
        <button className="primary" onClick={onPublish} disabled={busy}>{draft.id ? '수정 내용 확인' : '게시 준비'}</button>
      </header>
      <div className="editor-layout">
        <section className="panel palette-panel" aria-labelledby="palette-title">
          <h2 id="palette-title">색상과 도구</h2>
          <div className="swatches">
            {palette.map(([name, value]) => (
              <button key={value} type="button" className="swatch" aria-label={`${name} (${value})`} title={name}
                aria-pressed={!erasing && color === value} style={{ '--swatch': value }}
                onClick={() => { setColor(value); setErasing(false) }} />
            ))}
          </div>
          <label className="color-picker">
            <input type="color" value={color} onClick={() => setErasing(false)}
              onChange={event => { setColor(event.target.value); setErasing(false) }} />
            사용자 지정 색상
          </label>
          <div className="palette-actions">
            <button type="button" aria-pressed={erasing} onClick={() => setErasing(!erasing)}><StudioIcon name="eraser" />지우개</button>
            <button className="danger" type="button" disabled={busy || !draft.pixel_data.some(Boolean)} onClick={clearCanvas}>
              <StudioIcon name="trash" />전체 지우기
            </button>
          </div>
        </section>
        <section className="panel canvas-panel" aria-labelledby="canvas-title">
          <div className="canvas-caption"><h2 id="canvas-title">캔버스</h2><span>16 × 16</span></div>
          <div className="canvas-stage"><PixelGrid pixels={draft.pixel_data} onPaint={paint} /></div>
          <p className="canvas-help">클릭하거나 드래그해서 칠하세요. 키보드로는 방향키로 이동하고 스페이스바로 칠할 수 있어요.</p>
        </section>
      </div>
    </>
  )
}
