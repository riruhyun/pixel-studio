import { PixelPreview } from './PixelGrid'

export default function ArtworkFigure({ pixels, title, author, showTransparency, children }) {
  return (
    <figure className="artwork-figure">
      <div className="display-stage">
        <div className="artwork-mat">
          <PixelPreview pixels={pixels} label={`${title} 픽셀 아트`} showTransparency={showTransparency} />
        </div>
      </div>
      <figcaption>
        {children ?? <>
          <h2>{title}</h2>
          {author && <p className="artwork-credit">{author}</p>}
        </>}
      </figcaption>
    </figure>
  )
}
