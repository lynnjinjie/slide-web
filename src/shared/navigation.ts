import type { SearchEngine } from './types'

export function isLikelyUrlInput(input: string): boolean {
  const value = input.trim()
  if (!value || /\s/.test(value)) return false
  if (/^https?:\/\//i.test(value)) return true
  return /^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)+(\/[^\s]*)?$/i.test(value)
}

export function normalizeUrlInput(input: string): string {
  let url = input.trim()
  if (!url) throw new Error('empty url')
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  new URL(url)
  return url
}

export function buildSearchUrl(engine: SearchEngine, query: string): string {
  const q = encodeURIComponent(query)
  if (engine === 'baidu') return `https://www.baidu.com/s?wd=${q}`
  return `https://www.google.com/search?q=${q}`
}

function isGoogleHost(hostname: string): boolean {
  return /^(.+\.)?google\.[a-z.]+$/i.test(hostname)
}

function isBaiduHost(hostname: string): boolean {
  return /^(.+\.)?baidu\.com$/i.test(hostname)
}

function isGoogleVerificationUrl(u: URL): boolean {
  if (isGoogleHost(u.hostname)) {
    return /^\/(sorry|recaptcha)\b/.test(u.pathname)
  }
  if (u.hostname === 'recaptcha.google.com') return true
  if (u.hostname === 'www.recaptcha.net' || u.hostname === 'recaptcha.net') return true
  if (u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/recaptcha/')) return true
  return false
}

function isBaiduInternalUrl(u: URL): boolean {
  if (!isBaiduHost(u.hostname)) return false
  if (u.pathname.startsWith('/s')) return true
  if (u.pathname === '/link') return true
  if (/^\/(verify|security|safe|safecheck|intercept|captcha)\b/.test(u.pathname)) return true
  return /^(wappass|passport|verify|security|aq|safe)\.baidu\.com$/i.test(u.hostname)
}

function isSearchRedirectUrl(u: URL): boolean {
  if (isGoogleHost(u.hostname) && u.pathname === '/url') return true
  if (isBaiduHost(u.hostname) && u.pathname === '/link') return true
  return false
}

export function isSearchEngineUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (isSearchRedirectUrl(u)) return true
    if (isGoogleHost(u.hostname) && u.pathname.startsWith('/search')) return true
    if (isBaiduInternalUrl(u)) return true
    if (isGoogleVerificationUrl(u)) return true
    if (isGoogleHost(u.hostname) && /^\/(maps|images|search|preferences|gen_204|sorry|complete)/.test(u.pathname)) {
      return true
    }
    if (
      u.hostname === 'consent.google.com' ||
      u.hostname === 'accounts.google.com' ||
      u.hostname === 'support.google.com'
    ) {
      return true
    }
    return false
  } catch {
    return false
  }
}

export function extractRealUrl(url: string): string {
  try {
    const u = new URL(url)
    if (isGoogleHost(u.hostname)) {
      for (const key of ['q', 'url', 'adurl', 'imgurl']) {
        const value = u.searchParams.get(key)
        if (value && /^https?:\/\//i.test(value)) return value
      }
    }
    if (u.hostname.endsWith('googleadservices.com') || u.hostname.endsWith('doubleclick.net')) {
      for (const key of ['adurl', 'url']) {
        const value = u.searchParams.get(key)
        if (value && /^https?:\/\//i.test(value)) return value
      }
    }
  } catch {
    /* fall through */
  }
  return url
}
