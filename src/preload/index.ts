import { contextBridge, ipcRenderer } from 'electron'
import type { NavigationState, PreviewInfo, SlideWebAPI, Tab } from '../shared/types'

const api: SlideWebAPI = {
  getTabs: () => ipcRenderer.invoke('tabs:get'),
  getActiveTabId: () => ipcRenderer.invoke('active:get'),
  getNavigationState: () => ipcRenderer.invoke('navigation:get'),
  goBack: () => ipcRenderer.invoke('navigation:back'),
  goForward: () => ipcRenderer.invoke('navigation:forward'),
  addTab: (input) => ipcRenderer.invoke('tabs:add', input),
  removeTab: (id) => ipcRenderer.invoke('tabs:remove', id),
  selectTab: (id) => ipcRenderer.invoke('tabs:select', id),
  openAddbar: () => ipcRenderer.invoke('addbar:open'),
  closeAddbar: () => ipcRenderer.invoke('addbar:close'),
  openSettings: () => ipcRenderer.invoke('settings:open'),
  closeSettings: () => ipcRenderer.invoke('settings:close'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setHotkey: (hotkey) => ipcRenderer.invoke('settings:setHotkey', hotkey),
  setLanguage: (language) => ipcRenderer.invoke('settings:setLanguage', language),
  setEdgeWakeEnabled: (enabled) => ipcRenderer.invoke('settings:setEdgeWakeEnabled', enabled),
  startSearch: (engine, query) => ipcRenderer.invoke('search:start', { engine, query }),
  setSearchBounds: (bounds) => ipcRenderer.invoke('search:setBounds', bounds),
  exitSearch: () => ipcRenderer.invoke('search:exit'),
  openPreview: () => ipcRenderer.invoke('preview:open'),
  closePreview: () => ipcRenderer.invoke('preview:close'),
  pinPreview: (info) => ipcRenderer.invoke('preview:pin', info),
  openDialog: () => ipcRenderer.invoke('dialog:open'),
  closeDialog: () => ipcRenderer.invoke('dialog:close'),
  hide: () => ipcRenderer.invoke('window:hide'),
  quit: () => ipcRenderer.invoke('app:quit'),
  onTabsChanged: (cb) => {
    const handler = (_e: Electron.IpcRendererEvent, t: Tab[]) => cb(t)
    ipcRenderer.on('tabs:changed', handler)
    return () => ipcRenderer.off('tabs:changed', handler)
  },
  onActiveTabChanged: (cb) => {
    const handler = (_e: Electron.IpcRendererEvent, id: string | null) => cb(id)
    ipcRenderer.on('active:changed', handler)
    return () => ipcRenderer.off('active:changed', handler)
  },
  onNavigationChanged: (cb) => {
    const handler = (_e: Electron.IpcRendererEvent, state: NavigationState) => cb(state)
    ipcRenderer.on('navigation:changed', handler)
    return () => ipcRenderer.off('navigation:changed', handler)
  },
  onSettingsShow: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('settings:show', handler)
    return () => ipcRenderer.off('settings:show', handler)
  },
  onPreviewShow: (cb) => {
    const handler = (_e: Electron.IpcRendererEvent, info: PreviewInfo) => cb(info)
    ipcRenderer.on('preview:show', handler)
    return () => ipcRenderer.off('preview:show', handler)
  },
  onSearchCompleted: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('search:completed', handler)
    return () => ipcRenderer.off('search:completed', handler)
  },
}

contextBridge.exposeInMainWorld('slideweb', api)
