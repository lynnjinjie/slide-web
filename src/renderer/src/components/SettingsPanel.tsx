import { useCallback, useEffect, useState } from 'react'
import type { Language, Settings, UpdateState } from '../../../shared/types'
import { useT } from '../i18n'

interface Props {
  open: boolean
  settings: Settings | null
  onClose: () => void
  onChange: (settings: Settings) => void
  onQuit: () => void
  updateState: UpdateState | null
  onCheckUpdates: () => void
  onDownloadUpdate: () => void
  onInstallUpdate: () => void
}

const DEFAULT_HOTKEY = 'CommandOrControl+Shift+\\'
const DEFAULT_SETTINGS: Settings = {
  toggleHotkey: DEFAULT_HOTKEY,
  language: 'en',
  edgeWakeEnabled: true,
  autoHideOnBlur: false,
}

const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

function releaseNotesToText(notes?: string | null) {
  if (!notes) return ''
  const withoutTags = notes
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)\b[^>]*>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')

  const decoder = document.createElement('textarea')
  decoder.innerHTML = withoutTags
  return decoder.value
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function SettingsPanel({
  open,
  settings,
  onClose,
  onChange,
  onQuit,
  updateState,
  onCheckUpdates,
  onDownloadUpdate,
  onInstallUpdate,
}: Props) {
  const t = useT()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) setError(null)
  }, [open])

  const applyHotkey = useCallback(
    async (accelerator: string) => {
      const result = await window.slideweb.setHotkey(accelerator)
      if (result.ok) {
        setError(null)
        onChange({ ...(settings ?? DEFAULT_SETTINGS), toggleHotkey: accelerator })
      } else {
        setError(result.error || t('settings.hotkey.error'))
      }
    },
    [onChange, settings, t],
  )

  const applyLanguage = useCallback(
    async (language: Language) => {
      await window.slideweb.setLanguage(language)
      onChange({ ...(settings ?? DEFAULT_SETTINGS), language })
    },
    [onChange, settings],
  )

  const applyEdgeWake = useCallback(
    async (enabled: boolean) => {
      await window.slideweb.setEdgeWakeEnabled(enabled)
      onChange({ ...(settings ?? DEFAULT_SETTINGS), edgeWakeEnabled: enabled })
    },
    [onChange, settings],
  )

  const applyAutoHideOnBlur = useCallback(
    async (enabled: boolean) => {
      await window.slideweb.setAutoHideOnBlur(enabled)
      onChange({ ...(settings ?? DEFAULT_SETTINGS), autoHideOnBlur: enabled })
    },
    [onChange, settings],
  )

  const currentLang: Language = settings?.language ?? 'en'
  const edgeWakeEnabled = settings?.edgeWakeEnabled ?? DEFAULT_SETTINGS.edgeWakeEnabled
  const autoHideOnBlur = settings?.autoHideOnBlur ?? DEFAULT_SETTINGS.autoHideOnBlur
  const updateStatus = updateState?.status ?? 'idle'
  const updateAction = getUpdateAction(updateState)
  const updateActionDisabled = updateStatus === 'checking' || updateStatus === 'downloading' || updateStatus === 'unsupported'
  const updateActionHandler =
    updateAction === 'install'
      ? onInstallUpdate
      : updateAction === 'download'
        ? onDownloadUpdate
        : onCheckUpdates
  const releaseNotes = releaseNotesToText(updateState?.releaseNotes)

  return (
    <div className="settings" data-open={open}>
      <span className="settings__brand">{t('settings.brand')}</span>
      <p className="settings__prompt">
        {t('settings.prompt.beforeEm')}
        <em>{t('settings.prompt.em')}</em>
        {t('settings.prompt.afterEm')}
      </p>

      <div className="settings__field">
        <div className="settings__row">
          <div className="settings__label">
            <span className="settings__label-name">{t('settings.hotkey.name')}</span>
            <span className="settings__label-desc">{t('settings.hotkey.desc')}</span>
          </div>
          <HotkeyInput value={settings?.toggleHotkey ?? DEFAULT_HOTKEY} onChange={applyHotkey} />
        </div>
        <button
          className="settings__reset"
          onClick={() => applyHotkey(DEFAULT_HOTKEY)}
          disabled={settings?.toggleHotkey === DEFAULT_HOTKEY}
        >
          {t('settings.reset')}
        </button>
        {error ? <p className="settings__error">{error}</p> : null}
      </div>

      <div className="settings__field">
        <div className="settings__row">
          <div className="settings__label">
            <span className="settings__label-name">{t('settings.language.name')}</span>
            <span className="settings__label-desc">{t('settings.language.desc')}</span>
          </div>
          <div className="settings__seg">
            <button
              type="button"
              className={currentLang === 'en' ? 'on' : ''}
              onClick={() => applyLanguage('en')}
            >
              {t('settings.language.en')}
            </button>
            <button
              type="button"
              className={currentLang === 'zh' ? 'on' : ''}
              onClick={() => applyLanguage('zh')}
            >
              {t('settings.language.zh')}
            </button>
          </div>
        </div>
      </div>

      <div className="settings__field">
        <div className="settings__row">
          <div className="settings__label">
            <span className="settings__label-name">{t('settings.edgeWake.name')}</span>
            <span className="settings__label-desc">{t('settings.edgeWake.desc')}</span>
          </div>
          <div className="settings__seg">
            <button
              type="button"
              className={edgeWakeEnabled ? 'on' : ''}
              onClick={() => applyEdgeWake(true)}
            >
              {t('settings.edgeWake.on')}
            </button>
            <button
              type="button"
              className={!edgeWakeEnabled ? 'on' : ''}
              onClick={() => applyEdgeWake(false)}
            >
              {t('settings.edgeWake.off')}
            </button>
          </div>
        </div>
      </div>

      <div className="settings__field">
        <div className="settings__row">
          <div className="settings__label">
            <span className="settings__label-name">{t('settings.autoHide.name')}</span>
            <span className="settings__label-desc">{t('settings.autoHide.desc')}</span>
          </div>
          <div className="settings__seg">
            <button
              type="button"
              className={autoHideOnBlur ? 'on' : ''}
              onClick={() => applyAutoHideOnBlur(true)}
            >
              {t('settings.autoHide.on')}
            </button>
            <button
              type="button"
              className={!autoHideOnBlur ? 'on' : ''}
              onClick={() => applyAutoHideOnBlur(false)}
            >
              {t('settings.autoHide.off')}
            </button>
          </div>
        </div>
      </div>

      <div className="settings__field settings__update">
        <div className="settings__row">
          <div className="settings__label">
            <span className="settings__label-name">{t('settings.update.name')}</span>
            <span className="settings__label-desc">{t('settings.update.desc')}</span>
          </div>
          <span className="settings__version">
            {t('settings.update.current', { version: updateState?.currentVersion ?? '...' })}
          </span>
        </div>
        <p className={`settings__update-status settings__update-status--${updateStatus}`}>
          {updateStatusMessage(updateState, t)}
        </p>
        {updateStatus === 'downloading' ? (
          <div className="settings__progress" aria-label={t('settings.update.progress')}>
            <span style={{ width: `${updateState?.percent ?? 0}%` }} />
          </div>
        ) : null}
        {(updateStatus === 'available' || updateStatus === 'downloaded') && releaseNotes ? (
          <details className="settings__notes">
            <summary>{t('settings.update.releaseNotes')}</summary>
            <p>{releaseNotes}</p>
          </details>
        ) : null}
        <button
          type="button"
          className="settings__update-button"
          onClick={updateActionHandler}
          disabled={updateActionDisabled}
        >
          <UpdateIcon />
          <span>{t(`settings.update.${updateAction}`)}</span>
        </button>
      </div>

      <div className="settings__actions">
        <button type="button" className="settings__close" onClick={onClose}>
          <CloseIcon />
          <span>{t('settings.close')}</span>
        </button>
        <button type="button" className="settings__quit" onClick={onQuit}>
          <PowerIcon />
          <span>{t('settings.quit')}</span>
        </button>
      </div>
    </div>
  )
}

function getUpdateAction(state: UpdateState | null): 'check' | 'download' | 'install' {
  if (state?.status === 'available') return 'download'
  if (state?.status === 'downloaded') return 'install'
  return 'check'
}

function updateStatusMessage(state: UpdateState | null, t: ReturnType<typeof useT>) {
  if (!state) return t('settings.update.idle')
  switch (state.status) {
    case 'unsupported':
      return t('settings.update.unsupported')
    case 'checking':
      return t('settings.update.checking')
    case 'available':
      return t('settings.update.available', { version: state.availableVersion ?? 'unknown' })
    case 'not-available':
      return t('settings.update.notAvailable')
    case 'downloading':
      return t('settings.update.downloading', { percent: String(state.percent ?? 0) })
    case 'downloaded':
      return t('settings.update.downloaded', { version: state.availableVersion ?? 'unknown' })
    case 'error':
      return t('settings.update.error', { message: state.error ?? 'Unknown error' })
    case 'idle':
    default:
      return t('settings.update.idle')
  }
}

function UpdateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3.1 6.6A4 4 0 0 1 10 4.15l.45.48M10.9 7.4A4 4 0 0 1 4 9.85l-.45-.48"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10.6 2.55v2.25H8.35M3.4 11.45V9.2h2.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

function PowerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 2v4.2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path
        d="M4.45 3.7a4.25 4.25 0 1 0 5.1 0"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  )
}

function HotkeyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useT()
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    if (!recording) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setRecording(false)
        return
      }
      if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) return
      e.preventDefault()
      e.stopPropagation()
      const acc = eventToAccelerator(e)
      if (acc) {
        onChange(acc)
        setRecording(false)
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [recording, onChange])

  return (
    <button
      type="button"
      className={`hotkey${recording ? ' hotkey--recording' : ''}`}
      onClick={() => setRecording((r) => !r)}
      aria-label="Record shortcut"
    >
      {recording ? (
        <span className="hotkey__hint">{t('settings.hotkey.recording')}</span>
      ) : (
        <span className="hotkey__keys">
          {prettify(value).map((k, i) => (
            <kbd key={i}>{k}</kbd>
          ))}
        </span>
      )}
    </button>
  )
}

function eventToAccelerator(e: KeyboardEvent): string | null {
  const mods: string[] = []
  if (e.metaKey || e.ctrlKey) mods.push('CommandOrControl')
  if (e.altKey) mods.push('Alt')
  if (e.shiftKey) mods.push('Shift')

  const k = e.key
  if (['Control', 'Meta', 'Alt', 'Shift'].includes(k)) return null

  let key: string
  if (k === ' ') key = 'Space'
  else if (k === 'Escape') key = 'Escape'
  else if (k === 'Tab') key = 'Tab'
  else if (k === 'Backspace') key = 'Backspace'
  else if (k === 'Delete') key = 'Delete'
  else if (k === 'Enter') key = 'Return'
  else if (k === 'ArrowLeft') key = 'Left'
  else if (k === 'ArrowRight') key = 'Right'
  else if (k === 'ArrowUp') key = 'Up'
  else if (k === 'ArrowDown') key = 'Down'
  else if (/^F\d+$/.test(k)) key = k
  else if (k.length === 1) {
    // Use e.code to ignore shift-modified glyphs (Shift+\ → "|" should map to "\")
    const code = e.code
    if (code && /^Key[A-Z]$/.test(code)) key = code.slice(3)
    else if (code && /^Digit\d$/.test(code)) key = code.slice(5)
    else if (code === 'Backslash') key = '\\'
    else if (code === 'BracketLeft') key = '['
    else if (code === 'BracketRight') key = ']'
    else if (code === 'Semicolon') key = ';'
    else if (code === 'Quote') key = "'"
    else if (code === 'Comma') key = ','
    else if (code === 'Period') key = '.'
    else if (code === 'Slash') key = '/'
    else if (code === 'Minus') key = '-'
    else if (code === 'Equal') key = '='
    else if (code === 'Backquote') key = '`'
    else key = k.toUpperCase()
  } else {
    return null
  }

  // Require at least one modifier (except F1–F24, which are valid solo)
  if (mods.length === 0 && !/^F\d+$/.test(key)) return null

  return [...mods, key].join('+')
}

function prettify(acc: string): string[] {
  return acc.split('+').map((p) => {
    switch (p) {
      case 'CommandOrControl':
      case 'CmdOrCtrl':
      case 'Cmd':
      case 'Command':
      case 'Meta':
        return isMac ? '⌘' : 'Ctrl'
      case 'Ctrl':
      case 'Control':
        return isMac ? '⌃' : 'Ctrl'
      case 'Alt':
      case 'Option':
        return isMac ? '⌥' : 'Alt'
      case 'Shift':
        return isMac ? '⇧' : 'Shift'
      case 'Return':
        return '↵'
      case 'Backspace':
        return '⌫'
      case 'Delete':
        return '⌦'
      case 'Tab':
        return '⇥'
      case 'Escape':
        return 'esc'
      case 'Space':
        return '␣'
      case 'Left':
        return '←'
      case 'Right':
        return '→'
      case 'Up':
        return '↑'
      case 'Down':
        return '↓'
      default:
        return p
    }
  })
}

export function prettifyAccelerator(acc: string): string[] {
  return prettify(acc)
}
