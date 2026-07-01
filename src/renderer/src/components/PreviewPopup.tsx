import type { PreviewInfo } from '../../../shared/types'
import { useT } from '../i18n'

interface Props {
  open: boolean
  info: PreviewInfo | null
  onPin: (info: PreviewInfo) => void
  onClose: () => void
}

export function PreviewPopup({ open, info, onPin, onClose }: Props) {
  const t = useT()
  return (
    <div className="preview-modal" data-open={open}>
      {info ? (
        <div className="preview-card" role="dialog" aria-label={t('preview.aria')}>
          <div className="preview-card__bar">
            <button className="preview-btn preview-btn--primary" onClick={() => onPin(info)}>
              <span>{t('preview.pin')}</span>
              <span className="kbd">⌘ ↵</span>
            </button>
            <button className="preview-btn" onClick={onClose}>
              <span>{t('preview.close')}</span>
              <span className="kbd">esc</span>
            </button>
          </div>
          <div className="preview-card__body">
            <div className="preview-card__head">
              <div
                className="preview-favicon"
                style={{
                  backgroundImage: `url('https://www.google.com/s2/favicons?domain=${info.host}&sz=128')`,
                }}
              />
              <div className="preview-card__text">
                <p className="preview-title">{info.title || info.host}</p>
                <p className="preview-host">{info.url}</p>
              </div>
            </div>
            <div className="preview-render">
              <span className="preview-render__badge">{t('preview.badge')}</span>
              <div className="preview-render__line preview-render__line--hero" />
              <div className="preview-render__line preview-render__line--long" />
              <div className="preview-render__line preview-render__line--med" />
              <div className="preview-render__line preview-render__line--long" />
              <div className="preview-render__line preview-render__line--short" />
            </div>
            <p className="preview-question">
              {t('preview.question.beforeEm')}
              <em>{t('preview.question.em')}</em>
              {t('preview.question.afterEm')}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
