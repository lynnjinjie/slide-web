export interface Tab {
  id: string
  url: string
  title: string
  host: string
}

export type Language = 'en' | 'zh'

export interface Settings {
  toggleHotkey: string // Electron accelerator string, e.g. "CommandOrControl+Shift+\\"
  language: Language
}

export type SearchEngine = 'google' | 'baidu'

export interface PreviewInfo {
  url: string
  title?: string
  host: string
}

export interface SearchBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface SlideWebAPI {
  getTabs: () => Promise<Tab[]>
  getActiveTabId: () => Promise<string | null>
  addTab: (input: { url: string; title?: string }) => Promise<Tab>
  removeTab: (id: string) => Promise<void>
  selectTab: (id: string) => Promise<void>
  openAddbar: () => Promise<void>
  closeAddbar: () => Promise<void>
  openSettings: () => Promise<void>
  closeSettings: () => Promise<void>
  getSettings: () => Promise<Settings>
  setHotkey: (hotkey: string) => Promise<{ ok: boolean; error?: string }>
  setLanguage: (language: Language) => Promise<void>
  startSearch: (engine: SearchEngine, query: string) => Promise<void>
  setSearchBounds: (bounds: SearchBounds | null) => Promise<void>
  exitSearch: () => Promise<void>
  openPreview: () => Promise<void>
  closePreview: () => Promise<void>
  pinPreview: (info: PreviewInfo) => Promise<void>
  hide: () => Promise<void>
  onTabsChanged: (cb: (tabs: Tab[]) => void) => () => void
  onActiveTabChanged: (cb: (id: string | null) => void) => () => void
  onPreviewShow: (cb: (info: PreviewInfo) => void) => () => void
  onSearchCompleted: (cb: () => void) => () => void
}

declare global {
  interface Window {
    slideweb: SlideWebAPI
  }
}
