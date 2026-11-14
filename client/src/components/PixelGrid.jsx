import { useEffect, useRef, useState } from 'react'
import { normalizePixels, SIZE } from '../pixels'

export function PixelPreview({ pixels, label }) {
  const canvas = useRef(null)

  useEffect(() => {
    const context = canvas.current.getContext('2d')
    context.clearRect(0, 0, SIZE, SIZE)
    normalizePixels(pixels).forEach((color, index) => {
      if (!color) return
      context.fillStyle = color
      context.fillRect(index % SIZE, Math.floor(index / SIZE), 1, 1)
    })
  }, [pixels])

  return (
    <div className="pixel-preview">
      <canvas ref={canvas} width={SIZE} height={SIZE}
        role={label ? 'img' : undefined} aria-label={label} aria-hidden={!label} />
    </div>
  )
}

export default function PixelGrid({ pixels, onPaint }) {
  const stroke = useRef(null)
  const [active, setActive] = useState(0)

  function position(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.floor((event.clientX - rect.left) / rect.width * SIZE)
    const y = Math.floor((event.clientY - rect.top) / rect.height * SIZE)
    return x >= 0 && x < SIZE && y >= 0 && y < SIZE ? { x, y } : null
  }

  function begin(event) {
    if (event.button !== 0 || !event.isPrimary) return
    const point = position(event)
    if (!point) return
    event.currentTarget.setPointerCapture(event.pointerId)
    stroke.current = { id: event.pointerId, point }
    onPaint([point.y * SIZE + point.x])
  }

  function move(event) {
    if (stroke.current?.id !== event.pointerId) return
    const point = position(event)
    const previous = stroke.current.point
    stroke.current.point = point
    if (!point) return
    if (!previous) return onPaint([point.y * SIZE + point.x])

    const dx = point.x - previous.x
    const dy = point.y - previous.y
    const steps = Math.max(Math.abs(dx), Math.abs(dy))
    if (!steps) return
    const indexes = []
    for (let step = 1; step <= steps; step++) {
      const x = previous.x + Math.round(dx * step / steps)
      const y = previous.y + Math.round(dy * step / steps)
      indexes.push(y * SIZE + x)
    }
    onPaint(indexes)
  }

  function end(event) {
    if (stroke.current?.id === event.pointerId) stroke.current = null
  }

  function moveFocus(event, index) {
    const x = index % SIZE
    const y = Math.floor(index / SIZE)
    const next = {
      ArrowLeft: y * SIZE + Math.max(0, x - 1),
      ArrowRight: y * SIZE + Math.min(SIZE - 1, x + 1),
      ArrowUp: Math.max(0, y - 1) * SIZE + x,
      ArrowDown: Math.min(SIZE - 1, y + 1) * SIZE + x,
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    event.currentTarget.parentElement.children[next].focus()
  }

  return (
    <div className="pixel-grid pixel-editor" role="group" aria-label="16×16 픽셀 격자"
      onPointerDown={begin} onPointerMove={move} onPointerUp={end}
      onPointerCancel={end} onLostPointerCapture={end}>
      {pixels.map((color, index) => (
        <button key={index} type="button" tabIndex={index === active ? 0 : -1}
          aria-label={`${Math.floor(index / SIZE) + 1}행 ${index % SIZE + 1}열, ${color || '빈 칸'}`}
          style={{ backgroundColor: color }}
          onFocus={() => setActive(index)} onKeyDown={event => moveFocus(event, index)}
          onClick={event => { if (event.detail === 0) onPaint([index]) }} />
      ))}
    </div>
  )
}
