import { useEffect, useRef, useState } from 'react'
import type { Tab } from '../../../shared/types'
import { useT } from '../i18n'

interface Props {
  tabs: Tab[]
  activeId: string | null
  devMode: boolean
  hideHint: string
  canGoBack: boolean
  canGoForward: boolean
  onSelect: (id: string) => void
  onAdd: () => void
  onBack: () => void
  onForward: () => void
  onTabMenu: (id: string) => void
  onRemove: (tab: Tab) => void
  onHide: () => void
  onSettings: () => void
  settingsActive: boolean
  updateAvailable: boolean
}

type FloatingTooltip = {
  text: string
  hint?: string
  top: number
}

function tooltipFromTarget(target: HTMLElement, text: string, hint?: string): FloatingTooltip {
  const rect = target.getBoundingClientRect()
  return {
    text,
    hint,
    top: Math.round(rect.top + rect.height / 2),
  }
}

export function TabRail({
  tabs,
  activeId,
  devMode,
  hideHint,
  canGoBack,
  canGoForward,
  onSelect,
  onAdd,
  onBack,
  onForward,
  onTabMenu,
  onRemove,
  onHide,
  onSettings,
  settingsActive,
  updateAvailable,
}: Props) {
  const t = useT()
  const [floatingTooltip, setFloatingTooltip] = useState<FloatingTooltip | null>(null)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)
  const backTooltip = t('rail.back')
  const forwardTooltip = t('rail.forward')

  useEffect(() => {
    if (settingsActive) settingsButtonRef.current?.focus()
  }, [settingsActive])

  useEffect(() => {
    setFloatingTooltip(null)
  }, [tabs, activeId, settingsActive])

  return (
    <nav className="rail" aria-label={t('rail.addTab')} onPointerLeave={() => setFloatingTooltip(null)}>
      <button
        className="rail__hide"
        onClick={() => {
          setFloatingTooltip(null)
          onHide()
        }}
        aria-label={t('rail.hide')}
      >
        <ChevronRight />
        <Tooltip text={t('rail.hide')} hint={hideHint} />
      </button>
      <div className="rail__history" aria-label={t('rail.history')}>
        <button
          type="button"
          className="rail__history-button"
          onClick={onBack}
          disabled={!canGoBack}
          onPointerEnter={(e) => {
            if (canGoBack) setFloatingTooltip(tooltipFromTarget(e.currentTarget, backTooltip))
          }}
          onPointerLeave={() => setFloatingTooltip(null)}
          onFocus={(e) => {
            if (canGoBack) setFloatingTooltip(tooltipFromTarget(e.currentTarget, backTooltip))
          }}
          onBlur={() => setFloatingTooltip(null)}
          aria-label={t('rail.back')}
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          className="rail__history-button"
          onClick={onForward}
          disabled={!canGoForward}
          onPointerEnter={(e) => {
            if (canGoForward) setFloatingTooltip(tooltipFromTarget(e.currentTarget, forwardTooltip))
          }}
          onPointerLeave={() => setFloatingTooltip(null)}
          onFocus={(e) => {
            if (canGoForward) setFloatingTooltip(tooltipFromTarget(e.currentTarget, forwardTooltip))
          }}
          onBlur={() => setFloatingTooltip(null)}
          aria-label={t('rail.forward')}
        >
          <ChevronRight />
        </button>
      </div>
      {devMode ? (
        <span className="rail__env" title="Development environment" aria-label="Development environment">
          DEV
        </span>
      ) : null}
      <span className="rail__divider" aria-hidden />
      <ul className="rail__list">
        {tabs.map((tab, i) => (
          <TabItem
            key={tab.id}
            tab={tab}
            index={i}
            isActive={!settingsActive && tab.id === activeId}
            onSelect={() => {
              setFloatingTooltip(null)
              onSelect(tab.id)
            }}
            onRemove={() => {
              setFloatingTooltip(null)
              onRemove(tab)
            }}
            onTabMenu={() => {
              setFloatingTooltip(null)
              onTabMenu(tab.id)
            }}
            onTooltipChange={setFloatingTooltip}
          />
        ))}
      </ul>
      <button
        className="rail__add"
        onClick={() => {
          setFloatingTooltip(null)
          onAdd()
        }}
        aria-label={t('rail.addTab')}
      >
        <Plus />
        <Tooltip text={t('rail.addTab')} hint="⌘N" />
      </button>
      <button
        ref={settingsButtonRef}
        className={`rail__settings${settingsActive ? ' rail__settings--active' : ''}${updateAvailable ? ' rail__settings--update' : ''}`}
        onClick={(e) => {
          setFloatingTooltip(null)
          e.currentTarget.focus()
          onSettings()
        }}
        aria-label={t('rail.settings')}
        aria-pressed={settingsActive}
      >
        <GearKey />
        {updateAvailable ? <span className="rail__update-dot" aria-hidden /> : null}
        <Tooltip text={t('rail.settings')} />
      </button>
      {floatingTooltip ? <RailTooltip tooltip={floatingTooltip} /> : null}
    </nav>
  )
}

function TabItem({
  tab,
  index,
  isActive,
  onSelect,
  onRemove,
  onTabMenu,
  onTooltipChange,
}: {
  tab: Tab
  index: number
  isActive: boolean
  onSelect: () => void
  onRemove: () => void
  onTabMenu: () => void
  onTooltipChange: (tooltip: FloatingTooltip | null) => void
}) {
  const googleFavicon = `https://www.google.com/s2/favicons?domain=${tab.host}&sz=64`
  const [favicon, setFavicon] = useState(tab.faviconUrl || googleFavicon)
  const hint = index < 9 ? `⌘${index + 1}` : undefined

  useEffect(() => {
    setFavicon(tab.faviconUrl || googleFavicon)
  }, [googleFavicon, tab.faviconUrl])

  function showTooltip(target: HTMLElement) {
    onTooltipChange(tooltipFromTarget(target, tab.title, hint))
  }

  return (
    <li
      className={`rail__item${isActive ? ' rail__item--active' : ''}`}
      onContextMenu={(e) => {
        e.preventDefault()
        onTooltipChange(null)
        onTabMenu()
      }}
    >
      <span className="rail__indicator" aria-hidden />
      <span className="rail__tab-wrap" style={{ animationDelay: `${index * 30}ms` }}>
        <button
          className="rail__button"
          onClick={onSelect}
          onPointerEnter={(e) => showTooltip(e.currentTarget)}
          onPointerLeave={() => onTooltipChange(null)}
          onFocus={(e) => showTooltip(e.currentTarget)}
          onBlur={() => onTooltipChange(null)}
          aria-current={isActive ? 'true' : undefined}
        >
          <img
            className="rail__favicon"
            src={favicon}
            alt=""
            draggable={false}
            onError={() => {
              if (favicon !== googleFavicon) setFavicon(googleFavicon)
            }}
          />
          <span className="rail__live" aria-hidden />
        </button>
        <button
          type="button"
          className="rail__remove"
          onClick={(e) => {
            e.stopPropagation()
            onTooltipChange(null)
            onRemove()
          }}
          aria-label={`Remove ${tab.title}`}
          title={`Remove ${tab.title}`}
        >
          <CloseMini />
        </button>
      </span>
    </li>
  )
}

function CloseMini() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
      <path d="M2.25 2.25l4.5 4.5M6.75 2.25l-4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function Plus() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M9 3.5v11M3.5 9h11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
      <path d="M3.5 2.5L7 5.5L3.5 8.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronLeft() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
      <path d="M7.5 2.5L4 5.5L7.5 8.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GearKey() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden>
      <circle cx="6.2" cy="6.2" r="2.15" stroke="currentColor" strokeWidth="1.1" />
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <path d="M6.2 1.7v1.2M6.2 9.5v1.2M1.7 6.2h1.2M9.5 6.2h1.2" />
        <path d="M3.05 3.05l.85.85M8.5 8.5l.85.85M9.35 3.05l-.85.85M3.05 9.35l.85-.85" />
        <path d="M9.35 9.35l4.2 4.2M12 11.95l1.2-1.2M13.15 13.15l1.15-1.15" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

function Tooltip({ text, hint }: { text: string; hint?: string }) {
  return (
    <span role="tooltip" className="tooltip">
      <span className="tooltip__text">{text}</span>
      {hint ? <span className="tooltip__hint">{hint}</span> : null}
    </span>
  )
}

function RailTooltip({ tooltip }: { tooltip: FloatingTooltip }) {
  return (
    <span role="tooltip" className="tooltip tooltip--floating" style={{ top: tooltip.top }}>
      <span className="tooltip__text">{tooltip.text}</span>
      {tooltip.hint ? <span className="tooltip__hint">{tooltip.hint}</span> : null}
    </span>
  )
}
