import { useT } from '../i18n'

interface Props {
  onAdd: () => void
}

export function EmptyState({ onAdd }: Props) {
  const t = useT()
  return (
    <div className="empty">
      <div className="empty__inner">
        <span className="empty__eyebrow">SlideWeb</span>
        <h1 className="empty__title">
          {t('empty.title.line1')}
          <br />
          {t('empty.title.line2')}
          <span className="caret">_</span>
        </h1>
        <p className="empty__body">
          {t('empty.body.beforePlus')}
          <button className="inline-plus" onClick={onAdd} aria-label={t('empty.aria.add')}>
            ＋
          </button>
          {t('empty.body.afterPlus')}
        </p>
        <span className="empty__hint">
          <kbd>⌘</kbd>
          <kbd>N</kbd>
          {t('empty.hint')}
        </span>
      </div>
    </div>
  )
}
