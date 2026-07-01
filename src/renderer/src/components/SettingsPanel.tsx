import { useCallback, useEffect, useState } from 'react'
import type { Language, Settings } from '../../../shared/types'
import { useT } from '../i18n'

interface Props {
  open: boolean
  settings: Settings | null
  onClose: () => void
  onChange: (settings: Settings) => void
}

const DEFAULT_HOTKEY = 'CommandOrControl+Shift+\\'

const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export function SettingsPanel({ open, settings, onClose, onChange }: Props) {
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
        onChange({ ...(settings ?? { language: 'en' as Language }), toggleHotkey: accelerator })
      } else {
        setError(result.error || t('settings.hotkey.error'))
      }
    },
    [onChange, settings, t],
  )

  const applyLanguage = useCallback(
    async (language: Language) => {
      await window.slideweb.setLanguage(language)
      onChange({ ...(settings ?? { toggleHotkey: DEFAULT_HOTKEY }), language })
    },
    [onChange, settings],
  )

  const currentLang: Language = settings?.language ?? 'en'

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

      <button type="button" className="settings__close" onClick={onClose}>
        <CloseIcon />
        <span>{t('settings.close')}</span>
      </button>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
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
