export const SIZE = 16
export const emptyPixels = () => Array(SIZE * SIZE).fill(null)

export function normalizePixels(pixels) {
  return emptyPixels().map((_, index) => {
    const color = pixels?.[index]
    return typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? color : null
  })
}
