import { app, BaseWindow, WebContentsView, globalShortcut, screen, ipcMain, session } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import type { Language, PreviewInfo, SearchBounds, SearchEngine, Settings, Tab } from '../shared/types'
import {
  buildSearchUrl,
  extractRealUrl,
  isSearchEngineUrl,
  normalizeUrlInput,
} from '../shared/navigation'

const DEFAULT_WIDTH = 1000
const DEFAULT_HEIGHT = 800
const MIN_WIDTH = 360
const MIN_HEIGHT = 320
const RAIL_WIDTH = 56

let win: BaseWindow | null = null
let uiView: WebContentsView | null = null
const tabViews = new Map<string, WebContentsView>()
let tabs: Tab[] = []
let activeTabId: string | null = null
let addbarOpen = false
let settingsOpen = false
let previewOpen = false
let isVisible = true

// Transient search session. searchView is created on demand and destroyed on exit.
let searchView: WebContentsView | null = null
let searchSession: { engine: SearchEngine; query: string } | null = null
let searchPopupBounds: SearchBounds | null = null

const DEFAULT_HOTKEY = 'CommandOrControl+Shift+\\'
let settings: Settings = { toggleHotkey: DEFAULT_HOTKEY, language: 'en' }
let storePath = ''
let animating = false
const SNAP_THRESHOLD = 30 // px — within this distance from work-area right edge, snap
const MOVE_END_DELAY = 220 // ms — treat "no move events for this long" as a drag-end
let moveEndTimer: NodeJS.Timeout | null = null

type SnapSide = 'left' | 'right' | null
type WindowState = {
  width: number
  height: number
  x: number
  y: number
  snapped: SnapSide
}
let windowState: WindowState = {
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  x: -1, // sentinels — set in createWindow on first launch
  y: -1,
  snapped: 'right',
}

/* ────── persistence ────── */
type StoreShape = {
  tabs?: Tab[]
  activeTabId?: string | null
  window?: WindowState
  settings?: Settings
  size?: { width: number; height: number } // legacy
}

async function loadStore() {
  storePath = path.join(app.getPath('userData'), 'tabs.json')
  try {
    const raw = await fs.readFile(storePath, 'utf-8')
    const data = JSON.parse(raw) as StoreShape
    tabs = data.tabs ?? []
    activeTabId = data.activeTabId ?? (tabs[0]?.id ?? null)
    if (data.window) {
      const raw = data.window.snapped as unknown
      let snapped: SnapSide
      if (raw === 'left') snapped = 'left'
      else if (raw === 'right' || raw === true) snapped = 'right'
      else snapped = null
      windowState = {
        width: Math.max(MIN_WIDTH, data.window.width || DEFAULT_WIDTH),
        height: Math.max(MIN_HEIGHT, data.window.height || DEFAULT_HEIGHT),
        x: data.window.x ?? -1,
        y: data.window.y ?? -1,
        snapped,
      }
    } else if (data.size) {
      // legacy migration
      windowState.width = Math.max(MIN_WIDTH, data.size.width)
      windowState.height = Math.max(MIN_HEIGHT, data.size.height)
      windowState.snapped = 'right'
    }
    // Safety: if stored free-floating position is off-screen, fall back to right snap.
    if (!windowState.snapped && !isOnAnyScreen(windowState)) {
      windowState.snapped = 'right'
    }
    if (data.settings?.toggleHotkey) {
      settings.toggleHotkey = data.settings.toggleHotkey
    }
    if (data.settings?.language === 'en' || data.settings?.language === 'zh') {
      settings.language = data.settings.language
    } else {
      // First-launch default: pick from OS locale (zh-* → zh, otherwise en)
      const locale = app.getLocale().toLowerCase()
      settings.language = locale.startsWith('zh') ? 'zh' : 'en'
    }
  } catch {
    tabs = []
    activeTabId = null
  }
}

function isOnAnyScreen(s: { x: number; y: number; width: number; height: number }) {
  return screen.getAllDisplays().some((d) => {
    const w = d.workArea
    return (
      s.x + s.width > w.x &&
      s.x < w.x + w.width &&
      s.y + s.height > w.y &&
      s.y < w.y + w.height
    )
  })
}

async function saveStore() {
  try {
    const data: StoreShape = { tabs, activeTabId, window: windowState, settings }
    await fs.writeFile(storePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('[slide-web] saveStore failed', err)
  }
}

let saveTimer: NodeJS.Timeout | null = null
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    saveStore()
  }, 400)
}

/* ────── layout ────── */
function snappedBoundsFor(width: number, height: number) {
  const work = screen.getPrimaryDisplay().workArea
  return {
    x: work.x + work.width - width,
    y: work.y + Math.max(0, Math.round((work.height - height) / 2)),
    width,
    height,
  }
}

function clampY(y: number, height: number) {
  const work = screen.getPrimaryDisplay().workArea
  return Math.max(work.y, Math.min(y, work.y + work.height - height))
}

// Where the window should live based on current state (snapped vs. free).
// When snapped, only x is forced to the snap edge — y is whatever the user
// last had (so hide+show doesn't reset vertical position).
function targetBounds() {
  const work = screen.getPrimaryDisplay().workArea
  const width = Math.min(windowState.width, work.width)
  const height = Math.min(windowState.height, work.height)
  if (windowState.snapped === 'right') {
    return { x: work.x + work.width - width, y: clampY(windowState.y, height), width, height }
  }
  if (windowState.snapped === 'left') {
    return { x: work.x, y: clampY(windowState.y, height), width, height }
  }
  return { x: windowState.x, y: windowState.y, width, height }
}

function relayout() {
  if (!win || !uiView) return
  const b = win.getBounds()
  const overlayOpen = addbarOpen || settingsOpen || previewOpen
  const hasContent = tabs.length > 0
  const uiW = overlayOpen || !hasContent ? b.width : RAIL_WIDTH
  uiView.setBounds({ x: 0, y: 0, width: uiW, height: b.height })

  const tabX = RAIL_WIDTH
  const tabW = b.width - RAIL_WIDTH

  if (searchView && searchSession) {
    const showSearchPopup = addbarOpen && !settingsOpen && !previewOpen && searchPopupBounds !== null
    if (showSearchPopup && searchPopupBounds) {
      searchView.setBounds(searchPopupBounds)
    }
    searchView.setVisible(showSearchPopup)
    for (const view of tabViews.values()) {
      view.setVisible(false)
    }
  } else {
    const showTab = !overlayOpen && tabs.length > 0
    for (const [id, view] of tabViews) {
      view.setBounds({ x: tabX, y: 0, width: tabW, height: b.height })
      view.setVisible(showTab && id === activeTabId)
    }
  }
}

const SNAP_ANIM_DURATION = 220

// Called when the user releases the window after a drag. Decides which edge
// (if any) to snap to and animates a "bounce back" to that position when the
// drag overshot. Free-floating drags get a quick clamp into the work area.
function onDragEnd() {
  if (!win || animating) return
  if (moveEndTimer) {
    clearTimeout(moveEndTimer)
    moveEndTimer = null
  }
  const b = win.getBounds()
  const work = screen.getPrimaryDisplay().workArea
  const distFromRight = work.x + work.width - (b.x + b.width)
  const distFromLeft = b.x - work.x

  // Determine snap side. Negative distances mean the window was dragged past
  // that edge — still counts as a snap.
  let side: SnapSide = null
  let targetX = b.x
  if (distFromRight < SNAP_THRESHOLD && distFromRight < distFromLeft) {
    side = 'right'
    targetX = work.x + work.width - b.width
  } else if (distFromLeft < SNAP_THRESHOLD) {
    side = 'left'
    targetX = work.x
  }

  const targetY = clampY(b.y, b.height)

  if (side) {
    // Snap y instantly so the bounce-back is a clean horizontal slide.
    if (b.y !== targetY) {
      win.setBounds({ x: b.x, y: targetY, width: b.width, height: b.height })
    }
    windowState.snapped = side
    windowState.x = targetX
    windowState.y = targetY

    if (b.x !== targetX) {
      animating = true
      animateX(targetX, SNAP_ANIM_DURATION, () => {
        animating = false
      })
    }
  } else {
    // Free-floating: clamp into the work area so the window never gets lost.
    const cx = Math.max(work.x, Math.min(b.x, work.x + work.width - b.width))
    const cy = clampY(b.y, b.height)
    if (cx !== b.x || cy !== b.y) {
      win.setBounds({ x: cx, y: cy, width: b.width, height: b.height })
    }
    windowState.x = cx
    windowState.y = cy
    windowState.snapped = null
  }
  scheduleSave()
}

/* ────── window + views ────── */
function createWindow() {
  // First-launch initialization (sentinel x/y from defaults).
  if (windowState.x < 0 || windowState.y < 0) {
    const init = snappedBoundsFor(windowState.width, windowState.height)
    windowState.x = init.x
    windowState.y = init.y
    windowState.snapped = 'right'
  }
  const b = targetBounds()

  win = new BaseWindow({
    x: b.x,
    y: b.y,
    width: b.width,
    height: b.height,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    frame: false,
    backgroundColor: '#1a1815',
    alwaysOnTop: true,
    resizable: true,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: false,
    show: true,
  })

  if (process.platform === 'darwin') {
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  }
  win.setAlwaysOnTop(true, 'floating')

  // Resize: keep full bounds in sync (top/left-edge drag also changes x/y).
  win.on('resize', () => {
    if (!win || animating) return
    const b = win.getBounds()
    windowState.width = b.width
    windowState.height = b.height
    windowState.x = b.x
    windowState.y = b.y
    relayout()
    scheduleSave()
  })

  // Move: just track the current position. We don't have a reliable "drag-end"
  // event in Electron — `'moved'` on macOS is just an alias of `'move'` and
  // fires continuously while dragging. So we debounce: when no move event has
  // fired for MOVE_END_DELAY ms, treat that as a release and commit the snap.
  win.on('move', () => {
    if (!win || animating) return
    const b = win.getBounds()
    windowState.x = b.x
    windowState.y = b.y
    if (moveEndTimer) clearTimeout(moveEndTimer)
    moveEndTimer = setTimeout(onDragEnd, MOVE_END_DELAY)
  })

  // ── UI WebContentsView (rail + addbar + empty state)
  uiView = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
    },
  })
  uiView.setBackgroundColor('#00000000')
  win.contentView.addChildView(uiView)

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) {
    uiView.webContents.loadURL(devUrl)
  } else {
    uiView.webContents.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Restore persisted tabs as WebContentsViews
  for (const t of tabs) {
    createTabView(t)
  }

  relayout()
  isVisible = true
}

function deElectronUA(view: WebContentsView) {
  const ua = view.webContents.getUserAgent()
  const cleaned = ua
    .replace(/ Electron\/[^ ]+/g, '')
    .replace(/ slide-web\/[^ ]+/g, '')
    .replace(/ Slide-web\/[^ ]+/g, '')
  view.webContents.setUserAgent(cleaned)
}

function createTabView(tab: Tab): WebContentsView {
  if (!win) throw new Error('window not ready')
  const ses = session.fromPartition(`persist:${tab.id}`)
  const view = new WebContentsView({
    webPreferences: {
      session: ses,
      contextIsolation: true,
      sandbox: true,
    },
  })
  view.setBackgroundColor('#FAFAF7')
  deElectronUA(view)

  view.webContents.on('page-title-updated', (_e, title) => {
    const i = tabs.findIndex((x) => x.id === tab.id)
    if (i >= 0) {
      syncTabLocation(tab.id, view.webContents.getURL())
      if (title && title !== tabs[i].title) {
        tabs[i].title = title
        saveStore()
        uiView?.webContents.send('tabs:changed', tabs)
      }
    }
  })
  view.webContents.on('did-navigate', (_e, url) => {
    syncTabLocation(tab.id, url)
  })
  view.webContents.on('did-navigate-in-page', (_e, url, isMainFrame) => {
    if (isMainFrame) syncTabLocation(tab.id, url)
  })
  view.webContents.on('did-finish-load', () => {
    syncTabLocation(tab.id, view.webContents.getURL())
  })
  view.webContents.on('did-fail-load', (_e, code, desc, url) => {
    if (code === -3) return // ABORTED — harmless
    console.warn('[slide-web] load failed', tab.id, code, desc, url)
  })

  // Insert below the UI view in z-order (index 0 = bottom)
  win.contentView.addChildView(view, 0)
  tabViews.set(tab.id, view)
  view.webContents.loadURL(tab.url).catch((err) => console.error('[slide-web] loadURL failed', err))
  return view
}

function syncTabLocation(id: string, rawUrl: string) {
  if (!rawUrl) return
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return

  const i = tabs.findIndex((x) => x.id === id)
  if (i < 0) return

  const nextUrl = url.toString()
  const nextHost = url.hostname
  if (tabs[i].url === nextUrl && tabs[i].host === nextHost) return

  tabs[i] = { ...tabs[i], url: nextUrl, host: nextHost }
  saveStore()
  uiView?.webContents.send('tabs:changed', tabs)
}

function destroyTabView(id: string) {
  const view = tabViews.get(id)
  if (!view) return
  win?.contentView.removeChildView(view)
  // @ts-ignore — webContents.close() exists at runtime
  view.webContents.close?.()
  tabViews.delete(id)
}

/* ────── tab ops ────── */
function addTab(input: { url: string; title?: string }): Tab {
  const url = normalizeUrlInput(input.url)
  const host = new URL(url).hostname
  const tab: Tab = {
    id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    url,
    title: input.title || host,
    host,
  }
  tabs.push(tab)
  createTabView(tab)
  setActiveTab(tab.id) // also calls relayout + saveStore + notify
  uiView?.webContents.send('tabs:changed', tabs)
  return tab
}

function removeTab(id: string) {
  destroyTabView(id)
  tabs = tabs.filter((t) => t.id !== id)
  if (activeTabId === id) {
    activeTabId = tabs[tabs.length - 1]?.id ?? null
    uiView?.webContents.send('active:changed', activeTabId)
  }
  relayout()
  saveStore()
  uiView?.webContents.send('tabs:changed', tabs)
}

function setActiveTab(id: string | null) {
  if (id !== null && !tabViews.has(id)) return
  // Picking a real tab implicitly exits any search session
  if (searchSession) exitSearch()
  activeTabId = id
  relayout()
  saveStore()
  uiView?.webContents.send('active:changed', activeTabId)
}

function setAddbar(open: boolean) {
  addbarOpen = open
  if (open) settingsOpen = false // only one overlay at a time
  else exitSearch()
  relayout()
}

function setSettings(open: boolean) {
  settingsOpen = open
  if (open) {
    addbarOpen = false
    exitSearch()
  }
  relayout()
}

function setPreview(open: boolean) {
  previewOpen = open
  relayout()
}

/* ────── Search ────── */

// HEAD-request a URL to capture its 30x Location header. Used to resolve
// Baidu /link?url=<hash> redirects since the hash isn't the actual destination.
async function followRedirect(url: string): Promise<string | null> {
  try {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), 4000)
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: ac.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      },
    })
    clearTimeout(timer)
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (loc) return loc
    }
  } catch (err) {
    console.warn('[slide-web] followRedirect failed', err)
  }
  return null
}

async function resolveRealUrl(url: string): Promise<string> {
  const sync = extractRealUrl(url)
  if (sync !== url) return sync
  try {
    const u = new URL(url)
    // Baidu: follow the /link?url=<hash> redirect to get the real destination
    if (u.hostname.endsWith('baidu.com') && u.pathname === '/link') {
      const real = await followRedirect(url)
      if (real) return real
    }
  } catch {
    /* ignore */
  }
  return url
}

function sendPreview(url: string, title?: string) {
  if (!uiView) return
  let host = url
  try {
    host = new URL(url).hostname
  } catch {
    /* ignore */
  }
  const info: PreviewInfo = { url, title, host }
  uiView.webContents.send('preview:show', info)
}

function pinSearchResult(url: string) {
  let target: URL
  try {
    target = new URL(url)
  } catch {
    console.warn('[slide-web] ignored invalid search result URL', url)
    return
  }
  exitSearch()
  setAddbar(false)
  addTab({ url: target.toString(), title: target.hostname })
  uiView?.webContents.send('search:completed')
}

function pinSearchNavigation(url: string) {
  resolveRealUrl(url)
    .then((real) => {
      if (isSearchEngineUrl(real)) {
        searchView?.webContents.loadURL(real).catch((err) => {
          console.warn('[slide-web] search internal load failed', err)
        })
        return
      }
      pinSearchResult(real)
    })
    .catch((err) => {
      console.warn('[slide-web] resolveRealUrl failed', err)
      pinSearchResult(url)
    })
}

function handleSearchMainFrameNavigation(event: {
  preventDefault: () => void
  url: string
  isMainFrame?: boolean
}) {
  if (event.isMainFrame === false) return
  if (isSearchEngineUrl(event.url)) return
  event.preventDefault()
  pinSearchNavigation(event.url)
}

function startSearch(engine: SearchEngine, query: string) {
  if (!win) return
  // Tear down a previous search view if any
  exitSearch()

  addbarOpen = true
  settingsOpen = false
  searchSession = { engine, query }
  const ses = session.fromPartition('persist:__search__')
  searchView = new WebContentsView({
    webPreferences: {
      session: ses,
      contextIsolation: true,
      sandbox: true,
    },
  })
  searchView.setBackgroundColor('#FAFAF7')
  searchView.setVisible(false)
  deElectronUA(searchView)

  // Intercept link clicks (in-frame navigation)
  searchView.webContents.on('will-navigate', (event) => handleSearchMainFrameNavigation(event))
  searchView.webContents.on('will-redirect', (event) => handleSearchMainFrameNavigation(event))
  // Intercept target=_blank / window.open
  searchView.webContents.setWindowOpenHandler(({ url }) => {
    if (isSearchEngineUrl(url)) {
      searchView?.webContents.loadURL(url).catch((err) => {
        console.warn('[slide-web] search window-open load failed', err)
      })
    } else {
      pinSearchNavigation(url)
    }
    return { action: 'deny' }
  })

  // Insert above the UI view, but bounds keep it inside the AddBar search popup.
  win.contentView.addChildView(searchView)
  searchView.webContents.loadURL(buildSearchUrl(engine, query)).catch((err) => {
    console.error('[slide-web] search loadURL failed', err)
  })
  relayout()
}

function exitSearch() {
  if (!win || !searchView) {
    searchSession = null
    return
  }
  try {
    win.contentView.removeChildView(searchView)
    // @ts-ignore — close exists at runtime
    searchView.webContents.close?.()
  } catch (err) {
    console.warn('[slide-web] exitSearch cleanup', err)
  }
  searchView = null
  searchSession = null
  searchPopupBounds = null
  relayout()
}

function setSearchBounds(bounds: SearchBounds | null) {
  if (!bounds) {
    searchPopupBounds = null
    relayout()
    return
  }
  searchPopupBounds = {
    x: Math.max(0, Math.round(bounds.x)),
    y: Math.max(0, Math.round(bounds.y)),
    width: Math.max(80, Math.round(bounds.width)),
    height: Math.max(80, Math.round(bounds.height)),
  }
  relayout()
}

function applyHotkey(accelerator: string): { ok: boolean; error?: string } {
  if (!accelerator) return { ok: false, error: 'Empty shortcut' }
  globalShortcut.unregisterAll()
  const ok = globalShortcut.register(accelerator, toggleVisible)
  if (!ok) {
    // Re-register previous, then report failure
    globalShortcut.register(settings.toggleHotkey, toggleVisible)
    return { ok: false, error: 'Shortcut could not be registered (in use?)' }
  }
  settings.toggleHotkey = accelerator
  saveStore()
  return { ok: true }
}

/* ────── show/hide with slide animation ────── */
const SHOW_DURATION = 240
const HIDE_DURATION = 200

function hiddenX() {
  const work = screen.getPrimaryDisplay().workArea
  if (windowState.snapped === 'left') {
    return work.x - windowState.width
  }
  return work.x + work.width
}

function animateX(targetX: number, durationMs: number, done: () => void) {
  if (!win) return done()
  const b0 = win.getBounds()
  const startX = b0.x
  const dist = targetX - startX
  if (dist === 0) return done()
  const t0 = Date.now()
  const tick = () => {
    if (!win) return
    const t = Math.min((Date.now() - t0) / durationMs, 1)
    const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
    const x = Math.round(startX + dist * eased)
    const b = win.getBounds()
    win.setBounds({ x, y: b.y, width: b.width, height: b.height })
    if (t < 1) setTimeout(tick, 16)
    else done()
  }
  tick()
}

function show() {
  if (!win || animating || isVisible) return
  const target = targetBounds()

  if (!windowState.snapped) {
    // Free-floating: behave like a normal app. No slide, restore last position.
    win.setBounds(target)
    win.show()
    isVisible = true
    return
  }

  // Snapped: slide in from the snapped edge (hiddenX() picks the direction).
  animating = true
  win.setBounds({ x: hiddenX(), y: target.y, width: target.width, height: target.height })
  win.show()
  isVisible = true
  animateX(target.x, SHOW_DURATION, () => {
    animating = false
  })
}

function hide() {
  if (!win || animating || !isVisible) return

  if (!windowState.snapped) {
    // Free-floating: just hide. Position is preserved in windowState.
    win.hide()
    isVisible = false
    return
  }

  animating = true
  animateX(hiddenX(), HIDE_DURATION, () => {
    win?.hide()
    isVisible = false
    animating = false
  })
}

function toggleVisible() {
  if (isVisible) hide()
  else show()
}

/* ────── IPC ────── */
function setupIpc() {
  ipcMain.handle('tabs:get', () => tabs)
  ipcMain.handle('active:get', () => activeTabId)
  ipcMain.handle('tabs:add', (_e, input: { url: string; title?: string }) => addTab(input))
  ipcMain.handle('tabs:remove', (_e, id: string) => removeTab(id))
  ipcMain.handle('tabs:select', (_e, id: string) => setActiveTab(id))
  ipcMain.handle('addbar:open', () => setAddbar(true))
  ipcMain.handle('addbar:close', () => setAddbar(false))
  ipcMain.handle('settings:open', () => setSettings(true))
  ipcMain.handle('settings:close', () => setSettings(false))
  ipcMain.handle('settings:get', () => settings)
  ipcMain.handle('settings:setHotkey', (_e, hotkey: string) => applyHotkey(hotkey))
  ipcMain.handle('settings:setLanguage', (_e, language: Language) => {
    if (language !== 'en' && language !== 'zh') return
    settings.language = language
    saveStore()
  })
  ipcMain.handle(
    'search:start',
    (_e, input: { engine: SearchEngine; query: string }) => startSearch(input.engine, input.query),
  )
  ipcMain.handle('search:setBounds', (_e, bounds: SearchBounds | null) => setSearchBounds(bounds))
  ipcMain.handle('search:exit', () => exitSearch())
  ipcMain.handle('preview:open', () => setPreview(true))
  ipcMain.handle('preview:close', () => setPreview(false))
  ipcMain.handle('preview:pin', (_e, info: PreviewInfo) => {
    setPreview(false)
    exitSearch()
    addTab({ url: info.url, title: info.title || info.host })
  })
  ipcMain.handle('window:hide', () => hide())
}

/* ────── app lifecycle ────── */
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!win) return
    if (!isVisible) toggleVisible()
  })

  app.whenReady().then(async () => {
    await loadStore()
    setupIpc()
    createWindow()

    const ok = globalShortcut.register(settings.toggleHotkey, toggleVisible)
    if (!ok) {
      console.warn('[slide-web] failed to register saved shortcut; falling back')
      // If the saved one is unavailable, try the default
      if (settings.toggleHotkey !== DEFAULT_HOTKEY) {
        const fallback = globalShortcut.register(DEFAULT_HOTKEY, toggleVisible)
        if (fallback) settings.toggleHotkey = DEFAULT_HOTKEY
      }
    }

    screen.on('display-metrics-changed', () => {
      if (!win) return
      // If the saved free-floating position is now off-screen, fall back to right snap.
      if (!windowState.snapped && !isOnAnyScreen(windowState)) {
        windowState.snapped = 'right'
      }
      const b = targetBounds()
      win.setBounds(b)
      relayout()
    })
  })

  app.on('activate', () => {
    if (win && !isVisible) show()
  })
  app.on('will-quit', () => globalShortcut.unregisterAll())
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
