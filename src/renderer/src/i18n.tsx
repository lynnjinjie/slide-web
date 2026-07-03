import { createContext, useContext, useMemo, type ReactNode } from 'react'

export type Lang = 'en' | 'zh'

type Dict = Record<string, string>

const en: Dict = {
  'rail.hide': 'Hide',
  'rail.history': 'Navigation history',
  'rail.back': 'Back',
  'rail.forward': 'Forward',
  'rail.addTab': 'Add tab',
  'rail.settings': 'Settings',
  'rail.removeConfirm': 'Remove "{title}"?',
  'rail.removeCancel': 'Cancel',
  'rail.removeOk': 'OK',

  'empty.title.line1': 'A quiet place',
  'empty.title.line2': 'for one more tab',
  'empty.body.beforePlus': 'Tap the ',
  'empty.body.afterPlus':
    ' on the left to pin a site. Anything with a URL — your inbox, a doc, a chat — lives here until you slide it away.',
  'empty.hint': 'Add tab',
  'empty.aria.add': 'Add tab',

  'addbar.prompt.beforeEm': 'what would you like\n',
  'addbar.prompt.em': 'beside',
  'addbar.prompt.afterEm': ' you?',
  'addbar.placeholder': 'paste a URL · or search',
  'addbar.label.url': 'Pin URL',
  'addbar.label.search': 'Search · {engine}',
  'addbar.label.hint': 'Hint',
  'addbar.hint.url': 'Press ↵ to pin this URL as a tab.',
  'addbar.hint.search':
    'Press ↵ to search. Click a result to pin it to the sidebar.',
  'addbar.hint.empty':
    'Paste a URL to pin a site. Type words to search with Google or Baidu.',
  'addbar.search.title': 'Search results',
  'addbar.search.close': 'Close',
  'addbar.search.loading': 'Loading search results...',

  'settings.brand': 'Slide Web · Settings',
  'settings.prompt.beforeEm': 'Make it ',
  'settings.prompt.em': 'yours',
  'settings.prompt.afterEm': '.',
  'settings.close': 'Close settings',
  'settings.quit': 'Quit app',
  'settings.hotkey.name': 'Toggle shortcut',
  'settings.hotkey.desc': 'Show / hide the panel from anywhere.',
  'settings.hotkey.recording': 'Press a shortcut · esc to cancel',
  'settings.hotkey.error': 'Could not set shortcut',
  'settings.language.name': 'Language',
  'settings.language.desc': 'Interface language.',
  'settings.language.en': 'English',
  'settings.language.zh': '中文',
  'settings.edgeWake.name': 'Edge wake',
  'settings.edgeWake.desc': 'When hidden, move the cursor to the screen edge to slide the app back.',
  'settings.edgeWake.on': 'On',
  'settings.edgeWake.off': 'Off',
  'settings.update.name': 'App updates',
  'settings.update.desc': 'Check GitHub Releases and install newer builds.',
  'settings.update.current': 'Current v{version}',
  'settings.update.idle': 'Ready to check for updates.',
  'settings.update.unsupported': 'Updates are available after installing a packaged app.',
  'settings.update.checking': 'Checking for updates...',
  'settings.update.available': 'Slide Web v{version} is available.',
  'settings.update.notAvailable': 'You are already on the latest version.',
  'settings.update.downloading': 'Downloading... {percent}%',
  'settings.update.downloaded': 'Slide Web v{version} is ready to install.',
  'settings.update.error': 'Update check failed: {message}',
  'settings.update.check': 'Check for updates',
  'settings.update.download': 'Download update',
  'settings.update.install': 'Restart and install',
  'settings.update.progress': 'Update download progress',
  'settings.update.releaseNotes': 'Release notes',
  'settings.reset': 'Reset to default',

  'preview.pin': 'Pin to sidebar',
  'preview.close': 'Close',
  'preview.badge': 'Preview',
  'preview.question.beforeEm': 'Keep this ',
  'preview.question.em': 'beside',
  'preview.question.afterEm': ' you?',
  'preview.aria': 'Preview link',
}

const zh: Dict = {
  'rail.hide': '隐藏',
  'rail.history': '导航历史',
  'rail.back': '后退',
  'rail.forward': '前进',
  'rail.addTab': '添加标签页',
  'rail.settings': '设置',
  'rail.removeConfirm': '移除 "{title}"？',
  'rail.removeCancel': '取消',
  'rail.removeOk': '确定',

  'empty.title.line1': '一处安静的角落',
  'empty.title.line2': '再放一个标签',
  'empty.body.beforePlus': '点击左侧的 ',
  'empty.body.afterPlus':
    ' 把一个网站固定到这里。任何带 URL 的东西——邮箱、文档、聊天——都可以陪在你身边，直到你把它滑走。',
  'empty.hint': '添加标签页',
  'empty.aria.add': '添加标签页',

  'addbar.prompt.beforeEm': '想让什么\n',
  'addbar.prompt.em': '陪',
  'addbar.prompt.afterEm': '在身边？',
  'addbar.placeholder': '粘贴 URL · 或搜索',
  'addbar.label.url': '固定 URL',
  'addbar.label.search': '搜索 · {engine}',
  'addbar.label.hint': '提示',
  'addbar.hint.url': '按 ↵ 把这个 URL 固定为标签页。',
  'addbar.hint.search': '按 ↵ 开始搜索。点击结果会直接固定到侧边栏。',
  'addbar.hint.empty': '粘贴 URL 固定网站，输入文字用 Google 或百度搜索。',
  'addbar.search.title': '搜索结果',
  'addbar.search.close': '关闭',
  'addbar.search.loading': '正在加载搜索结果...',

  'settings.brand': 'Slide Web · 设置',
  'settings.prompt.beforeEm': '随你',
  'settings.prompt.em': '心意',
  'settings.prompt.afterEm': '。',
  'settings.close': '关闭设置',
  'settings.quit': '退出应用',
  'settings.hotkey.name': '切换快捷键',
  'settings.hotkey.desc': '从任何地方显示 / 隐藏面板。',
  'settings.hotkey.recording': '按下快捷键 · esc 取消',
  'settings.hotkey.error': '无法注册该快捷键',
  'settings.language.name': '语言',
  'settings.language.desc': '界面显示语言。',
  'settings.language.en': 'English',
  'settings.language.zh': '中文',
  'settings.edgeWake.name': '边缘唤醒',
  'settings.edgeWake.desc': '隐藏后，把鼠标移到屏幕边缘即可滑出应用。',
  'settings.edgeWake.on': '开启',
  'settings.edgeWake.off': '关闭',
  'settings.update.name': '应用更新',
  'settings.update.desc': '检查 GitHub Releases，并安装新版本。',
  'settings.update.current': '当前 v{version}',
  'settings.update.idle': '可以检查是否有新版本。',
  'settings.update.unsupported': '更新功能在打包安装后的应用中可用。',
  'settings.update.checking': '正在检查更新...',
  'settings.update.available': '发现 Slide Web v{version}。',
  'settings.update.notAvailable': '当前已经是最新版本。',
  'settings.update.downloading': '正在下载... {percent}%',
  'settings.update.downloaded': 'Slide Web v{version} 已下载，可以安装。',
  'settings.update.error': '检查更新失败：{message}',
  'settings.update.check': '检查更新',
  'settings.update.download': '下载更新',
  'settings.update.install': '重启并安装',
  'settings.update.progress': '更新下载进度',
  'settings.update.releaseNotes': '更新说明',
  'settings.reset': '恢复默认',

  'preview.pin': '固定到侧栏',
  'preview.close': '关闭',
  'preview.badge': '预览',
  'preview.question.beforeEm': '把它留在',
  'preview.question.em': '身边',
  'preview.question.afterEm': '吗？',
  'preview.aria': '预览链接',
}

const dict: Record<Lang, Dict> = { en, zh }

type Ctx = { lang: Lang; t: (key: string, vars?: Record<string, string>) => string }
const I18nContext = createContext<Ctx>({ lang: 'en', t: (k) => k })

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo<Ctx>(() => {
    return {
      lang,
      t(key, vars) {
        let str = dict[lang]?.[key] ?? dict.en[key] ?? key
        if (vars) {
          for (const [k, v] of Object.entries(vars)) {
            str = str.replaceAll(`{${k}}`, v)
          }
        }
        return str
      },
    }
  }, [lang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useT() {
  return useContext(I18nContext).t
}

export function useLang() {
  return useContext(I18nContext).lang
}
