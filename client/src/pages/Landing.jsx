import { PixelPreview } from '../components/PixelGrid'

const palette = { R: '#ae482d', O: '#d7794f', C: '#f0d9b4', D: '#382923' }
const fox = [
  '................',
  '..R....R........',
  '..OR..RO........',
  '..ORRRRO........',
  '..OOOOOO........',
  '.RODOODO........',
  '.RCCOOCC..RR....',
  '..CCDDCC.RROO...',
  '...CCCRRRROOOR..',
  '....CRROORROOOR.',
  '....CROOORRCCOR.',
  '...CCROORRCCCO..',
  '..CCROORRCCC....',
  '..RRRRRRRR......',
  '................',
  '................',
].flatMap(row => [...row].map(pixel => palette[pixel] ?? null))

export default function Landing({ onDraw }) {
  return (
    <section className="landing" aria-labelledby="landing-title">
      <div className="landing-copy">
        <h1 id="landing-title">Pixel Studio</h1>
        <p>16×16 픽셀로 그리고 갤러리에 공유하세요.</p>
        <button className="primary" onClick={onDraw}>그리기</button>
      </div>
      <div className="landing-art">
        <PixelPreview pixels={fox} label="16×16 픽셀로 그린 여우" />
      </div>
    </section>
  )
}
