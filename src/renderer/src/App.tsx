import { useCallback, useEffect, useMemo, useState } from 'react'
import { TabRail } from './components/TabRail'
import { AddBar } from './components/AddBar'
import { EmptyState } from './components/EmptyState'
import { SettingsPanel, prettifyAccelerator } from './components/SettingsPanel'
import { PreviewPopup } from './components/PreviewPopup'
import { I18nProvider, useT } from './i18n'
import type {
  NavigationState,
  PreviewInfo,
  SearchBounds,
  SearchEngine,
  Settings,
  Tab,
  ThemePreference,
  UpdateState,
} from '../../shared/types'

const INITIAL_NAVIGATION: NavigationState = {
  canGoBack: false,
  canGoForward: false,
}

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [navigation, setNavigation] = useState<NavigationState>(INITIAL_NAVIGATION)
  const [addbarOpen, setAddbarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [updateState, setUpdateState] = useState<UpdateState | null>(null)
  const [preview, setPreview] = useState<PreviewInfo | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<Tab | null>(null)
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => getSystemTheme())

  useEffect(() => {
    let cancelled = false
    Promise.all([
      window.slideweb.getTabs(),
      window.slideweb.getActiveTabId(),
      window.slideweb.getNavigationState(),
      window.slideweb.getSettings(),
      window.slideweb.getUpdateState(),
    ]).then(([t, a, n, s, u]) => {
      if (cancelled) return
      setTabs(t)
      setActiveId(a)
      setNavigation(n)
      setSettings(s)
      setUpdateState(u)
    })
    const off1 = window.slideweb.onTabsChanged(setTabs)
    const off2 = window.slideweb.onActiveTabChanged(setActiveId)
    const off3 = window.slideweb.onNavigationChanged(setNavigation)
    const off4 = window.slideweb.onSettingsShow(() => {
      setRemoveTarget(null)
      setAddbarOpen(false)
      setPreviewOpen(false)
      setPreview(null)
      setSettingsOpen(true)
    })
    const off5 = window.slideweb.onUpdateStateChanged(setUpdateState)
    const off6 = window.slideweb.onPreviewShow((info) => {
      setPreview(info)
      setPreviewOpen(true)
      window.slideweb.openPreview()
    })
    const off7 = window.slideweb.onSearchCompleted(() => {
      setAddbarOpen(false)
      setPreviewOpen(false)
      setPreview(null)
    })
    return () => {
      cancelled = true
      off1()
      off2()
      off3()
      off4()
      off5()
      off6()
      off7()
    }
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => setSystemTheme(media.matches ? 'dark' : 'light')
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const openAddBar = useCallback(() => {
    setSettingsOpen(false)
    window.slideweb.closeSettings()
    setAddbarOpen(true)
    window.slideweb.openAddbar()
  }, [])

  const closeAddBar = useCallback(() => {
    setAddbarOpen(false)
    window.slideweb.closeAddbar()
  }, [])

  const closeSearch = useCallback(() => {
    window.slideweb.exitSearch()
  }, [])

  const updateSearchBounds = useCallback((bounds: SearchBounds | null) => {
    window.slideweb.setSearchBounds(bounds)
  }, [])

  const openSettings = useCallback(() => {
    setAddbarOpen(false)
    window.slideweb.closeAddbar()
    setSettingsOpen(true)
    window.slideweb.openSettings()
  }, [])

  const closeSettings = useCallback(() => {
    setSettingsOpen(false)
    window.slideweb.closeSettings()
  }, [])

  const closePreview = useCallback(() => {
    setPreviewOpen(false)
    window.slideweb.closePreview()
  }, [])

  const closeRemoveDialog = useCallback(() => {
    setRemoveTarget(null)
    window.slideweb.closeDialog()
  }, [])

  const requestRemoveTab = useCallback((tab: Tab) => {
    setRemoveTarget(tab)
    setAddbarOpen(false)
    setSettingsOpen(false)
    setPreviewOpen(false)
    window.slideweb.closeAddbar()
    window.slideweb.closeSettings()
    window.slideweb.closePreview()
    window.slideweb.openDialog()
  }, [])

  const confirmRemoveTab = useCallback(() => {
    if (!removeTarget) return
    window.slideweb.removeTab(removeTarget.id)
    closeRemoveDialog()
  }, [closeRemoveDialog, removeTarget])

  const pinPreview = useCallback((info: PreviewInfo) => {
    setPreviewOpen(false)
    setPreview(null)
    window.slideweb.pinPreview(info)
  }, [])

  const startSearch = useCallback(
    (engine: SearchEngine, query: string) => {
      window.slideweb.startSearch(engine, query)
    },
    [],
  )

  // Selecting a tab should always dismiss whatever overlay is open so the new
  // tab actually becomes visible.
  const selectTab = useCallback(
    (id: string) => {
      if (removeTarget) closeRemoveDialog()
      if (addbarOpen) closeAddBar()
      if (settingsOpen) closeSettings()
      if (previewOpen) closePreview()
      window.slideweb.selectTab(id)
    },
    [
      addbarOpen,
      settingsOpen,
      previewOpen,
      removeTarget,
      closeAddBar,
      closeSettings,
      closePreview,
      closeRemoveDialog,
    ],
  )

  const closeVisibleOverlays = useCallback(() => {
    if (removeTarget) closeRemoveDialog()
    if (addbarOpen) closeAddBar()
    if (settingsOpen) closeSettings()
    if (previewOpen) closePreview()
  }, [
    addbarOpen,
    settingsOpen,
    previewOpen,
    removeTarget,
    closeAddBar,
    closeSettings,
    closePreview,
    closeRemoveDialog,
  ])

  const goBack = useCallback(() => {
    closeVisibleOverlays()
    window.slideweb.goBack()
  }, [closeVisibleOverlays])

  const goForward = useCallback(() => {
    closeVisibleOverlays()
    window.slideweb.goForward()
  }, [closeVisibleOverlays])

  const checkForUpdates = useCallback(async () => {
    setUpdateState(await window.slideweb.checkForUpdates())
  }, [])

  const downloadUpdate = useCallback(async () => {
    setUpdateState(await window.slideweb.downloadUpdate())
  }, [])

  const installUpdate = useCallback(() => {
    window.slideweb.installUpdate()
  }, [])

  const hideHint = useMemo(
    () => (settings ? prettifyAccelerator(settings.toggleHotkey).join(' ') : '⌘⇧\\'),
    [settings],
  )
  const hasPendingUpdate = updateState?.status === 'available' || updateState?.status === 'downloaded'

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const cmd = e.metaKey || e.ctrlKey
      // ⌘N — open addbar
      if (cmd && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        if (!addbarOpen) openAddBar()
        return
      }
      // ⌘1-9 — switch tab
      if (cmd && /^[1-9]$/.test(e.key)) {
        const t = tabs[+e.key - 1]
        if (t) {
          e.preventDefault()
          selectTab(t.id)
        }
        return
      }
      // ⌘↵ — pin preview when preview is open
      if (previewOpen && preview && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        pinPreview(preview)
        return
      }
      // Esc — close whichever overlay is open, or exit search
      if (e.key === 'Escape') {
        if (removeTarget) {
          e.preventDefault()
          closeRemoveDialog()
        } else if (previewOpen) {
          e.preventDefault()
          closePreview()
        } else if (addbarOpen) {
          e.preventDefault()
          closeAddBar()
        } else if (settingsOpen) {
          e.preventDefault()
          closeSettings()
        } else {
          // No overlay open — try to exit search (no-op if not in search)
          window.slideweb.exitSearch()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    tabs,
    addbarOpen,
    settingsOpen,
    previewOpen,
    preview,
    openAddBar,
    closeAddBar,
    closeSettings,
    closePreview,
    closeRemoveDialog,
    pinPreview,
    selectTab,
    removeTarget,
  ])

  const isEmpty = tabs.length === 0
  const themePreference: ThemePreference = settings?.theme ?? 'dark'
  const effectiveTheme = themePreference === 'system' ? systemTheme : themePreference

  return (
    <I18nProvider lang={settings?.language ?? 'en'}>
    <div className={`window${removeTarget ? ' window--dialog' : ''}`} data-theme={effectiveTheme}>
      <TabRail
        tabs={tabs}
        activeId={activeId}
        devMode={import.meta.env.DEV}
        hideHint={hideHint}
        canGoBack={navigation.canGoBack}
        canGoForward={navigation.canGoForward}
        onSelect={selectTab}
        onAdd={openAddBar}
        onBack={goBack}
        onForward={goForward}
        onRemove={requestRemoveTab}
        onHide={() => window.slideweb.hide()}
        onSettings={openSettings}
        settingsActive={settingsOpen}
        updateAvailable={hasPendingUpdate}
      />
      <div className="content-area">
        {isEmpty && !addbarOpen && !settingsOpen && <EmptyState onAdd={openAddBar} />}
        <AddBar
          open={addbarOpen}
          onClose={closeAddBar}
          onAddUrl={async (url) => {
            try {
              await window.slideweb.addTab({ url })
              closeAddBar()
            } catch (err) {
              console.error('addTab failed', err)
            }
          }}
          onSearch={startSearch}
          onSearchClose={closeSearch}
          onSearchBoundsChange={updateSearchBounds}
        />
        <SettingsPanel
          open={settingsOpen}
          settings={settings}
          onClose={closeSettings}
          onChange={setSettings}
          onQuit={() => window.slideweb.quit()}
          updateState={updateState}
          onCheckUpdates={checkForUpdates}
          onDownloadUpdate={downloadUpdate}
          onInstallUpdate={installUpdate}
        />
        <PreviewPopup open={previewOpen} info={preview} onPin={pinPreview} onClose={closePreview} />
        <RemoveTabDialog
          open={removeTarget !== null}
          tab={removeTarget}
          onCancel={closeRemoveDialog}
          onConfirm={confirmRemoveTab}
        />
      </div>
    </div>
    </I18nProvider>
  )
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function RemoveTabDialog({
  open,
  tab,
  onCancel,
  onConfirm,
}: {
  open: boolean
  tab: Tab | null
  onCancel: () => void
  onConfirm: () => void
}) {
  const t = useT()

  if (!open || !tab) return null

  return (
    <div className="remove-modal" role="presentation" onClick={onCancel}>
      <div
        className="remove-card"
        role="dialog"
        aria-modal="true"
        aria-label={t('rail.removeConfirm', { title: tab.title })}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="remove-card__icon" aria-hidden>
          <RemoveMark />
        </div>
        <p className="remove-card__question">{t('rail.removeConfirm', { title: tab.title })}</p>
        <div className="remove-card__actions">
          <button type="button" className="remove-card__cancel" onClick={onCancel}>
            {t('rail.removeCancel')}
          </button>
          <button type="button" className="remove-card__ok" onClick={onConfirm}>
            {t('rail.removeOk')}
          </button>
        </div>
      </div>
    </div>
  )
}

function RemoveMark() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden>
      <circle cx="19" cy="19" r="18" fill="rgba(255, 255, 255, 0.07)" />
      <path
        d="M13.5 13.5l11 11M24.5 13.5l-11 11"
        stroke="#dcefff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="19" cy="19" r="6.8" stroke="#9ed3ff" strokeWidth="1.25" opacity="0.85" />
    </svg>
  )
}
