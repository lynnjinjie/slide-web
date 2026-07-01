import { useCallback, useEffect, useMemo, useState } from 'react'
import { TabRail } from './components/TabRail'
import { AddBar } from './components/AddBar'
import { EmptyState } from './components/EmptyState'
import { SettingsPanel, prettifyAccelerator } from './components/SettingsPanel'
import { PreviewPopup } from './components/PreviewPopup'
import { I18nProvider } from './i18n'
import type { PreviewInfo, SearchBounds, SearchEngine, Settings, Tab } from '../../shared/types'

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [addbarOpen, setAddbarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [preview, setPreview] = useState<PreviewInfo | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      window.slideweb.getTabs(),
      window.slideweb.getActiveTabId(),
      window.slideweb.getSettings(),
    ]).then(([t, a, s]) => {
      if (cancelled) return
      setTabs(t)
      setActiveId(a)
      setSettings(s)
    })
    const off1 = window.slideweb.onTabsChanged(setTabs)
    const off2 = window.slideweb.onActiveTabChanged(setActiveId)
    const off3 = window.slideweb.onPreviewShow((info) => {
      setPreview(info)
      setPreviewOpen(true)
      window.slideweb.openPreview()
    })
    const off4 = window.slideweb.onSearchCompleted(() => {
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
    }
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
      if (addbarOpen) closeAddBar()
      if (settingsOpen) closeSettings()
      if (previewOpen) closePreview()
      window.slideweb.selectTab(id)
    },
    [addbarOpen, settingsOpen, previewOpen, closeAddBar, closeSettings, closePreview],
  )

  const hideHint = useMemo(
    () => (settings ? prettifyAccelerator(settings.toggleHotkey).join(' ') : '⌘⇧\\'),
    [settings],
  )

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
        if (previewOpen) {
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
    pinPreview,
    selectTab,
  ])

  const isEmpty = tabs.length === 0

  return (
    <I18nProvider lang={settings?.language ?? 'en'}>
    <div className="window">
      <TabRail
        tabs={tabs}
        activeId={activeId}
        hideHint={hideHint}
        onSelect={selectTab}
        onAdd={openAddBar}
        onRemove={(id) => window.slideweb.removeTab(id)}
        onHide={() => window.slideweb.hide()}
        onSettings={openSettings}
        settingsActive={settingsOpen}
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
        />
        <PreviewPopup open={previewOpen} info={preview} onPin={pinPreview} onClose={closePreview} />
      </div>
    </div>
    </I18nProvider>
  )
}
