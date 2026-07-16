export interface Tab {
  id: string
  url: string
  title: string
  host: string
  faviconUrl?: string
}

export type Language = 'en' | 'zh'
export type ThemePreference = 'light' | 'dark' | 'system'

export interface Settings {
  toggleHotkey: string // Electron accelerator string, e.g. "CommandOrControl+Shift+\\"
  language: Language
  theme: ThemePreference
  edgeWakeEnabled: boolean
  autoHideOnBlur: boolean
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

export type UpdateStatus =
  | 'idle'
  | 'unsupported'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface UpdateState {
  status: UpdateStatus
  currentVersion: string
  isPackaged: boolean
  availableVersion?: string
  releaseName?: string | null
  releaseNotes?: string | null
  percent?: number
  error?: string
}

export interface SlideWebAPI {
  getTabs: () => Promise<Tab[]>
  getActiveTabId: () => Promise<string | null>
  getNavigationState: () => Promise<NavigationState>
  goBack: () => Promise<void>
  goForward: () => Promise<void>
  addTab: (input: { url: string; title?: string }) => Promise<Tab>
  showTabMenu: (id: string) => Promise<void>
  removeTab: (id: string) => Promise<void>
  selectTab: (id: string) => Promise<void>
  openAddbar: () => Promise<void>
  closeAddbar: () => Promise<void>
  openSettings: () => Promise<void>
  closeSettings: () => Promise<void>
  getSettings: () => Promise<Settings>
  setHotkey: (hotkey: string) => Promise<{ ok: boolean; error?: string }>
  setLanguage: (language: Language) => Promise<void>
  setTheme: (theme: ThemePreference) => Promise<void>
  setEdgeWakeEnabled: (enabled: boolean) => Promise<void>
  setAutoHideOnBlur: (enabled: boolean) => Promise<void>
  startSearch: (engine: SearchEngine, query: string) => Promise<void>
  setSearchBounds: (bounds: SearchBounds | null) => Promise<void>
  exitSearch: () => Promise<void>
  openPreview: () => Promise<void>
  closePreview: () => Promise<void>
  pinPreview: (info: PreviewInfo) => Promise<void>
  openDialog: () => Promise<void>
  closeDialog: () => Promise<void>
  getUpdateState: () => Promise<UpdateState>
  checkForUpdates: () => Promise<UpdateState>
  downloadUpdate: () => Promise<UpdateState>
  installUpdate: () => Promise<void>
  hide: () => Promise<void>
  quit: () => Promise<void>
  onTabsChanged: (cb: (tabs: Tab[]) => void) => () => void
  onTabRemoveRequested: (cb: (id: string) => void) => () => void
  onActiveTabChanged: (cb: (id: string | null) => void) => () => void
  onNavigationChanged: (cb: (state: NavigationState) => void) => () => void
  onSettingsShow: (cb: () => void) => () => void
  onUpdateStateChanged: (cb: (state: UpdateState) => void) => () => void
  onPreviewShow: (cb: (info: PreviewInfo) => void) => () => void
  onSearchCompleted: (cb: () => void) => () => void
}

declare global {
  interface Window {
    slideweb: SlideWebAPI
  }
}
