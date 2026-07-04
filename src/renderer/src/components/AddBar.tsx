import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { SearchBounds, SearchEngine } from '../../../shared/types'
import { isLikelyUrlInput } from '../../../shared/navigation'
import { useT } from '../i18n'

interface Props {
  open: boolean
  onClose: () => void
  onAddUrl: (url: string) => void
  onSearch: (engine: SearchEngine, query: string) => void
  onSearchClose: () => void
  onSearchBoundsChange: (bounds: SearchBounds | null) => void
}

const ENGINE_KEY = 'slideweb_engine'

export function AddBar({
  open,
  onClose,
  onAddUrl,
  onSearch,
  onSearchClose,
  onSearchBoundsChange,
}: Props) {
  const t = useT()
  const [value, setValue] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [engine, setEngine] = useState<SearchEngine>(() => {
    try {
      const saved = localStorage.getItem(ENGINE_KEY)
      return saved === 'baidu' ? 'baidu' : 'google'
    } catch {
      return 'google'
    }
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const searchFrameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 140)
      return () => clearTimeout(t)
    }
    setValue('')
    setSearchOpen(false)
    setSearchQuery('')
    onSearchBoundsChange(null)
    return
  }, [open, onSearchBoundsChange])

  useLayoutEffect(() => {
    if (!open || !searchOpen) {
      onSearchBoundsChange(null)
      return
    }

    let frame = 0
    const publishBounds = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = searchFrameRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        onSearchBoundsChange({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        })
      })
    }

    publishBounds()
    const observer = new ResizeObserver(publishBounds)
    if (searchFrameRef.current) observer.observe(searchFrameRef.current)
    window.addEventListener('resize', publishBounds)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', publishBounds)
    }
  }, [open, searchOpen, searchQuery, engine, onSearchBoundsChange])

  function pickEngine(next: SearchEngine) {
    setEngine(next)
    try {
      localStorage.setItem(ENGINE_KEY, next)
    } catch {
      /* ignore */
    }
  }

  function submit() {
    const v = value.trim()
    if (!v) return
    if (isLikelyUrlInput(v)) {
      onAddUrl(v)
      return
    }
    setSearchQuery(v)
    setSearchOpen(true)
    onSearch(engine, v)
  }

  function closeSearchPopup() {
    setSearchOpen(false)
    setSearchQuery('')
    onSearchBoundsChange(null)
    onSearchClose()
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  const mode: 'empty' | 'url' | 'query' = !value.trim() ? 'empty' : isLikelyUrlInput(value) ? 'url' : 'query'

  const rowLabel =
    mode === 'url'
      ? t('addbar.label.url')
      : mode === 'query'
        ? t('addbar.label.search', { engine: engine === 'baidu' ? '百度' : 'Google' })
        : t('addbar.label.hint')

  return (
    <div className="addbar" data-open={open}>
      <span className="addbar__brand">SlideWeb</span>
      <p className="addbar__prompt">
        {t('addbar.prompt.beforeEm').split('\n').map((line, i, arr) => (
          <span key={i}>
            {line}
            {i < arr.length - 1 ? <br /> : null}
          </span>
        ))}
        <em>{t('addbar.prompt.em')}</em>
        {t('addbar.prompt.afterEm')}
      </p>
      <div className={`addbar__field${mode === 'query' ? ' is-query' : ''}`}>
        <span className="addbar__scheme">{mode === 'query' ? '🔍' : 'https://'}</span>
        <input
          ref={inputRef}
          className="addbar__input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              if (searchOpen) closeSearchPopup()
              else onClose()
            }
          }}
          placeholder={t('addbar.placeholder')}
          autoComplete="off"
          spellCheck={false}
        />
        <kbd className="addbar__enter">↵</kbd>
      </div>

      <div className="addbar__row">
        <span className="addbar__row-label">{rowLabel}</span>
        {mode === 'query' ? (
          <div className="addbar__engine">
            <button
              type="button"
              className={engine === 'google' ? 'on' : ''}
              onClick={() => pickEngine('google')}
            >
              Google
            </button>
            <button
              type="button"
              className={engine === 'baidu' ? 'on' : ''}
              onClick={() => pickEngine('baidu')}
            >
              百度
            </button>
          </div>
        ) : null}
      </div>

      <p className="addbar__hint">
        {mode === 'url' && t('addbar.hint.url')}
        {mode === 'query' && t('addbar.hint.search')}
        {mode === 'empty' && t('addbar.hint.empty')}
      </p>
      {searchOpen ? (
        <div className="addbar__search-modal" role="dialog" aria-label={t('addbar.search.title')}>
          <div className="addbar__search-head">
            <div className="addbar__search-title">
              <span>{t('addbar.search.title')}</span>
              <em>
                {engine === 'baidu' ? '百度' : 'Google'} · {searchQuery}
              </em>
            </div>
            <button type="button" className="addbar__search-close" onClick={closeSearchPopup}>
              <CloseIcon />
              <span>{t('addbar.search.close')}</span>
            </button>
          </div>
          <div ref={searchFrameRef} className="addbar__search-frame">
            <span>{t('addbar.search.loading')}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path d="M3.25 3.25l6.5 6.5M9.75 3.25l-6.5 6.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}
