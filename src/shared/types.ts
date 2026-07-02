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
  edgeWakeEnabled: boolean
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

export interface NavigationState {
  canGoBack: boolean
  canGoForward: boolean
}

export interface SlideWebAPI {
  getTabs: () => Promise<Tab[]>
  getActiveTabId: () => Promise<string | null>
  getNavigationState: () => Promise<NavigationState>
  goBack: () => Promise<void>
  goForward: () => Promise<void>
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
  setEdgeWakeEnabled: (enabled: boolean) => Promise<void>
  startSearch: (engine: SearchEngine, query: string) => Promise<void>
  setSearchBounds: (bounds: SearchBounds | null) => Promise<void>
  exitSearch: () => Promise<void>
  openPreview: () => Promise<void>
  closePreview: () => Promise<void>
  pinPreview: (info: PreviewInfo) => Promise<void>
  openDialog: () => Promise<void>
  closeDialog: () => Promise<void>
  hide: () => Promise<void>
  quit: () => Promise<void>
  onTabsChanged: (cb: (tabs: Tab[]) => void) => () => void
  onActiveTabChanged: (cb: (id: string | null) => void) => () => void
  onNavigationChanged: (cb: (state: NavigationState) => void) => () => void
  onSettingsShow: (cb: () => void) => () => void
  onPreviewShow: (cb: (info: PreviewInfo) => void) => () => void
  onSearchCompleted: (cb: () => void) => () => void
}

declare global {
  interface Window {
    slideweb: SlideWebAPI
  }
}
